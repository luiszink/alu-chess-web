import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { controllerApi } from '../api/controllerApi';
import ChessBoard from '../components/Board/ChessBoard';
import MoveList from '../components/History/MoveList';
import ChessClock from '../components/Clock/ChessClock';

// ── helpers ──────────────────────────────────────────────────────────────────

function parseLastMove(moveStr: string): { from: string; to: string } | undefined {
  const parts = moveStr.split('→');
  if (parts.length !== 2) return undefined;
  return { from: parts[0], to: parts[1].split('=')[0] };
}

function NavBtn({
  onClick, disabled, title, children,
}: {
  onClick: () => void; disabled: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--border)' : 'var(--muted)',
        fontSize: '0.9rem',
        padding: '4px 7px',
        borderRadius: '3px',
        transition: 'color 0.12s, background 0.12s',
        lineHeight: 1,
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.color = 'var(--heading)'; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; }}
    >
      {children}
    </button>
  );
}

function PlayerLabel({
  name, isActive, clock, isTerminal,
}: {
  name: string; isActive: boolean; clock?: number; isTerminal: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: isActive ? 'var(--heading)' : 'var(--muted)', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {name}
      </span>
      {clock !== undefined && (
        <span style={{
          fontFamily: 'monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: isActive && !isTerminal ? '#e8e6e3' : 'var(--muted)',
          background: isActive && !isTerminal ? 'var(--card)' : 'transparent',
          padding: '1px 7px',
          borderRadius: '3px',
          transition: 'background 0.2s',
        }}>
          {formatMs(clock)}
        </span>
      )}
    </div>
  );
}

function formatMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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

  // Board size: fill viewport height minus navbar
  const [boardSize, setBoardSize] = useState(580);
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
    try {
      const s = await controllerApi.exitReplay();
      setStoreState(s);
    } catch { /* ignore */ }
  };

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

  const { game, browseIndex, totalStates, isAtLatest, isInReplay, clock } = state;
  const currentPlayer = game.currentPlayer;

  // Last move for board highlighting
  const lastMoveEntry = browseIndex > 0 ? moveHistory[browseIndex - 1] : undefined;
  const lastMove = lastMoveEntry ? parseLastMove(lastMoveEntry.move) : undefined;

  // Status text
  const lastMoveLabel = lastMoveEntry ? lastMoveEntry.move : '–';

  // Navigation
  const atStart = browseIndex === 0;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── Board area ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <ChessBoard
          fen={game.fen}
          currentPlayer={currentPlayer}
          isTerminal={game.isTerminal}
          isAtLatest={isAtLatest}
          boardSize={boardSize}
          lastMove={lastMove}
          onMove={makeMove}
        />
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <div style={{
        width: '260px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
      }}>

        {/* Black player + navigation */}
        <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: clock ? '6px' : 0 }}>
            <PlayerLabel
              name="Schwarz"
              isActive={currentPlayer === 'Black' && !game.isTerminal}
              clock={clock?.blackTimeMs}
              isTerminal={game.isTerminal}
            />
            {/* Nav buttons sit here on the right-side when no clock */}
            {!clock && (
              <div style={{ display: 'flex', gap: '0' }}>
                <NavBtn onClick={browseToStart} disabled={atStart} title="Zum Anfang">⏮</NavBtn>
                <NavBtn onClick={browseBack}    disabled={atStart} title="Zurück">◀</NavBtn>
                <NavBtn onClick={browseForward} disabled={isAtLatest} title="Vorwärts">▶</NavBtn>
                <NavBtn onClick={browseToEnd}   disabled={isAtLatest} title="Zum Ende">⏭</NavBtn>
              </div>
            )}
          </div>
          {clock && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
              <div />
              <div style={{ display: 'flex', gap: '0' }}>
                <NavBtn onClick={browseToStart} disabled={atStart} title="Zum Anfang">⏮</NavBtn>
                <NavBtn onClick={browseBack}    disabled={atStart} title="Zurück">◀</NavBtn>
                <NavBtn onClick={browseForward} disabled={isAtLatest} title="Vorwärts">▶</NavBtn>
                <NavBtn onClick={browseToEnd}   disabled={isAtLatest} title="Zum Ende">⏭</NavBtn>
              </div>
            </div>
          )}
        </div>

        {/* Move list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MoveList
            moves={moveHistory}
            browseIndex={browseIndex}
            onBrowseToMove={browseToMove}
          />
        </div>

        {/* White player */}
        <div style={{ padding: '8px 12px 10px', borderTop: '1px solid var(--border)' }}>
          <PlayerLabel
            name="Weiß"
            isActive={currentPlayer === 'White' && !game.isTerminal}
            clock={clock?.whiteTimeMs}
            isTerminal={game.isTerminal}
          />
        </div>

        {/* Status */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
            <span style={{
              display: 'inline-block',
              width: '11px', height: '11px',
              background: currentPlayer === 'White' ? '#f0d9b5' : '#2c1e0f',
              border: '1.5px solid var(--border)',
              borderRadius: '2px',
              flexShrink: 0,
            }} />
            <span style={{ color: 'var(--heading)', fontWeight: 600, fontSize: '0.85rem' }}>
              {currentPlayer === 'White' ? 'Weiß' : 'Schwarz'}
            </span>
            {isInReplay && (
              <span style={{ fontSize: '0.72rem', color: 'var(--brown)', marginLeft: '4px' }}>Replay</span>
            )}
          </div>
          <div style={{ color: 'var(--heading)', fontSize: '0.82rem', fontWeight: 500 }}>
            {game.isTerminal ? state.statusText : (isAtLatest ? 'am Zug' : 'Verlauf')}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '3px' }}>
            Letzter Zug: {lastMoveLabel}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '8px',
        }}>
          <button
            onClick={newGame}
            style={{
              flex: 1,
              padding: '7px 0',
              background: 'var(--green)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)'}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.filter = 'none'}
          >
            Neues Spiel
          </button>

          {isInReplay ? (
            <button
              onClick={handleExitReplay}
              style={{
                flex: 1,
                padding: '7px 0',
                background: 'var(--card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--card-hover)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'}
            >
              Verlassen
            </button>
          ) : !game.isTerminal && (
            <button
              onClick={resign}
              style={{
                flex: 1,
                padding: '7px 0',
                background: 'var(--card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--card-hover)'}
              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'}
            >
              Beenden
            </button>
          )}
        </div>

        {/* Clock (if available) rendered via component for interpolation */}
        {clock && (
          <div style={{ display: 'none' }}>
            <ChessClock clock={clock} currentPlayer={currentPlayer} isTerminal={game.isTerminal} />
          </div>
        )}

      </div>
    </div>
  );
}


