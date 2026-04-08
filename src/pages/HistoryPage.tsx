import SavedGames from '../components/GameHistory/SavedGames';

export default function HistoryPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold text-white mb-4">Gespeicherte Spiele</h2>
      <SavedGames />
    </div>
  );
}
