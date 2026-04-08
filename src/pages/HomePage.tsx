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

const UPCOMING_FEATURES = [
  { icon: '🔍', label: 'Analyse', desc: 'Partie-Analyse mit Engine' },
  { icon: '🧩', label: 'Rätsel', desc: 'Taktik-Aufgaben lösen' },
  { icon: '📖', label: 'Eröffnungen', desc: 'Eröffnungs-Explorer' },
  { icon: '👥', label: 'Mehrspieler', desc: 'Gegen Freunde spielen' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const newGame = useGameStore((s) => s.newGame);

  const handleSelect = async () => {
    await newGame();
    navigate('/play');
  };

  return (
    <div style={{
      background: 'var(--bg)', minHeight: 'calc(100vh - 52px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background bishop */}
      <span style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 'clamp(20rem, 50vw, 50rem)',
        color: 'var(--heading)', opacity: 0.035,
        lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
      }}>♗</span>

      {/* Hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'var(--heading)', lineHeight: 1 }}>♗</span>
          <h1 style={{
            color: 'var(--heading)', fontSize: 'clamp(2rem, 4vw, 2.8rem)',
            fontWeight: 700, margin: 0, letterSpacing: '-0.02em',
          }}>alu-chess</h1>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>Wähle ein Zeitformat</p>
      </div>

      {/* Time format grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', width: '100%', maxWidth: 'clamp(360px, 80vw, 600px)',
        position: 'relative', zIndex: 1,
      }}>
        {TIME_FORMATS.map(({ label, category, color }) => (
          <button
            key={label}
            onClick={handleSelect}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '22px 8px', cursor: 'pointer',
              transition: 'background 0.15s, transform 0.12s, box-shadow 0.15s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--card-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ color: 'var(--heading)', fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontWeight: 700, lineHeight: 1.2 }}>
              {label}
            </div>
            <div style={{ color, fontSize: '0.75rem', marginTop: '6px', fontWeight: 600 }}>
              {category}
            </div>
          </button>
        ))}
      </div>

      {/* Upcoming features */}
      <div style={{
        display: 'flex', gap: '12px', marginTop: '40px', flexWrap: 'wrap',
        justifyContent: 'center', position: 'relative', zIndex: 1,
      }}>
        {UPCOMING_FEATURES.map(({ icon, label, desc }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '16px 20px', width: '160px',
            opacity: 0.5, textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{icon}</div>
            <div style={{ color: 'var(--heading)', fontSize: '0.85rem', fontWeight: 600 }}>{label}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: '4px' }}>{desc}</div>
            <div style={{
              fontSize: '0.65rem', color: 'var(--brown)', fontWeight: 600,
              marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Bald verfügbar</div>
          </div>
        ))}
      </div>
    </div>
  );
}
