import type { MoveHistoryEntry } from '../../types/chess';

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
