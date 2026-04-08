import { useEffect, useRef } from 'react';
import type { MoveHistoryEntry } from '../../types/chess';

interface MoveListProps {
  moves: MoveHistoryEntry[];
  browseIndex: number;
  onBrowseToMove: (index: number) => void;
}

interface MovePair {
  number: number;
  white: MoveHistoryEntry;
  black?: MoveHistoryEntry;
  whiteIdx: number;
  blackIdx?: number;
}

export default function MoveList({ moves, browseIndex, onBrowseToMove }: MoveListProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [browseIndex]);

  const pairs: MovePair[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
      whiteIdx: i + 1,
      blackIdx: moves[i + 1] ? i + 2 : undefined,
    });
  }

  if (pairs.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
        Noch keine Züge
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {pairs.map((pair) => (
        <div
          key={pair.number}
          style={{ display: 'flex', alignItems: 'stretch', fontSize: '0.82rem' }}
        >
          {/* Move number */}
          <span
            style={{
              width: '28px',
              textAlign: 'right',
              padding: '3px 6px 3px 0',
              color: 'var(--muted)',
              flexShrink: 0,
              lineHeight: '22px',
              userSelect: 'none',
            }}
          >
            {pair.number}.
          </span>

          {/* White move */}
          <button
            ref={browseIndex === pair.whiteIdx ? activeRef : undefined}
            onClick={() => onBrowseToMove(pair.whiteIdx)}
            style={{
              flex: 1,
              padding: '3px 6px',
              textAlign: 'left',
              background: browseIndex === pair.whiteIdx ? 'var(--green-dim)' : 'transparent',
              color: browseIndex === pair.whiteIdx ? '#b8d68a' : 'var(--text)',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '3px',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: '22px',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              if (browseIndex !== pair.whiteIdx)
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              if (browseIndex !== pair.whiteIdx)
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            {pair.white.san}
          </button>

          {/* Black move */}
          {pair.black ? (
            <button
              ref={browseIndex === pair.blackIdx ? activeRef : undefined}
              onClick={() => pair.blackIdx !== undefined && onBrowseToMove(pair.blackIdx)}
              style={{
                flex: 1,
                padding: '3px 6px',
                textAlign: 'left',
                background: browseIndex === pair.blackIdx ? 'var(--green-dim)' : 'transparent',
                color: browseIndex === pair.blackIdx ? '#b8d68a' : 'var(--text)',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '3px',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: '22px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (browseIndex !== pair.blackIdx)
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                if (browseIndex !== pair.blackIdx)
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {pair.black.san}
            </button>
          ) : (
            <span style={{ flex: 1 }} />
          )}
        </div>
      ))}
    </div>
  );
}


interface MoveListProps {
  moves: MoveHistoryEntry[];
  browseIndex: number;
  onBrowseToMove: (index: number) => void;
}

export default function MoveList({ moves, browseIndex, onBrowseToMove }: MoveListProps) {
  // Group moves into pairs (white, black)
  const pairs: { number: number; white: MoveHistoryEntry; black?: MoveHistoryEntry }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-gray-750 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300">Züge</h3>
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {pairs.length === 0 && (
          <p className="text-gray-500 text-sm p-2 text-center">Noch keine Züge</p>
        )}
        {pairs.map((pair) => (
          <div key={pair.number} className="flex text-sm">
            <span className="w-8 text-gray-500 text-right pr-1 shrink-0">
              {pair.number}.
            </span>
            <button
              onClick={() => onBrowseToMove((pair.number - 1) * 2 + 1)}
              className={`flex-1 px-1 py-0.5 text-left rounded hover:bg-gray-600 transition-colors
                ${browseIndex === (pair.number - 1) * 2 + 1 ? 'bg-amber-700/50 text-white' : 'text-gray-200'}
              `}
            >
              {pair.white.san}
            </button>
            {pair.black && (
              <button
                onClick={() => onBrowseToMove((pair.number - 1) * 2 + 2)}
                className={`flex-1 px-1 py-0.5 text-left rounded hover:bg-gray-600 transition-colors
                  ${browseIndex === (pair.number - 1) * 2 + 2 ? 'bg-amber-700/50 text-white' : 'text-gray-200'}
                `}
              >
                {pair.black.san}
              </button>
            )}
            {!pair.black && <span className="flex-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
