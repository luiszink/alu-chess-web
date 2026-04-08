import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { controllerApi } from '../../api/controllerApi';
import { useGameStore } from '../../store/gameStore';
import type { GameRecordSummary } from '../../types/chess';
import toast from 'react-hot-toast';

function resultBadge(result: string) {
  const r = result.trim();
  let bg = 'var(--muted)';
  let text = '#fff';
  if (r === '1-0') { bg = '#e8e6e3'; text = '#161512'; }
  else if (r === '0-1') { bg = '#2c1e0f'; text = '#e8e6e3'; }
  else if (r === '½-½' || r === '1/2-1/2') { bg = 'var(--border)'; text = 'var(--heading)'; }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '4px',
      fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace',
      background: bg, color: text, letterSpacing: '0.04em',
      border: '1px solid var(--border)',
    }}>{r}</span>
  );
}

export default function SavedGames() {
  const [games, setGames] = useState<GameRecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const fetchMoveHistory = useGameStore((s) => s.fetchMoveHistory);
  const setStoreState = useGameStore((s) => s.setState);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setLoading(true);
    try {
      const result = await controllerApi.getGames();
      setGames(result.games);
    } catch {
      toast.error('Spiele konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadReplay = async (id: string) => {
    try {
      const s = await controllerApi.loadReplay(id);
      setStoreState(s);
      await fetchMoveHistory();
      navigate('/play');
      toast.success('Replay gestartet');
    } catch {
      toast.error('Replay konnte nicht geladen werden');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('de-DE', {
        weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>Lädt…</div>;
  }

  if (games.length === 0) {
    return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>Keine gespeicherten Spiele vorhanden</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {games.map((game) => (
        <div
          key={game.id}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px',
            transition: 'background 0.12s',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = 'var(--card-hover)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'}
        >
          {/* Result badge */}
          <div style={{ flexShrink: 0 }}>
            {resultBadge(game.result)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--heading)', fontWeight: 500, fontSize: '0.9rem', marginBottom: '3px' }}>
              {formatDate(game.datePlayed)}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span>{game.moveCount} Züge</span>
              <span>ID: {game.id.slice(0, 8)}…</span>
            </div>
          </div>

          {/* Action */}
          <button
            onClick={() => handleLoadReplay(game.id)}
            style={{
              padding: '7px 18px', background: 'var(--green)', color: '#fff',
              border: 'none', borderRadius: '5px', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', transition: 'filter 0.15s', flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.15)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
          >
            ▶ Ansehen
          </button>
        </div>
      ))}
    </div>
  );
}

