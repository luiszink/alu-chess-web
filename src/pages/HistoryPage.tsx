import { useNavigate } from 'react-router-dom';
import SavedGames from '../components/GameHistory/SavedGames';

export default function HistoryPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ color: 'var(--heading)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.01em' }}>
        Gespeicherte Spiele
      </h2>
      <SavedGames onLoaded={() => navigate('/analyse')} />
    </div>
  );
}
