import FenPgnTools from '../components/Controls/FenPgnTools';

export default function ToolsPage() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
      <h2 style={{ color: 'var(--heading)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>
        Werkzeuge
      </h2>
      <FenPgnTools />
    </div>
  );
}
