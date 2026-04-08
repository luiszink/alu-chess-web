import { useState } from 'react';

interface PromotionDialogProps {
  color: 'White' | 'Black';
  onSelect: (piece: string) => void;
  onCancel: () => void;
}

const PIECES = [
  { key: 'Q', label: 'Dame', white: '♕', black: '♛' },
  { key: 'R', label: 'Turm', white: '♖', black: '♜' },
  { key: 'B', label: 'Läufer', white: '♗', black: '♝' },
  { key: 'N', label: 'Springer', white: '♘', black: '♞' },
];

export default function PromotionDialog({ color, onSelect, onCancel }: PromotionDialogProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onCancel}>
      <div
        className="bg-gray-800 rounded-lg p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white text-sm mb-3 text-center">Umwandlung wählen</p>
        <div className="flex gap-2">
          {PIECES.map((p) => (
            <button
              key={p.key}
              title={p.label}
              onClick={() => onSelect(p.key)}
              onMouseEnter={() => setHovered(p.key)}
              onMouseLeave={() => setHovered(null)}
              className={`w-14 h-14 text-4xl flex items-center justify-center rounded transition-colors
                ${hovered === p.key ? 'bg-amber-500' : 'bg-gray-700 hover:bg-gray-600'}
              `}
            >
              {color === 'White' ? p.white : p.black}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
