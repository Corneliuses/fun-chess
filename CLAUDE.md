# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Pawn Party is a companion app for playing chess with kids — a silly-rule wheel,
a captured-piece scoreboard, a sticker book, and a win leaderboard. It is a
static client-side React SPA. There is no backend, no API, no environment
variables, and no authentication. All state lives in the browser.

## Commands

```bash
npm install       # or `npm ci` to install exactly what package-lock.json pins
npm run dev       # Vite dev server, usually http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the built dist/ locally
```

There is **no test suite and no linter** in this project. Do not claim tests
pass, and do not add a test framework without being asked. `npm run build` is
the only automated check that exists; CI runs exactly that.

## Version bumps on every PR

**Before opening any pull request, ask the developer which version to bump.**
Use `AskUserQuestion` and offer exactly three choices:

- **major** — a breaking change; how the app works changes in a way that isn't
  backward compatible (1.0.0 → 2.0.0)
- **minor** — a new feature, with everything existing still working (1.0.0 → 1.1.0)
- **patch** — a bug fix only, nothing new (1.0.0 → 1.0.1)

Do not guess the answer, and do not skip the question because a change looks
small. Ask, then apply the answer before the PR is opened.

Applying a bump means three things move together, or the release is
inconsistent:

1. `npm version <major|minor|patch> --no-git-tag-version` — updates
   `package.json` and `package-lock.json`
2. A new entry at the top of `CHANGELOG.md`, matching the existing format
   (version, date, and `### Added` / `### Fixed` sections)
3. The git tag `vX.Y.Z`, created after merge on the release commit

This is enforced. The `Version bumped` CI job fails any pull request whose
`package.json` version still matches the base branch, or whose version moved
backwards. A PR that genuinely ships no user-visible change (a comment typo, a
CI tweak) can carry the `no-release` label to skip the check — use it sparingly,
and never to avoid asking the question.

Tag pushes may be rejected in sandboxed environments even when branch pushes
succeed. If `git push origin vX.Y.Z` fails, say so plainly rather than
reporting the release as complete, and tell the developer to create the tag
via the GitHub Releases UI.

## Architecture

### One component

The entire UI is `src/PawnParty.jsx` (~730 lines) — a single default-exported
React component holding all state via `useState`. There is no router; the
bottom-nav tabs (`play` / `stickers` / `court`) are just a `tab` state value, so
navigation never changes the URL. Styling is inline style objects throughout;
there is no CSS file and no CSS framework.

### The storage shim is load-bearing

`PawnParty.jsx` persists through `window.storage.get(key)` / `window.storage.set(key, value)`
— an async key-value API from the Claude artifact environment, which does not
exist in a normal browser. `src/storage-shim.js` defines it on top of
`localStorage`, and `src/main.jsx` imports it **on its first line, before React
and before the component**.

That ordering is an invariant. If the shim import is moved below the component
import or dropped, saving breaks silently — the component swallows storage
errors in `try/catch`, so there is no console error, and players and game
history just quietly stop persisting. `get` must keep returning `{ value }` (or
null), not a bare string, because the component reads `r.value`.

State is per-browser and per-device today. Clearing site data wipes it, and
nothing syncs between the tablet and the laptop. That is what v2 changes — see
"Planned for v2" below.

### Captured pieces are scored by inversion

The most bug-prone logic in the app. `captured[side][pieceKey]` counts how many
of **that side's own** pieces have been taken. But `material(side)` returns the
points that side has **earned**, which it computes from the *opponent's*
captured counts:

```js
material("w")  // sums captured["b"] — the black pieces White has taken
```

So clicking a piece in White's army row increases *Black's* score. When touching
`toggleSlot`, `material`, or the scoreboard, keep that inversion straight —
reading either function alone makes it easy to get backwards.

### Committed build output

`dist/` is tracked in git, which is unusual and deliberate. It does **not**
rebuild itself. If you change anything in `src/`, run `npm run build` and commit
the result, or the tracked bundle silently serves stale code — the deploy will
appear to succeed while running old JavaScript. Every rebuild changes the hashed
filename, so expect a large delete-plus-add diff.

If AWS Amplify is building from `main`, it uses its own build from source and
ignores the tracked `dist/` entirely, at which point these files are dead weight
and should be removed from git.

## Planned for v2: a database

v2 will move persistence out of the browser and into a real database, so that
players, game history and earned stickers survive across devices instead of
living in one browser's `localStorage`. The point is that the family's stats
accumulate over time rather than being lost when a browser is cleared or a game
is played on a different device.

This is not built yet. Do not start on it unless asked. The section exists so
that work landing before v2 does not paint it into a corner:

- **`src/storage-shim.js` is the seam.** Persistence is already isolated behind
  `window.storage.get` / `.set`, so v2 should replace the shim's implementation
  and leave the call sites in `PawnParty.jsx` alone. Route any new persistence
  through that interface rather than reaching for `localStorage` directly.
- **The interface is already async.** `get` and `set` return promises and the
  component awaits them, so swapping a local store for a network-backed one does
  not change how the component is written.
- **Player identity has to become real.** A player is currently
  `{ id: Date.now(), name, avatar }`, generated on whichever device added them.
  Stats that follow a person across devices need a stable identifier, so expect
  that shape to change and avoid persisting anything else keyed on `Date.now()`.
- **A database means a server**, which the app does not have today. It also
  turns a purely static deploy into one with a backend, so it affects the
  Amplify setup described under Deployment.

## Deployment

Static hosting only. AWS Amplify deploys from `main`; the publish directory is
`dist`. `.github/workflows/build.yml` builds on pushes to `main` and on PRs
targeting it, but it only verifies the build — it does not deploy and it does
not commit anything back.

`.nvmrc` pins the Node version and is read by CI, Amplify, and `nvm` alike.
Change it in one place, not in the workflow.

## External dependency

`PawnParty.jsx` pulls Fredoka and Nunito from `fonts.googleapis.com` via an
`@import` inside a `<style>` tag (~line 247). It is the app's only outbound
request. If a Content-Security-Policy is ever added, that origin needs
allowlisting or the app silently falls back to system fonts.

## Audience

The developer's kids read this repository and are learning git and versioning
from it. Favor clear commit messages and readable changelog entries over terse
ones.
