import { useState, useEffect, useRef } from "react";

// ---------- Data ----------
const AVATARS = ["🦁", "🐸", "🦄", "🐙", "🦖", "🐼", "🐝", "🦊", "👑", "🐢"];

const SILLY_RULES = [
  { text: "Knights must NEIGH when they move!", emoji: "🐴" },
  { text: "Winner does a victory dance!", emoji: "💃" },
  { text: "Everyone talks in robot voice!", emoji: "🤖" },
  { text: "Captured pieces say 'OUCHIE!'", emoji: "🤕" },
  { text: "Play with your silliest face on!", emoji: "🤪" },
  { text: "Announce the queen ROYALLY every move!", emoji: "👑" },
  { text: "Whisper game — shhh, everyone whispers!", emoji: "🤫" },
  { text: "Pawns are ninjas — say 'hi-YA!'", emoji: "🥷" },
  { text: "Hum your own theme song while thinking!", emoji: "🎵" },
  { text: "Bishops go 'WHEEE!' when they slide!", emoji: "⛷️" },
  { text: "Loser tells the winner one nice thing!", emoji: "😊" },
  { text: "Rooks stomp like elephants!", emoji: "🐘" },
];

const WHEEL_COLORS = ["#FF6B6B", "#FFC93C", "#4ECDC4", "#B983FF", "#FF9F68", "#6BCB77"];

const PIECES = [
  { k: "q", name: "Queen", val: 9, w: "♕", b: "♛", count: 1 },
  { k: "r", name: "Rook", val: 5, w: "♖", b: "♜", count: 2 },
  { k: "b", name: "Bishop", val: 3, w: "♗", b: "♝", count: 2 },
  { k: "n", name: "Knight", val: 3, w: "♘", b: "♞", count: 2 },
  { k: "p", name: "Pawn", val: 1, w: "♙", b: "♟", count: 8 },
];
const EMPTY_CAPT = { q: 0, r: 0, b: 0, n: 0, p: 0 };

const STICKERS = [
  { e: "🏆", n: "Tiny Trophy" }, { e: "🌟", n: "Super Star" }, { e: "🍕", n: "Pizza Pawn" },
  { e: "🦕", n: "Chess-o-saurus" }, { e: "🌈", n: "Rainbow Rook" }, { e: "🧁", n: "Cupcake Castle" },
  { e: "🚀", n: "Rocket Knight" }, { e: "🐲", n: "Board Dragon" }, { e: "🎩", n: "Fancy Bishop" },
  { e: "🍩", n: "Donut King" }, { e: "⚡", n: "Zippy Queen" }, { e: "🫧", n: "Bubble Pawn" },
  { e: "🦩", n: "Flamingo Move" }, { e: "🍉", n: "Melon Mate" }, { e: "🎪", n: "Circus Champ" },
  { e: "🐌", n: "Slow & Steady" }, { e: "🧀", n: "Cheesy Check" }, { e: "🪁", n: "High Flyer" },
];

const STORAGE_KEY = "pawn-party-state-v1";

// ---------- Small components ----------
function Confetti({ burst }) {
  if (!burst) return null;
  const bits = Array.from({ length: 24 }, (_, i) => i);
  const emojis = ["🎉", "⭐", "🎊", "💛", "♟️", "✨"];
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100, overflow: "hidden" }}>
      {bits.map((i) => (
        <span
          key={burst + "-" + i}
          style={{
            position: "absolute",
            left: Math.random() * 100 + "%",
            top: "-8%",
            fontSize: 18 + Math.random() * 22,
            animation: `pp-fall ${1.6 + Math.random() * 1.4}s ease-in forwards`,
            animationDelay: Math.random() * 0.4 + "s",
          }}
        >
          {emojis[i % emojis.length]}
        </span>
      ))}
    </div>
  );
}

