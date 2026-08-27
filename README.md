# Pawn Party! ♟️

Family chess night, but sillier. A little companion app for playing chess with kids:

- 🎡 **Silly Wheel** — spin for one silly rule per game (knights must neigh!)
- ⚔️ **Piece Battle** — tap captured pieces to track who's ahead on material
- 📔 **Sticker Book** — every game played earns a mystery sticker
- 🏰 **Royal Court** — the win leaderboard, ruled by the current champion

Players and game history are saved in the browser, so the party picks up where it left off.

## Running it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Project layout

- `src/PawnParty.jsx` — the whole app, a single React component
- `src/storage-shim.js` — backs the component's `window.storage` API with localStorage
