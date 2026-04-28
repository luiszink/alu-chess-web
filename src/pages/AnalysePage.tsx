import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ChessBoard from '../components/Board/ChessBoard';
import FenPgnTools from '../components/Controls/FenPgnTools';
import MoveList from '../components/History/MoveList';
import NavigationBar from '../components/History/NavigationBar';
import SavedGames from '../components/GameHistory/SavedGames';

function parseLastMove(moveStr: string): { from: string; to: string } | undefined {
  const parts = moveStr.split('→');
  if (parts.length !== 2) return undefined;
  return { from: parts[0], to: parts[1].split('=')[0] };
}

export default function AnalysePage() {
  const state            = useGameStore((s) => s.state);
  const moveHistory      = useGameStore((s) => s.moveHistory);
  const makeMove         = useGameStore((s) => s.makeMove);
  const fetchState       = useGameStore((s) => s.fetchState);
  const fetchMoveHistory = useGameStore((s) => s.fetchMoveHistory);
  const connectSSE       = useGameStore((s) => s.connectSSE);
  const browseBack       = useGameStore((s) => s.browseBack);
  const browseForward    = useGameStore((s) => s.browseForward);
  const browseToStart    = useGameStore((s) => s.browseToStart);
  const browseToEnd      = useGameStore((s) => s.browseToEnd);
  const browseToMove     = useGameStore((s) => s.browseToMove);
  const exitReplay       = useGameStore((s) => s.exitReplay);

  const [boardSize, setBoardSize] = useState(480);

  useEffect(() => {
    const update = () => {
      const h = window.innerHeight - 52 - 32;
      const w = window.innerWidth - 260 - 340 - 80;
      setBoardSize(Math.min(Math.max(h, 280), Math.max(w, 280), 560));
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

  const { game, browseIndex, totalStates, isAtLatest, isInReplay } = state;
  const lastMoveEntry = browseIndex > 0 ? moveHistory[browseIndex - 1] : undefined;
  const lastMove = lastMoveEntry ? parseLastMove(lastMoveEntry.move) : undefined;

  const panelHeight = boardSize + 30;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      minHeight: 'calc(100vh - 52px)', background: 'var(--bg)',
      padding: '16px', gap: '16px',
    }}>
      {/* ── Left: Spielliste ── */}
      <div style={{
        width: 260, flexShrink: 0,
        overflowY: 'auto', maxHeight: panelHeight,
        paddingTop: '8px',
      }}>
        <div style={{
          color: 'var(--heading)', fontSize: '0.78rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '0 0 8px 2px', marginBottom: '4px',
          borderBottom: '1px solid var(--border)',
        }}>
          Gespeicherte Partien
        </div>
        <SavedGames onLoaded={() => { /* bleibt auf AnalysePage */ }} />
      </div>

      {/* ── Center: Brett ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
        <div style={{
          color: 'var(--muted)', fontSize: '0.72rem',
          background: 'var(--surface)', padding: '4px 8px', borderRadius: '4px',
          border: '1px solid var(--border)', width: boardSize,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {game.fen}
        </div>

        {isInReplay && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(184, 214, 138, 0.1)', border: '1px solid var(--green)',
            borderRadius: '4px', padding: '4px 10px', width: boardSize,
            boxSizing: 'border-box',
          }}>
            <span style={{ color: '#b8d68a', fontSize: '0.78rem', fontWeight: 600 }}>
              ▶ Replay-Modus
            </span>
            <button
              onClick={exitReplay}
              style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                fontSize: '0.78rem', cursor: 'pointer', padding: '0 4px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
            >
              ✕ Beenden
            </button>
          </div>
        )}

        <div style={{ position: 'relative', width: boardSize, height: boardSize }}>
          <ChessBoard
            fen={game.fen}
            currentPlayer={game.currentPlayer}
            isTerminal={game.isTerminal}
            isAtLatest={isAtLatest}
            boardSize={boardSize}
            lastMove={lastMove}
            onMove={makeMove}
          />
        </div>
      </div>

      {/* ── Right: Navigation + Züge + Engine ── */}
      <div style={{
        width: 340, flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: '8px',
        paddingTop: '8px', maxHeight: panelHeight,
      }}>
        <NavigationBar
          browseIndex={browseIndex}
          totalStates={totalStates}
          isAtLatest={isAtLatest}
          onBack={browseBack}
          onForward={browseForward}
          onToStart={browseToStart}
          onToEnd={browseToEnd}
        />

        <div style={{
          overflowY: 'auto', maxHeight: 220,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '6px', padding: '4px 0',
        }}>
          <MoveList
            moves={moveHistory}
            browseIndex={browseIndex}
            onBrowseToMove={browseToMove}
          />
        </div>

        <FenPgnTools initialTab="analysis" />
      </div>
    </div>
  );
}
