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
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        animation: 'promoFadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: '10px', padding: '16px 20px',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          animation: 'promoPop 0.25s ease-out',
        }}
      >
        <p style={{
          color: 'var(--heading)', fontSize: '0.85rem', marginBottom: '12px',
          textAlign: 'center', fontWeight: 600,
        }}>Umwandlung wählen</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {PIECES.map((p) => (
            <button
              key={p.key}
              title={p.label}
              onClick={() => onSelect(p.key)}
              onMouseEnter={() => setHovered(p.key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: '60px', height: '60px', fontSize: '2.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px', border: '1px solid var(--border)',
                cursor: 'pointer',
                background: hovered === p.key ? 'var(--green)' : 'var(--card)',
                color: hovered === p.key ? '#fff' : 'var(--heading)',
                transition: 'all 0.18s ease',
                transform: hovered === p.key ? 'scale(1.12)' : 'scale(1)',
                boxShadow: hovered === p.key ? '0 0 16px rgba(98,153,36,0.5)' : 'none',
              }}
            >
              {color === 'White' ? p.white : p.black}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
