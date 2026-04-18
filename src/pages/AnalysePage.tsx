import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import ChessBoard from '../components/Board/ChessBoard';
import FenPgnTools from '../components/Controls/FenPgnTools';

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

  const [boardSize, setBoardSize] = useState(520);

  useEffect(() => {
    const update = () => {
      const h = window.innerHeight - 52 - 32;
      const w = window.innerWidth - 360 - 64;
      setBoardSize(Math.min(Math.max(h, 280), Math.max(w, 280), 620));
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

  const { game, browseIndex } = state;
  const lastMoveEntry = browseIndex > 0 ? moveHistory[browseIndex - 1] : undefined;
  const lastMove = lastMoveEntry ? parseLastMove(lastMoveEntry.move) : undefined;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      minHeight: 'calc(100vh - 52px)', background: 'var(--bg)',
      padding: '16px', gap: '16px',
    }}>
      {/* ── Board ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '8px' }}>
        <div style={{
          color: 'var(--muted)', fontSize: '0.72rem',
          background: 'var(--surface)', padding: '4px 8px', borderRadius: '4px',
          border: '1px solid var(--border)', width: boardSize,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {game.fen}
        </div>
        <div style={{ position: 'relative', width: boardSize, height: boardSize }}>
          <ChessBoard
            fen={game.fen}
            currentPlayer={game.currentPlayer}
            isTerminal={false}
            isAtLatest={true}
            boardSize={boardSize}
            lastMove={lastMove}
            onMove={makeMove}
          />
        </div>
      </div>

      {/* ── Analysis panel ── */}
      <div style={{
        width: 340,
        display: 'flex', flexDirection: 'column', gap: '0',
        paddingTop: '8px',
      }}>
        <FenPgnTools initialTab="analysis" />
      </div>
    </div>
  );
}
