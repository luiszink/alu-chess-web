import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { useGameStore } from '../store/gameStore';
import type { GameSessionResponse } from '../types/chess';
import { playerApi } from '../api/playerApi';

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
  { icon: '🧩', label: 'Rätsel', desc: 'Taktik-Aufgaben lösen' },
  { icon: '📖', label: 'Eröffnungen', desc: 'Eröffnungs-Explorer' },
];

// Modal-Overlay
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '28px 32px', width: '100%', maxWidth: '380px',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { register, createHvAISession, createHvHSession, joinHvHSession,
          pollUntilActive, playerId, loading, error } = usePlayerStore();
  const setActiveGameId = useGameStore(s => s.setActiveGameId);

  // Overlay state: null | 'name-hvai' | 'name-hvh' | 'lobby' | 'waiting'
  const [overlay, setOverlay] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [pendingAction, setPendingAction] = useState<'hvai' | 'hvh' | null>(null);
  const [waitingSessions, setWaitingSessions] = useState<GameSessionResponse[]>([]);
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (overlay === 'lobby') {
      playerApi.listWaitingSessions()
        .then(r => setWaitingSessions(r.sessions))
        .catch(() => setWaitingSessions([]));
    }
  }, [overlay]);

  async function ensureRegistered(action: 'hvai' | 'hvh') {
    if (playerId) {
      proceedWithAction(action);
    } else {
      setPendingAction(action);
      setOverlay('name');
    }
  }

  async function handleNameSubmit() {
    if (!name.trim()) { setNameError('Bitte gib deinen Namen ein.'); return; }
    setNameError('');
    try {
      await register(name.trim());
      setOverlay(null);
      if (pendingAction) proceedWithAction(pendingAction);
    } catch {
      setNameError('Registrierung fehlgeschlagen.');
    }
  }

  async function proceedWithAction(action: 'hvai' | 'hvh') {
    if (action === 'hvai') {
      const gameId = await createHvAISession();
      if (gameId) {
        setActiveGameId(gameId);
        navigate('/play');
      }
    } else {
      setOverlay('lobby');
    }
  }

  async function handleSelectTimeFormat() {
    await ensureRegistered('hvai');
  }

  async function handleCreateHvH() {
    const gameId = await createHvHSession();
    if (gameId) {
      setCreatedGameId(gameId);
      setOverlay('waiting');
      const resolvedId = await pollUntilActive();
      if (resolvedId) {
        setActiveGameId(resolvedId);
        navigate('/play');
      }
    }
  }

  async function handleJoinHvH(gameId: string) {
    const resolvedId = await joinHvHSession(gameId);
    if (resolvedId) {
      setOverlay('waiting');
      setCreatedGameId(resolvedId);
      const activeId = await pollUntilActive();
      if (activeId) {
        setActiveGameId(activeId);
        navigate('/play');
      }
    }
  }

  const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.background = 'var(--card-hover)';
    el.style.transform = 'translateY(-2px)';
    el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
  };
  const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.background = 'var(--card)';
    el.style.transform = 'translateY(0)';
    el.style.boxShadow = 'none';
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
            onClick={handleSelectTimeFormat}
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '22px 8px', cursor: 'pointer',
              transition: 'background 0.15s, transform 0.12s, box-shadow 0.15s',
              textAlign: 'center',
            }}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
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

      {/* Features */}
      <div style={{
        display: 'flex', gap: '12px', marginTop: '40px', flexWrap: 'wrap',
        justifyContent: 'center', position: 'relative', zIndex: 1,
      }}>
        {/* Analyse */}
        <button
          onClick={() => navigate('/analyse')}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '16px 20px', width: '160px',
            textAlign: 'center', cursor: 'pointer',
            transition: 'background 0.15s, transform 0.12s, box-shadow 0.15s',
          }}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🔍</div>
          <div style={{ color: 'var(--heading)', fontSize: '0.85rem', fontWeight: 600 }}>Analyse</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: '4px' }}>Partie-Analyse mit Engine</div>
        </button>

        {/* Mehrspieler — jetzt verfügbar */}
        <button
          onClick={() => ensureRegistered('hvh')}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '16px 20px', width: '160px',
            textAlign: 'center', cursor: 'pointer',
            transition: 'background 0.15s, transform 0.12s, box-shadow 0.15s',
          }}
          onMouseEnter={hoverOn} onMouseLeave={hoverOff}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>👥</div>
          <div style={{ color: 'var(--heading)', fontSize: '0.85rem', fontWeight: 600 }}>Mehrspieler</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: '4px' }}>Gegen Freunde spielen</div>
        </button>

        {/* Still upcoming */}
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

      {/* ── Name-Eingabe Overlay ── */}
      {overlay === 'name' && (
        <Overlay>
          <h3 style={{ color: 'var(--heading)', margin: '0 0 16px', fontWeight: 700 }}>Wie heißt du?</h3>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
            placeholder="Dein Name"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '11px 14px', fontSize: '1rem',
              color: 'var(--heading)', outline: 'none', marginBottom: '8px',
            }}
          />
          {nameError && (
            <p style={{ color: '#e55', margin: '0 0 10px', fontSize: '0.82rem' }}>{nameError}</p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={() => { setOverlay(null); setPendingAction(null); }}
              style={{
                flex: 1, padding: '10px', background: 'var(--card)',
                border: '1px solid var(--border)', borderRadius: '8px',
                color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem',
              }}
            >Abbrechen</button>
            <button
              onClick={handleNameSubmit}
              disabled={loading}
              style={{
                flex: 2, padding: '10px', background: 'var(--brown)',
                border: 'none', borderRadius: '8px', color: '#fff',
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, fontSize: '0.95rem',
              }}
            >{loading ? 'Laden…' : 'Weiter →'}</button>
          </div>
        </Overlay>
      )}

      {/* ── Lobby Overlay ── */}
      {overlay === 'lobby' && (
        <Overlay>
          <h3 style={{ color: 'var(--heading)', margin: '0 0 16px', fontWeight: 700 }}>Mehrspieler</h3>
          {waitingSessions.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '0 0 8px' }}>Offene Spiele:</p>
              {waitingSessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleJoinHvH(s.id)}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '11px 14px', marginBottom: '6px',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between',
                    color: 'var(--heading)', fontSize: '0.88rem',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
                >
                  <span>Spiel beitreten</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{s.id.slice(0, 8)}…</span>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleCreateHvH}
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: 'var(--brown)',
              border: 'none', borderRadius: '8px', color: '#fff',
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, fontSize: '0.95rem', marginBottom: '8px',
            }}
          >{loading ? 'Laden…' : '+ Neues Spiel erstellen'}</button>
          {error && <p style={{ color: '#e55', fontSize: '0.82rem', margin: '4px 0 0' }}>{error}</p>}
          <button
            onClick={() => setOverlay(null)}
            style={{
              width: '100%', padding: '9px', background: 'none',
              border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem',
            }}
          >← Zurück</button>
        </Overlay>
      )}

      {/* ── Waiting Overlay ── */}
      {overlay === 'waiting' && (
        <Overlay>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
            <h3 style={{ color: 'var(--heading)', margin: '0 0 8px', fontWeight: 700 }}>
              Warte auf Gegner…
            </h3>
            {createdGameId && (
              <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '0 0 16px' }}>
                Spiel-ID: <code style={{ color: 'var(--heading)' }}>{createdGameId.slice(0, 8)}…</code>
              </p>
            )}
            <div style={{
              width: '32px', height: '32px', margin: '0 auto',
              border: '3px solid var(--border)', borderTop: '3px solid var(--brown)',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </Overlay>
      )}
    </div>
  );
}
