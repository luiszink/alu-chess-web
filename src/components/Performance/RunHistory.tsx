import type { BenchmarkResult } from '../../types/perf';

interface Props {
  runs: BenchmarkResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const cellStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.8rem',
  color: 'var(--text)',
  fontVariantNumeric: 'tabular-nums',
};

const headStyle: React.CSSProperties = {
  ...cellStyle,
  color: 'var(--muted)',
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
};

export default function RunHistory({ runs, selectedId, onSelect }: Props) {
  if (runs.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '20px',
        marginBottom: '24px',
        color: 'var(--muted)',
        fontSize: '0.875rem',
      }}>
        Noch keine Benchmark-Runs gespeichert.
      </div>
    );
  }
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <h3 style={{ color: 'var(--heading)', fontSize: '1rem', fontWeight: 600, padding: '16px 20px 8px' }}>
        Verlauf ({runs.length})
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headStyle}>Zeit</th>
            <th style={headStyle}>DAO</th>
            <th style={headStyle}>Op</th>
            <th style={{ ...headStyle, textAlign: 'right' }}>N</th>
            <th style={{ ...headStyle, textAlign: 'right' }}>iter</th>
            <th style={{ ...headStyle, textAlign: 'right' }}>mean ms</th>
            <th style={{ ...headStyle, textAlign: 'right' }}>ops/sec</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(r => {
            const isSel = r.id === selectedId;
            return (
              <tr
                key={r.id}
                onClick={() => onSelect(r.id)}
                style={{
                  cursor: 'pointer',
                  background: isSel ? 'var(--card)' : 'transparent',
                }}
              >
                <td style={cellStyle}>{r.startedAt.replace('T', ' ').slice(0, 19)}</td>
                <td style={{ ...cellStyle, color: 'var(--heading)', fontWeight: 600 }}>{r.dao}</td>
                <td style={cellStyle}>{r.config.operation}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{r.config.recordCount}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{r.config.iterations}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{r.stats.meanMs.toFixed(2)}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>{r.stats.opsPerSec.toFixed(0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
