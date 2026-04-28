import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import type { BenchmarkResult } from '../../types/perf';

interface Props {
  result: BenchmarkResult;
  bins?: number;
}

/** Build a fixed-bin histogram from raw latencies. */
function histogram(values: number[], bins: number) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ range: min.toFixed(2), count: values.length }];
  const step = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v - min) / step));
    counts[idx] += 1;
  }
  return counts.map((count, i) => {
    const lo = min + step * i;
    const hi = lo + step;
    return { range: `${lo.toFixed(2)}–${hi.toFixed(2)}`, count };
  });
}

export default function LatencyHistogram({ result, bins = 20 }: Props) {
  const data = histogram(result.latenciesMs, bins);
  if (data.length === 0) return null;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '16px 20px',
      marginBottom: '24px',
    }}>
      <h3 style={{ color: 'var(--heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '4px' }}>
        Latenz-Histogramm – {result.dao} / {result.config.operation}
      </h3>
      <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '12px' }}>
        {result.latenciesMs.length} Messpunkte · {result.config.recordCount} Datensätze
        · {result.opsPerIteration} Operationen pro Iteration
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="range" stroke="var(--muted)" tick={{ fontSize: 10 }} />
            <YAxis stroke="var(--muted)" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
            <Bar dataKey="count" fill="#4f46e5" name="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
