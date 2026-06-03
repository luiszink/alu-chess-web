import type { CompareEntry } from '../../types/perf';

interface Props {
  entries: CompareEntry[];
}

const series = [
  { key: 'mean', label: 'mean', color: '#4f46e5' },
  { key: 'median', label: 'median', color: '#22c55e' },
  { key: 'p95', label: 'p95', color: '#f59e0b' },
  { key: 'p99', label: 'p99', color: '#ef4444' },
] as const;

export default function LatencyBarChart({ entries }: Props) {
  const data = entries
    .filter((entry) => entry.ok && entry.result)
    .map((entry) => ({
      dao: entry.dao,
      mean: Number(entry.result!.stats.meanMs.toFixed(3)),
      median: Number(entry.result!.stats.medianMs.toFixed(3)),
      p95: Number(entry.result!.stats.p95Ms.toFixed(3)),
      p99: Number(entry.result!.stats.p99Ms.toFixed(3)),
    }));

  if (data.length === 0) return null;

  const maxValue = Math.max(
    ...data.flatMap((entry) => series.map((item) => entry[item.key])),
    1,
  );

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '16px 20px',
      marginBottom: '24px',
    }}>
      <h3 style={{ color: 'var(--heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
        Latenzen pro DAO (ms)
      </h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {series.map((item) => (
          <span key={item.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: '0.75rem' }}>
            <span style={{ width: 10, height: 10, background: item.color, borderRadius: 2 }} />
            {item.label}
          </span>
        ))}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${data.length}, minmax(90px, 1fr))`,
        gap: 16,
        minHeight: 300,
        alignItems: 'end',
        borderLeft: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 8px 0 12px',
        overflowX: 'auto',
      }}>
        {data.map((entry) => (
          <div key={entry.dao} style={{ minWidth: 90 }}>
            <div style={{ height: 240, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'end', gap: 4 }}>
              {series.map((item) => {
                const value = entry[item.key];
                return (
                  <div
                    key={item.key}
                    title={`${entry.dao} ${item.label}: ${value} ms`}
                    style={{
                      height: `${Math.max(3, (value / maxValue) * 100)}%`,
                      background: item.color,
                      borderRadius: '3px 3px 0 0',
                    }}
                  />
                );
              })}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: 8 }}>
              {entry.dao}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
