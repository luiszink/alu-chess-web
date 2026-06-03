import type { BenchmarkResult } from '../../types/perf';

interface Props {
  result: BenchmarkResult;
  bins?: number;
}

interface HistogramBin {
  range: string;
  count: number;
}

function histogram(values: number[], bins: number): HistogramBin[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ range: min.toFixed(2), count: values.length }];
  const step = (max - min) / bins;
  const counts = new Array(bins).fill(0) as number[];
  for (const value of values) {
    const index = Math.min(bins - 1, Math.floor((value - min) / step));
    counts[index] += 1;
  }
  return counts.map((count, index) => {
    const lo = min + step * index;
    const hi = lo + step;
    return { range: `${lo.toFixed(2)}-${hi.toFixed(2)}`, count };
  });
}

export default function LatencyHistogram({ result, bins = 20 }: Props) {
  const data = histogram(result.latenciesMs, bins);
  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map((bin) => bin.count), 1);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '16px 20px',
      marginBottom: '24px',
    }}>
      <h3 style={{ color: 'var(--heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
        Latenz-Histogramm - {result.dao} / {result.config.operation}
      </h3>
      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '12px' }}>
        {result.latenciesMs.length} Messpunkte · {result.config.recordCount} Datensätze
        {' · '}{result.opsPerIteration} Operationen pro Iteration
      </div>
      <div style={{
        height: 280,
        display: 'flex',
        alignItems: 'end',
        gap: 4,
        borderLeft: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 4px 0 8px',
      }}>
        {data.map((bin) => (
          <div
            key={bin.range}
            title={`${bin.range}: ${bin.count}`}
            style={{
              flex: 1,
              minWidth: 8,
              height: `${Math.max(3, (bin.count / maxCount) * 100)}%`,
              background: '#4f46e5',
              borderRadius: '3px 3px 0 0',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: '0.7rem', marginTop: 6 }}>
        <span>{data[0]?.range.split('-')[0]} ms</span>
        <span>Anzahl</span>
        <span>{data[data.length - 1]?.range.split('-')[1]} ms</span>
      </div>
    </div>
  );
}
