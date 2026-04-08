import { useEffect, useState } from 'react';
import { controllerApi } from '../../api/controllerApi';
import type { GameRecordSummary } from '../../types/chess';
import toast from 'react-hot-toast';

export default function SavedGames() {
  const [games, setGames] = useState<GameRecordSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
      await controllerApi.loadReplay(id);
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
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-400">Lädt...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-400">Keine gespeicherten Spiele vorhanden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {games.map((game) => (
        <div
          key={game.id}
          className="bg-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
        >
          <div>
            <p className="text-white font-medium">{formatDate(game.datePlayed)}</p>
            <p className="text-gray-400 text-sm">
              Ergebnis: <span className="text-white">{game.result}</span> · {game.moveCount} Züge
            </p>
          </div>
          <button
            onClick={() => handleLoadReplay(game.id)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
          >
            Abspielen
          </button>
        </div>
      ))}
    </div>
  );
}