function ChunkyButton({ children, onClick, color = "#FFC93C", disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Fredoka', sans-serif",
        fontSize: 18,
        fontWeight: 600,
        color: "#2B2244",
        background: disabled ? "#D8D3E8" : color,
        border: "3px solid #2B2244",
        borderRadius: 16,
        padding: "12px 20px",
        boxShadow: disabled ? "none" : "0 4px 0 #2B2244",
        cursor: disabled ? "default" : "pointer",
        transition: "transform .1s",
        width: "100%",
        ...style,
      }}
      onPointerDown={(e) => !disabled && (e.currentTarget.style.transform = "translateY(3px)")}
      onPointerUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onPointerLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#FFF9EF",
        border: "3px solid #2B2244",
        borderRadius: 20,
        boxShadow: "0 5px 0 #2B2244",
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------- Main app ----------
export default function PawnParty() {
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]); // {winnerId|null, rule, sticker, ts}
  const [tab, setTab] = useState("play");
  const [loaded, setLoaded] = useState(false);

  // Setup form
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState(AVATARS[0]);

  // Spinner
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);

  // Piece battle
  const [captured, setCaptured] = useState({ w: { ...EMPTY_CAPT }, b: { ...EMPTY_CAPT } });
  const [whiteId, setWhiteId] = useState(null);
  const [blackId, setBlackId] = useState(null);

  // Celebration
  const [burst, setBurst] = useState(0);
  const [lastAward, setLastAward] = useState(null);
  const spinTimer = useRef(null);

  // Load / save
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) {
          const s = JSON.parse(r.value);
          setPlayers(s.players || []);
          setGames(s.games || []);
        }
      } catch (e) {
        /* first visit — nothing saved yet */
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify({ players, games }));
      } catch (e) {
        /* saving is best-effort */
      }
    })();
  }, [players, games, loaded]);

  useEffect(() => () => clearTimeout(spinTimer.current), []);

  const toggleSlot = (side, k, isCaptured) => {
    const def = PIECES.find((p) => p.k === k);
    setCaptured((c) => {
      const cur = c[side][k];
      const next = isCaptured ? Math.max(0, cur - 1) : Math.min(def.count, cur + 1);
      return { ...c, [side]: { ...c[side], [k]: next } };
    });
  };

  const resetBattle = () => setCaptured({ w: { ...EMPTY_CAPT }, b: { ...EMPTY_CAPT } });

  // Points a side has EARNED = value of the opponent's captured pieces
  const material = (side) =>
    PIECES.reduce((s, p) => s + captured[side === "w" ? "b" : "w"][p.k] * p.val, 0);

  const nameFor = (side) => {
    const id = side === "w" ? whiteId : blackId;
    const p = players.find((x) => x.id === Number(id));
    return p ? `${p.avatar} ${p.name}` : side === "w" ? "White" : "Black";
  };

  const addPlayer = () => {
    const name = newName.trim();
    if (!name) return;
    setPlayers((p) => [...p, { id: Date.now(), name, avatar: newAvatar }]);
    setNewName("");
    setNewAvatar(AVATARS[(AVATARS.indexOf(newAvatar) + 1) % AVATARS.length]);
  };

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setCurrentRule(null);
    const idx = Math.floor(Math.random() * SILLY_RULES.length);
    const seg = 360 / SILLY_RULES.length;
    const target = rotation + 360 * 5 + (360 - (idx * seg + seg / 2)) - (rotation % 360);
    setRotation(target);
    spinTimer.current = setTimeout(() => {
      setSpinning(false);
      setCurrentRule(SILLY_RULES[idx]);
    }, 3200);
  };

  const recordGame = (winnerId) => {
    const sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)];
    setGames((g) => [...g, { winnerId, rule: currentRule?.text || null, sticker, ts: Date.now() }]);
    setLastAward({ winnerId, sticker });
    setBurst((b) => b + 1);
    setCurrentRule(null);
    resetBattle();
  };

  const wins = (id) => games.filter((g) => g.winnerId === id).length;
  const champion = players.length
    ? [...players].sort((a, b) => wins(b.id) - wins(a.id))[0]
    : null;
  const championHasWins = champion && wins(champion.id) > 0;

  const seg = 360 / SILLY_RULES.length;
  const whitePts = material("w");
  const blackPts = material("b");
  const battleDiff = whitePts - blackPts;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#4F2D7F",
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(255,201,60,.18) 0 120px, transparent 120px), radial-gradient(circle at 85% 30%, rgba(78,205,196,.18) 0 90px, transparent 90px)",
        fontFamily: "'Nunito', sans-serif",
        color: "#2B2244",
        paddingBottom: 96,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;800&display=swap');
        @keyframes pp-fall { to { transform: translateY(110vh) rotate(360deg); opacity: .9; } }
        @keyframes pp-pop { 0% { transform: scale(.3); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      <Confetti burst={burst || null} />

      {/* Header */}
      <header style={{ textAlign: "center", padding: "22px 16px 8px" }}>
        <h1
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontWeight: 700,
            fontSize: 34,
            margin: 0,
            color: "#FFC93C",
            textShadow: "2px 3px 0 #2B2244",
            letterSpacing: 1,
          }}
        >
          ♟️ Pawn Party!
        </h1>
        <p style={{ color: "#E9E2FA", margin: "4px 0 0", fontWeight: 800, fontSize: 14 }}>
          Family chess night, but sillier
        </p>
      </header>

      <main style={{ maxWidth: 420, margin: "0 auto", padding: "12px 14px", display: "grid", gap: 14 }}>
        {/* Setup */}
        {players.length < 2 && (
          <Card>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", margin: "0 0 8px", fontSize: 20 }}>
              Who's playing? 🙋
            </h2>
            <p style={{ margin: "0 0 10px", fontSize: 14 }}>Add at least two players to start the party.</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setNewAvatar(a)}
                  style={{
                    fontSize: 22,
                    padding: 6,
                    borderRadius: 12,
                    border: a === newAvatar ? "3px solid #2B2244" : "3px solid transparent",
                    background: a === newAvatar ? "#FFC93C" : "#F0EAF9",
                    cursor: "pointer",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              placeholder="Player name"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                padding: "10px 12px",
                border: "3px solid #2B2244",
                borderRadius: 12,
                marginBottom: 10,
              }}
            />
            <ChunkyButton onClick={addPlayer} color="#4ECDC4">
              Add {newAvatar} to the party
            </ChunkyButton>
            {players.length > 0 && (
              <p style={{ marginTop: 10, marginBottom: 0, fontWeight: 800 }}>
                In so far: {players.map((p) => `${p.avatar} ${p.name}`).join("  ·  ")}
              </p>
            )}
          </Card>
        )}

        {players.length >= 2 && tab === "play" && (
          <>
            {/* Wheel */}
            <Card style={{ textAlign: "center" }}>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", margin: "0 0 4px", fontSize: 20 }}>
                Spin the Silly Wheel 🎡
              </h2>
              <p style={{ margin: "0 0 12px", fontSize: 14 }}>
                Every game gets one silly rule. No take-backsies.
              </p>
              <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto 12px" }}>
                <div
                  style={{
                    position: "absolute",
                    top: -6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 28,
                    zIndex: 2,
                  }}
                >
                  🔻
                </div>
                <div
                  style={{
                    width: 240,
                    height: 240,
                    borderRadius: "50%",
                    border: "5px solid #2B2244",
                    boxShadow: "0 5px 0 #2B2244",
                    background: `conic-gradient(${SILLY_RULES.map(
                      (_, i) =>
                        `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`
                    ).join(", ")})`,
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 3.2s cubic-bezier(.15,.9,.25,1)",
                    position: "relative",
                  }}
                >
                  {SILLY_RULES.map((r, i) => (
                    <span
                      key={i}
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: `rotate(${i * seg + seg / 2}deg) translateY(-92px)`,
                        transformOrigin: "0 0",
                        fontSize: 20,
                        marginLeft: -10,
                      }}
                    >
                      {r.emoji}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: "#FFF9EF",
                    border: "4px solid #2B2244",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 24,
                  }}
                >
                  ♟️
                </div>
              </div>

              {currentRule ? (
                <div
                  style={{
                    background: "#FFC93C",
                    border: "3px solid #2B2244",
                    borderRadius: 14,
                    padding: 12,
                    fontFamily: "'Fredoka', sans-serif",
                    fontSize: 18,
                    animation: "pp-pop .4s ease",
                    marginBottom: 12,
                  }}
                >
                  {currentRule.emoji} {currentRule.text}
                </div>
              ) : null}

              <ChunkyButton onClick={spin} disabled={spinning} color="#FF6B6B">
                {spinning ? "Spinning…" : currentRule ? "Spin again" : "SPIN! 🎲"}
              </ChunkyButton>
            </Card>

            {/* Piece battle */}
            <Card>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", margin: "0 0 4px", fontSize: 20 }}>
                Piece Battle ⚔️
              </h2>
              <p style={{ margin: "0 0 10px", fontSize: 14 }}>
                Tap a piece when it gets captured. Oops? Tap a faded piece to bring it back.
              </p>

              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <select
                  value={whiteId ?? ""}
                  onChange={(e) => setWhiteId(e.target.value || null)}
                  style={{
                    flex: 1,
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    padding: "8px 6px",
                    border: "3px solid #2B2244",
                    borderRadius: 12,
                    background: "#FFF9EF",
                  }}
                >
                  <option value="">⬜ White is…</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.avatar} {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={blackId ?? ""}
                  onChange={(e) => setBlackId(e.target.value || null)}
                  style={{
                    flex: 1,
                    fontFamily: "'Nunito', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    padding: "8px 6px",
                    border: "3px solid #2B2244",
                    borderRadius: 12,
                    background: "#E7E2F2",
                  }}
                >
                  <option value="">⬛ Black is…</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.avatar} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  background: battleDiff === 0 ? "#F0EAF9" : "#FFC93C",
                  border: "3px solid #2B2244",
                  borderRadius: 14,
                  padding: 10,
                  textAlign: "center",
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 16,
                  marginBottom: 10,
                }}
              >
                {battleDiff > 0 &&
                  `${nameFor("w")} is winning by ${battleDiff} point${battleDiff === 1 ? "" : "s"}! 🔥`}
                {battleDiff < 0 &&
                  `${nameFor("b")} is winning by ${-battleDiff} point${battleDiff === -1 ? "" : "s"}! 🔥`}
                {battleDiff === 0 && "⚖️ All even — anyone's game!"}
              </div>

              <div
                style={{
                  height: 16,
                  border: "3px solid #2B2244",
                  borderRadius: 10,
                  overflow: "hidden",
                  display: "flex",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: `${whitePts + blackPts ? (whitePts / (whitePts + blackPts)) * 100 : 50}%`,
                    background: "#FFF9EF",
                    transition: "width .4s",
                  }}
                />
                <div style={{ flex: 1, background: "#2B2244" }} />
              </div>

              {["w", "b"].map((side) => (
                <div key={side} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 800,
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      {side === "w" ? "⬜" : "⬛"} {nameFor(side)}'s army
                    </span>
                    <span>{material(side)} pts captured</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {PIECES.flatMap((pc) =>
                      Array.from({ length: pc.count }, (_, i) => {
                        const isCaptured = i >= pc.count - captured[side][pc.k];
                        return (
                          <button
                            key={pc.k + i}
                            onClick={() => toggleSlot(side, pc.k, isCaptured)}
                            title={pc.name + " (" + pc.val + " pts)"}
                            style={{
                              width: 36,
                              height: 36,
                              fontSize: 22,
                              lineHeight: 1,
                              border: isCaptured ? "2px dashed #2B2244" : "2px solid #2B2244",
                              borderRadius: 9,
                              background: isCaptured
                                ? "#E7E2F2"
                                : side === "w"
                                ? "#FFF9EF"
                                : "#CBC3E3",
                              opacity: isCaptured ? 0.35 : 1,
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            {side === "w" ? pc.w : pc.b}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}

              <ChunkyButton onClick={resetBattle} color="#B983FF">
                ♻️ Reset the battle
              </ChunkyButton>
            </Card>

            {/* Record game */}
            <Card>
              <h2 style={{ fontFamily: "'Fredoka', sans-serif", margin: "0 0 4px", fontSize: 20 }}>
                Who won the game? 🏁
              </h2>
              <p style={{ margin: "0 0 12px", fontSize: 14 }}>
                Everyone who plays earns a mystery sticker — win or lose!
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {players.map((p) => (
                  <ChunkyButton key={p.id} onClick={() => recordGame(p.id)} color="#4ECDC4">
                    {p.avatar} {p.name} won!
                  </ChunkyButton>
                ))}
                <ChunkyButton onClick={() => recordGame(null)} color="#B983FF">
                  🤝 It was a draw
                </ChunkyButton>
              </div>
              {lastAward && (
                <div
                  style={{
                    marginTop: 12,
                    textAlign: "center",
                    background: "#F0EAF9",
                    border: "3px dashed #2B2244",
                    borderRadius: 14,
                    padding: 12,
                    animation: "pp-pop .4s ease",
                  }}
                >
                  <div style={{ fontSize: 40 }}>{lastAward.sticker.e}</div>
                  <strong style={{ fontFamily: "'Fredoka', sans-serif" }}>
                    New sticker: {lastAward.sticker.n}!
                  </strong>
                </div>
              )}
            </Card>
          </>
        )}

        {players.length >= 2 && tab === "stickers" && (
          <Card>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", margin: "0 0 4px", fontSize: 20 }}>
              Sticker Book 📔
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>
              {games.length === 0
                ? "Play a game to earn your first sticker!"
                : `${games.length} game${games.length === 1 ? "" : "s"} played — look at this haul:`}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {games.map((g, i) => (
                <div
                  key={i}
                  title={g.sticker.n}
                  style={{
                    background: "#F0EAF9",
                    border: "3px solid #2B2244",
                    borderRadius: 14,
                    padding: "10px 4px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 28 }}>{g.sticker.e}</div>
                  <div style={{ fontSize: 10, fontWeight: 800 }}>{g.sticker.n}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {players.length >= 2 && tab === "court" && (
          <Card>
            <h2 style={{ fontFamily: "'Fredoka', sans-serif", margin: "0 0 4px", fontSize: 20 }}>
              The Royal Court 🏰
            </h2>
            {championHasWins && (
              <p style={{ margin: "0 0 12px", fontSize: 14 }}>
                All hail {champion.avatar} <strong>{champion.name}</strong>, current ruler of the board! 👑
              </p>
            )}
            <div style={{ display: "grid", gap: 8 }}>
              {[...players]
                .sort((a, b) => wins(b.id) - wins(a.id))
                .map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: i === 0 && championHasWins ? "#FFC93C" : "#F0EAF9",
                      border: "3px solid #2B2244",
                      borderRadius: 14,
                      padding: "10px 12px",
                    }}
                  >
                    <span style={{ fontSize: 26 }}>{p.avatar}</span>
                    <strong style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 17, flex: 1 }}>
                      {p.name} {i === 0 && championHasWins ? "👑" : ""}
                    </strong>
                    <span style={{ fontWeight: 800 }}>
                      {wins(p.id)} win{wins(p.id) === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
            </div>
            <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13, fontWeight: 800, color: "#6B5E8C" }}>
              Draws so far: {games.filter((g) => g.winnerId === null).length} 🤝
            </p>
          </Card>
        )}
      </main>

      {/* Bottom nav */}
      {players.length >= 2 && (
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 10,
            padding: "10px 14px 16px",
            background: "rgba(43,34,68,.92)",
          }}
        >
          {[
            { id: "play", label: "🎡 Play" },
            { id: "stickers", label: "📔 Stickers" },
            { id: "court", label: "🏰 Court" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                fontFamily: "'Fredoka', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                padding: "10px 16px",
                borderRadius: 14,
                border: "3px solid #2B2244",
                background: tab === t.id ? "#FFC93C" : "#FFF9EF",
                boxShadow: tab === t.id ? "none" : "0 3px 0 #2B2244",
                cursor: "pointer",
                color: "#2B2244",
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
