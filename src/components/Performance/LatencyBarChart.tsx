import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import type { CompareEntry } from '../../types/perf';

interface Props {
  entries: CompareEntry[];
}

export default function LatencyBarChart({ entries }: Props) {
  const data = entries
    .filter(e => e.ok && e.result)
    .map(e => ({
      dao: e.dao,
      mean: Number(e.result!.stats.meanMs.toFixed(3)),
      median: Number(e.result!.stats.medianMs.toFixed(3)),
      p95: Number(e.result!.stats.p95Ms.toFixed(3)),
      p99: Number(e.result!.stats.p99Ms.toFixed(3)),
    }));

  if (data.length === 0) return null;

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
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="dao" stroke="var(--muted)" />
            <YAxis stroke="var(--muted)" />
            <Tooltip
              contentStyle={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
            <Legend />
            <Bar dataKey="mean"   fill="#4f46e5" name="mean" />
            <Bar dataKey="median" fill="#22c55e" name="median" />
            <Bar dataKey="p95"    fill="#f59e0b" name="p95" />
            <Bar dataKey="p99"    fill="#ef4444" name="p99" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
