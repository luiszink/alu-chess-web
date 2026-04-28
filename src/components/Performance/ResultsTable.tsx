import type { CompareEntry } from '../../types/perf';

interface Props {
  entries: CompareEntry[];
}

const fmt = (n: number, digits = 2) =>
  Number.isFinite(n) ? n.toFixed(digits) : '–';

const cellStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  textAlign: 'right',
  color: 'var(--text)',
  fontVariantNumeric: 'tabular-nums',
};

const headStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: 'right',
  color: 'var(--muted)',
  fontSize: '0.7rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function ResultsTable({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      overflow: 'hidden',
      marginBottom: '24px',
    }}>
      <h3 style={{ color: 'var(--heading)', fontSize: '1rem', fontWeight: 600, padding: '16px 20px 8px' }}>
        Vergleich
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr>
            <th style={{ ...headStyle, textAlign: 'left' }}>DAO</th>
            <th style={{ ...headStyle, textAlign: 'left' }}>Operation</th>
            <th style={headStyle}>min ms</th>
            <th style={headStyle}>mean ms</th>
            <th style={headStyle}>median ms</th>
            <th style={headStyle}>p95 ms</th>
            <th style={headStyle}>p99 ms</th>
            <th style={headStyle}>max ms</th>
            <th style={headStyle}>ops/sec</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => {
            if (!e.ok || !e.result) {
              return (
                <tr key={e.dao}>
                  <td style={{ ...cellStyle, textAlign: 'left', color: 'var(--heading)', fontWeight: 600 }}>{e.dao}</td>
                  <td colSpan={8} style={{ ...cellStyle, textAlign: 'left', color: 'var(--danger, #f87171)' }}>
                    {e.message ?? 'Fehler'}
                  </td>
                </tr>
              );
            }
            const s = e.result.stats;
            return (
              <tr key={e.dao}>
                <td style={{ ...cellStyle, textAlign: 'left', color: 'var(--heading)', fontWeight: 600 }}>{e.dao}</td>
                <td style={{ ...cellStyle, textAlign: 'left' }}>{e.result.config.operation}</td>
                <td style={cellStyle}>{fmt(s.minMs)}</td>
                <td style={cellStyle}>{fmt(s.meanMs)}</td>
                <td style={cellStyle}>{fmt(s.medianMs)}</td>
                <td style={cellStyle}>{fmt(s.p95Ms)}</td>
                <td style={cellStyle}>{fmt(s.p99Ms)}</td>
                <td style={cellStyle}>{fmt(s.maxMs)}</td>
                <td style={cellStyle}>{fmt(s.opsPerSec, 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
