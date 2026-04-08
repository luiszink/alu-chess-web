import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { controllerApi } from '../../api/controllerApi';
import { useGameStore } from '../../store/gameStore';
import type { GameRecordSummary } from '../../types/chess';
import toast from 'react-hot-toast';

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
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
        Lädt…
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
        Keine gespeicherten Spiele vorhanden
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {games.map((game) => (
        <div
          key={game.id}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background 0.12s',
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.background = 'var(--card-hover)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'}
        >
          <div>
            <div style={{ color: 'var(--heading)', fontWeight: 500, fontSize: '0.9rem', marginBottom: '2px' }}>
              {formatDate(game.datePlayed)}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
              Ergebnis: <span style={{ color: 'var(--text)' }}>{game.result}</span>
              {' · '}{game.moveCount} Züge
            </div>
          </div>
          <button
            onClick={() => handleLoadReplay(game.id)}
            style={{
              padding: '6px 14px',
              background: 'var(--green)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)'}
            onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.filter = 'none'}
          >
            Ansehen
          </button>
        </div>
      ))}
    </div>
  );
}

