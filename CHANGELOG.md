# Changelog

All notable changes to Pawn Party are recorded here, newest first.

This project uses [semantic versioning](https://semver.org): version numbers
look like MAJOR.MINOR.PATCH.

- **PATCH** (1.0.0 → 1.0.1) — a bug fix. Nothing new, something broken now works.
- **MINOR** (1.0.0 → 1.1.0) — a new feature, but everything old still works.
- **MAJOR** (1.0.0 → 2.0.0) — a big change that breaks how things used to work.

## [1.0.2] - 2026-08-30

### Added
- Build settings for AWS Amplify now live in the repo (`amplify.yml`) instead of
  only in the AWS console, so how the site gets built is visible next to the code.
- Caching rules for the deployed site: the fingerprinted files in `assets/` are
  cached for a long time because their names change whenever they change, while
  `index.html` is never cached so visitors always pick up the newest version.

## [1.0.0] - 2026-08-28

The first real version. 🎉

### Added
- 🎡 **Silly Wheel** — spin for one silly rule per game
- ⚔️ **Piece Battle** — tap captured pieces to track who is ahead on points
- 📔 **Sticker Book** — every game played earns a mystery sticker
- 🏰 **Royal Court** — a leaderboard of wins, ruled by the current champion
- Players and game history save in the browser between visits
