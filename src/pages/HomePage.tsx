import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

const TIME_FORMATS = [
  { label: '1+0',    category: 'Bullet',      color: '#e86c2c' },
  { label: '2+1',    category: 'Bullet',      color: '#e86c2c' },
  { label: '3+0',    category: 'Blitz',       color: '#c9a227' },
  { label: '3+2',    category: 'Blitz',       color: '#c9a227' },
  { label: '5+0',    category: 'Blitz',       color: '#c9a227' },
  { label: '5+3',    category: 'Blitz',       color: '#c9a227' },
  { label: '10+0',   category: 'Schnell',     color: '#5b9bd5' },
  { label: '10+5',   category: 'Schnell',     color: '#5b9bd5' },
  { label: '15+10',  category: 'Schnell',     color: '#5b9bd5' },
  { label: '30+0',   category: 'Klassisch',   color: '#5bbf91' },
  { label: '30+20',  category: 'Klassisch',   color: '#5bbf91' },
  { label: 'Ohne Uhr', category: 'Freies Spiel', color: '#888' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const newGame = useGameStore((s) => s.newGame);

  const handleSelect = async () => {
    await newGame();
    navigate('/play');
  };

  return (
    <div
      style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 52px)' }}
      className="flex flex-col items-center justify-center py-10 px-4"
    >
      {/* Hero */}
      <div className="flex flex-col items-center gap-2 mb-10">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '2.5rem', color: 'var(--heading)', lineHeight: 1 }}>♗</span>
          <h1 style={{ color: 'var(--heading)', fontSize: '2.2rem', fontWeight: 700, margin: 0 }}>
            alu-chess
          </h1>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Wähle ein Zeitformat</p>
      </div>

      {/* Time format grid */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', maxWidth: '520px' }}
      >
        {TIME_FORMATS.map(({ label, category, color }) => (
          <button
            key={label}
            onClick={handleSelect}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '18px 8px',
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.1s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--card-hover)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)';
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            <div style={{ color: 'var(--heading)', fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.2 }}>
              {label}
            </div>
            <div style={{ color, fontSize: '0.72rem', marginTop: '5px', fontWeight: 500 }}>
              {category}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
