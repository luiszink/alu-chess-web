import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { controllerApi } from '../api/controllerApi';
import ChessBoard from '../components/Board/ChessBoard';
import MoveList from '../components/History/MoveList';

// ── captured-piece computation from FEN ──────────────────────────────────────

const STARTING: Record<string, number> = {
  P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1,
  p: 8, n: 2, b: 2, r: 2, q: 1, k: 1,
};

const PIECE_SYMBOLS: Record<string, string> = {
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕',
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛',
};

const PIECE_ORDER = ['Q', 'R', 'B', 'N', 'P'];

function getCapturedPieces(fen: string): { white: string[]; black: string[] } {
  const board = fen.split(' ')[0];
  const counts: Record<string, number> = {};
  for (const ch of board) {
    if (/[a-zA-Z]/.test(ch) && ch !== '/' && STARTING[ch] !== undefined) {
      counts[ch] = (counts[ch] || 0) + 1;
    }
  }
  // white captured = black pieces missing, black captured = white pieces missing
  const white: string[] = []; // pieces white has captured (lowercase = black pieces)
  const black: string[] = []; // pieces black has captured (uppercase = white pieces)
  for (const p of PIECE_ORDER) {
    const lc = p.toLowerCase();
    // black pieces missing → white captured them
    const bMissing = STARTING[lc] - (counts[lc] || 0);
    for (let i = 0; i < bMissing; i++) white.push(PIECE_SYMBOLS[lc]);
    // white pieces missing → black captured them
    const wMissing = STARTING[p] - (counts[p] || 0);
    for (let i = 0; i < wMissing; i++) black.push(PIECE_SYMBOLS[p]);
  }
  return { white, black };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseLastMove(moveStr: string): { from: string; to: string } | undefined {
  const parts = moveStr.split('→');
  if (parts.length !== 2) return undefined;
  return { from: parts[0], to: parts[1].split('=')[0] };
}

function formatMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function NavBtn({ onClick, disabled, title, children }: {
  onClick: () => void; disabled: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        background: 'none', border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--border)' : 'var(--muted)',
        fontSize: '0.9rem', padding: '4px 7px', borderRadius: '3px',
        transition: 'color 0.12s', lineHeight: 1,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.color = 'var(--heading)'; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.color = 'var(--muted)'; }}
    >{children}</button>
  );
}

// ── player panel ─────────────────────────────────────────────────────────────

function PlayerPanel({ name, isActive, clockMs, isTerminal, captured }: {
  name: string; isActive: boolean; clockMs?: number; isTerminal: boolean; captured: string[];
}) {
  return (
    <div style={{
      padding: '8px 14px',
      borderBottom: '1px solid var(--border)',
      background: isActive && !isTerminal ? 'rgba(98,153,36,0.08)' : 'transparent',
      transition: 'background 0.25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block', width: '10px', height: '10px',
            background: name === 'Weiß' ? '#f0d9b5' : '#2c1e0f',
            border: '1.5px solid var(--border)', borderRadius: '2px',
          }} />
          <span style={{
            color: isActive && !isTerminal ? 'var(--heading)' : 'var(--muted)',
            fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.02em',
            transition: 'color 0.2s',
          }}>{name}</span>
          {isActive && !isTerminal && (
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--green)', display: 'inline-block',
            }} />
          )}
        </div>
        {clockMs !== undefined && (
          <span style={{
            fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700,
            color: isActive && !isTerminal ? '#e8e6e3' : 'var(--muted)',
            background: isActive && !isTerminal ? 'var(--card)' : 'transparent',
            padding: '1px 8px', borderRadius: '3px', transition: 'all 0.2s',
          }}>{formatMs(clockMs)}</span>
        )}
      </div>
      {captured.length > 0 && (
        <div style={{
          marginTop: '4px', fontSize: '0.85rem', letterSpacing: '1px',
          color: 'var(--muted)', lineHeight: 1.2,
        }}>
          {captured.join('')}
        </div>
      )}
    </div>
  );
}

