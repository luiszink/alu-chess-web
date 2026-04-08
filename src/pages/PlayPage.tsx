import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { controllerApi } from '../api/controllerApi';
import ChessBoard from '../components/Board/ChessBoard';
import MoveList from '../components/History/MoveList';
import FenPgnTools from '../components/Controls/FenPgnTools';

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

// ── player bar (horizontal, spans board width) ──────────────────────────────

const PLAYER_BAR_H = 44;

function PlayerBar({ name, isActive, clockMs, isTerminal, captured, boardSize, position }: {
  name: string; isActive: boolean; clockMs?: number; isTerminal: boolean;
  captured: string[]; boardSize: number; position: 'top' | 'bottom';
}) {
  const radius = position === 'top' ? '6px 0 0 0' : '0 0 0 6px';
  return (
    <div style={{
      width: boardSize, height: PLAYER_BAR_H,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px',
      background: isActive && !isTerminal ? 'rgba(98,153,36,0.10)' : 'var(--surface)',
      borderRadius: radius,
      transition: 'background 0.25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
        <span style={{
          display: 'inline-block', width: 10, height: 10, flexShrink: 0,
          background: name === 'Weiß' ? '#f0d9b5' : '#2c1e0f',
          border: '1.5px solid var(--border)', borderRadius: 2,
        }} />
        <span style={{
          color: isActive && !isTerminal ? 'var(--heading)' : 'var(--text)',
          fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
        }}>{name}</span>
        {isActive && !isTerminal && (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--green)', flexShrink: 0,
          }} />
        )}
        {captured.length > 0 && (
          <span style={{
            fontSize: '0.82rem', letterSpacing: '1px', color: 'var(--muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{captured.join('')}</span>
        )}
      </div>
      {clockMs !== undefined && (
        <span style={{
          fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 700, flexShrink: 0,
          color: isActive && !isTerminal ? '#e8e6e3' : 'var(--muted)',
          background: isActive && !isTerminal ? 'var(--card)' : 'transparent',
          padding: '2px 10px', borderRadius: 4,
          transition: 'all 0.2s',
        }}>{formatMs(clockMs)}</span>
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

// ── tools drawer ─────────────────────────────────────────────────────────────

function ToolsDrawer({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 50, animation: 'drawerFadeIn 0.2s ease-out',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 380, maxWidth: '90vw',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 51, animation: 'drawerSlideIn 0.25s ease-out',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ color: 'var(--heading)', fontWeight: 700, fontSize: '0.95rem' }}>
            ⚙ Werkzeuge
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            fontSize: '1.1rem', cursor: 'pointer', padding: '2px 6px',
            borderRadius: 4, transition: 'color 0.15s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--heading)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          <FenPgnTools />
        </div>
      </div>
    </>
  );
}

// ── sidebar action button ────────────────────────────────────────────────────

function ActionBtn({ onClick, children, variant = 'default' }: {
  onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'default';
}) {
  const isPrimary = variant === 'primary';
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '7px 0',
      background: isPrimary ? 'var(--green)' : 'var(--card)',
      color: isPrimary ? '#fff' : 'var(--text)',
      border: isPrimary ? 'none' : '1px solid var(--border)',
      borderRadius: 4, fontSize: '0.8rem', fontWeight: 600,
      cursor: 'pointer', transition: 'filter 0.15s, background 0.15s',
    }}
      onMouseEnter={(e) => {
        if (isPrimary) e.currentTarget.style.filter = 'brightness(1.15)';
        else e.currentTarget.style.background = 'var(--card-hover)';
      }}
      onMouseLeave={(e) => {
        if (isPrimary) e.currentTarget.style.filter = 'none';
        else e.currentTarget.style.background = 'var(--card)';
      }}
    >{children}</button>
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
  const browseToMove = useGameStore((s) => s.browseToMove);
  const fetchState   = useGameStore((s) => s.fetchState);
  const fetchMoveHistory = useGameStore((s) => s.fetchMoveHistory);
  const connectSSE   = useGameStore((s) => s.connectSSE);
  const setStoreState = useGameStore((s) => s.setState);

  const [boardSize, setBoardSize] = useState(560);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animatingRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const h = window.innerHeight - 52 - PLAYER_BAR_H * 2 - 32;
      const w = window.innerWidth - 300 - 64;
      setBoardSize(Math.min(Math.max(h, 300), Math.max(w, 300), 640));
    };
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
  const sidebarH = boardSize + PLAYER_BAR_H * 2;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 'calc(100vh - 52px)', background: 'var(--bg)',
      overflow: 'hidden', padding: '16px', gap: 0,
    }}>
      {/* ── Board column ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <PlayerBar
          name="Schwarz"
          isActive={currentPlayer === 'Black' && !game.isTerminal}
          clockMs={clock?.blackTimeMs}
          isTerminal={game.isTerminal}
          captured={captured.black}
          boardSize={boardSize}
          position="top"
        />
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
          {showCheck && <CheckOverlay status={game.status} currentPlayer={currentPlayer} />}
        </div>
        <PlayerBar
          name="Weiß"
          isActive={currentPlayer === 'White' && !game.isTerminal}
          clockMs={clock?.whiteTimeMs}
          isTerminal={game.isTerminal}
          captured={captured.white}
          boardSize={boardSize}
          position="bottom"
        />
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <div style={{
        width: 280, height: sidebarH,
        display: 'flex', flexDirection: 'column',
        background: 'var(--surface)',
        borderRadius: '0 6px 6px 0',
        borderLeft: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {isInReplay && (
          <div style={{
            padding: '6px 12px', background: 'rgba(181,136,99,0.12)',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.75rem', color: 'var(--brown)', textAlign: 'center', fontWeight: 600,
          }}>▶ Replay-Modus</div>
        )}
        {!isAtLatest && !isInReplay && (
          <div style={{
            padding: '6px 12px', background: 'rgba(98,153,36,0.10)',
            borderBottom: '1px solid var(--border)',
            fontSize: '0.75rem', color: 'var(--green)', textAlign: 'center',
          }}>⬆ Zum aktuellen Zug springen</div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MoveList
            moves={moveHistory}
            browseIndex={browseIndex}
            onBrowseToMove={browseToMove}
          />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '5px 12px', borderTop: '1px solid var(--border)', gap: 2,
          background: 'var(--card)',
        }}>
          <NavBtn onClick={browseToStart} disabled={atStart} title="Zum Anfang">⏮</NavBtn>
          <NavBtn onClick={browseBack} disabled={atStart} title="Zurück">◀</NavBtn>
          <NavBtn onClick={browseForward} disabled={isAtLatest || isAnimating} title="Vorwärts">▶</NavBtn>
          <NavBtn onClick={animateToEnd} disabled={isAtLatest && !isAnimating} title={isAnimating ? 'Stopp' : 'Zum Ende'}>
            {isAnimating ? '◼' : '⏭'}
          </NavBtn>
        </div>

        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--heading)', fontSize: '0.8rem', fontWeight: 600 }}>
            {game.isTerminal ? state.statusText : (isAtLatest ? `${currentPlayer === 'White' ? 'Weiß' : 'Schwarz'} am Zug` : 'Verlauf')}
            {isInReplay && <span style={{ fontSize: '0.72rem', color: 'var(--brown)', marginLeft: '6px' }}>Replay</span>}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: 2 }}>
            Letzter Zug: {lastMoveLabel}
          </div>
        </div>

        <div style={{
          padding: '8px 10px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 6,
        }}>
          <ActionBtn onClick={newGame} variant="primary">Neues Spiel</ActionBtn>
          {isInReplay ? (
            <ActionBtn onClick={handleExitReplay}>Verlassen</ActionBtn>
          ) : !game.isTerminal && (
            <ActionBtn onClick={resign}>Aufgeben</ActionBtn>
          )}
        </div>

        <div style={{
          padding: '6px 10px 8px', borderTop: '1px solid var(--border)', textAlign: 'center',
        }}>
          <button onClick={() => setToolsOpen(true)} style={{
            background: 'none', border: 'none',
            color: 'var(--muted)', fontSize: '0.75rem',
            cursor: 'pointer', transition: 'color 0.15s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--heading)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
          >⚙ Werkzeuge</button>
        </div>
      </div>

      {toolsOpen && <ToolsDrawer onClose={() => setToolsOpen(false)} />}
    </div>
  );
}


