import SavedGames from '../components/GameHistory/SavedGames';

export default function HistoryPage() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ color: 'var(--heading)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.01em' }}>
        Gespeicherte Spiele
      </h2>
      <SavedGames />
    </div>
  );
}