// ── check/checkmate overlay ──────────────────────────────────────────────────

function CheckOverlay({ status, currentPlayer }: {
  status: string; currentPlayer: 'White' | 'Black';
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (status === 'Check') {
      const t = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (!visible) return null;

  const isCheckmate = status === 'Checkmate';
  const label = isCheckmate ? 'Schachmatt!' : 'Schach!';
  const icon = currentPlayer === 'White' ? '♔' : '♚';
  const bg = isCheckmate ? 'rgba(180,30,30,0.92)' : 'rgba(200,140,20,0.88)';

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 40, pointerEvents: 'none',
      animation: 'checkFadeIn 0.35s ease-out',
    }}>
      <div style={{
        background: bg, padding: '14px 36px', borderRadius: '8px',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 6px 30px rgba(0,0,0,0.5)',
        animation: 'checkPop 0.35s ease-out',
      }}>
        <span style={{ fontSize: '2rem' }}>{icon}</span>
        <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '0.02em' }}>{label}</span>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function PlayPage() {
  const state        = useGameStore((s) => s.state);
  const moveHistory  = useGameStore((s) => s.moveHistory);
  const makeMove     = useGameStore((s) => s.makeMove);
  const newGame      = useGameStore((s) => s.newGame);
  const resign       = useGameStore((s) => s.resign);
  const browseBack   = useGameStore((s) => s.browseBack);
  const browseForward= useGameStore((s) => s.browseForward);
  const browseToStart= useGameStore((s) => s.browseToStart);
  const browseToEnd  = useGameStore((s) => s.browseToEnd);
  const browseToMove = useGameStore((s) => s.browseToMove);
  const fetchState   = useGameStore((s) => s.fetchState);
  const fetchMoveHistory = useGameStore((s) => s.fetchMoveHistory);
  const connectSSE   = useGameStore((s) => s.connectSSE);
  const setStoreState = useGameStore((s) => s.setState);

  const [boardSize, setBoardSize] = useState(580);
  const [isAnimating, setIsAnimating] = useState(false);
  const animatingRef = useRef(false);

  useEffect(() => {
    const update = () => setBoardSize(Math.min(window.innerHeight - 52 - 32, 680));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    fetchState();
    fetchMoveHistory();
    const disconnect = connectSSE();
    return disconnect;
  }, [fetchState, fetchMoveHistory, connectSSE]);

  const handleExitReplay = async () => {
    try { const s = await controllerApi.exitReplay(); setStoreState(s); } catch { /* */ }
  };

  // ── replay animation: step-by-step fast forward ──────────────────────────
  const animateToEnd = useCallback(async () => {
    if (isAnimating) {
      animatingRef.current = false;
      return;
    }
    animatingRef.current = true;
    setIsAnimating(true);
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (!animatingRef.current) break;
        const cur = useGameStore.getState().state;
        if (!cur || cur.isAtLatest) break;
        await browseForward();
        await new Promise((r) => setTimeout(r, 280));
      }
    } finally {
      animatingRef.current = false;
      setIsAnimating(false);
    }
  }, [isAnimating, browseForward]);

  if (!state) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--heading)', fontSize: '1.1rem', marginBottom: '8px' }}>Verbinde mit Server…</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Controller-Service muss auf Port 8081 laufen</div>
        </div>
      </div>
    );
  }

  const { game, browseIndex, isAtLatest, isInReplay, clock } = state;
  const currentPlayer = game.currentPlayer;
  const lastMoveEntry = browseIndex > 0 ? moveHistory[browseIndex - 1] : undefined;
  const lastMove = lastMoveEntry ? parseLastMove(lastMoveEntry.move) : undefined;
  const lastMoveLabel = lastMoveEntry ? lastMoveEntry.move : '–';
  const atStart = browseIndex === 0;
  const captured = getCapturedPieces(game.fen);
  const showCheck = game.status === 'Check' || game.status === 'Checkmate';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Board area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative' }}>
        <div style={{ position: 'relative', width: boardSize, height: boardSize }}>
          <ChessBoard
            fen={game.fen}
            currentPlayer={currentPlayer}
            isTerminal={game.isTerminal}
            isAtLatest={isAtLatest}
            boardSize={boardSize}
            lastMove={lastMove}
            onMove={makeMove}
          />
          {showCheck && (
            <CheckOverlay status={game.status} currentPlayer={currentPlayer} />
          )}
        </div>
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div style={{
        width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      }}>

        {/* Black player panel */}
        <PlayerPanel
          name="Schwarz"
          isActive={currentPlayer === 'Black' && !game.isTerminal}
          clockMs={clock?.blackTimeMs}
          isTerminal={game.isTerminal}
          captured={captured.black}
        />

        {/* Navigation row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px 12px', borderBottom: '1px solid var(--border)', gap: '2px',
        }}>
          <NavBtn onClick={browseToStart} disabled={atStart} title="Zum Anfang">⏮</NavBtn>
          <NavBtn onClick={browseBack} disabled={atStart} title="Zurück">◀</NavBtn>
          <NavBtn onClick={browseForward} disabled={isAtLatest || isAnimating} title="Vorwärts">▶</NavBtn>
          <NavBtn onClick={animateToEnd} disabled={isAtLatest && !isAnimating} title={isAnimating ? 'Stopp' : 'Zum Ende'}>
            {isAnimating ? '◼' : '⏭'}
          </NavBtn>
        </div>

        {/* Not-at-latest hint (instead of move-error toasts) */}
        {!isAtLatest && !isInReplay && (
          <div style={{
            padding: '6px 14px', background: 'rgba(98,153,36,0.10)',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.75rem', color: 'var(--green)', textAlign: 'center',
          }}>
            ⬆ Zum aktuellen Zug springen um zu spielen
          </div>
        )}

        {/* Move list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MoveList
            moves={moveHistory}
            browseIndex={browseIndex}
            onBrowseToMove={browseToMove}
          />
        </div>

        {/* White player panel */}
        <PlayerPanel
          name="Weiß"
          isActive={currentPlayer === 'White' && !game.isTerminal}
          clockMs={clock?.whiteTimeMs}
          isTerminal={game.isTerminal}
          captured={captured.white}
        />

        {/* Status */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ color: 'var(--heading)', fontSize: '0.82rem', fontWeight: 600 }}>
            {game.isTerminal ? state.statusText : (isAtLatest ? `${currentPlayer === 'White' ? 'Weiß' : 'Schwarz'} am Zug` : 'Verlauf')}
            {isInReplay && <span style={{ fontSize: '0.72rem', color: 'var(--brown)', marginLeft: '6px' }}>Replay</span>}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '2px' }}>
            Letzter Zug: {lastMoveLabel}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          padding: '10px 12px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '8px',
        }}>
          <button onClick={newGame}
            style={{
              flex: 1, padding: '7px 0', background: 'var(--green)', color: '#fff',
              border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
          >Neues Spiel</button>

          {isInReplay ? (
            <button onClick={handleExitReplay}
              style={{
                flex: 1, padding: '7px 0', background: 'var(--card)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.82rem',
                fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--card)'}
            >Verlassen</button>
          ) : !game.isTerminal && (
            <button onClick={resign}
              style={{
                flex: 1, padding: '7px 0', background: 'var(--card)', color: 'var(--text)',
                border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.82rem',
                fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--card)'}
            >Aufgeben</button>
          )}
        </div>

        {/* Tools quick-link */}
        <div style={{ padding: '6px 12px 10px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link to="/tools" style={{
            color: 'var(--muted)', fontSize: '0.75rem', textDecoration: 'none',
            transition: 'color 0.15s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--heading)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >
            ⚙ Werkzeuge (FEN/PGN)
          </Link>
        </div>

      </div>
    </div>
  );
}


