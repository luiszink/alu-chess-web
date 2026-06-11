import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { analyticsApi } from '../api/analyticsApi';
import type { AnalyticsSummary } from '../types/analytics';

// Lesbare Labels fuer die Ergebnis-Schluessel.
const RESULT_LABELS: Record<string, string> = {
  '1-0': 'Weiß gewinnt',
  '0-1': 'Schwarz gewinnt',
  '1/2-1/2': 'Remis',
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '18px 20px',
        flex: '1 1 160px',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '6px' }}>{label}</div>
      <div style={{ color: 'var(--heading)', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function DistributionBars({
  title,
  counts,
  total,
  labels,
}: {
  title: string;
  counts: Record<string, number>;
  total: number;
  labels?: Record<string, string>;
}) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      <h3 style={{ color: 'var(--heading)', fontSize: '1rem', fontWeight: 600, margin: '0 0 16px' }}>{title}</h3>
      {entries.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Keine Daten.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {entries.map(([key, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text)' }}>{labels?.[key] ?? key}</span>
                  <span style={{ color: 'var(--muted)' }}>
                    {count} · {pct}%
                  </span>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await analyticsApi.getSummary());
    } catch {
      toast.error('Analytics konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generatedAt =
    summary?.generatedAt != null ? new Date(summary.generatedAt).toLocaleString('de-DE') : null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h2 style={{ color: 'var(--heading)', fontSize: '1.3rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          Spark-Statistik
        </h2>
        <button
          onClick={() => void load()}
          disabled={loading}
          style={{
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '0.85rem',
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Lädt…' : 'Aktualisieren'}
        </button>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 24px' }}>
        Vom <code>spark-analytics</code>-Service aus den Kafka-Persistenz-Events berechnet und nach MongoDB geschrieben.
        {generatedAt && <> · Stand: {generatedAt}</>}
      </p>

      {loading && !summary ? (
        <div style={{ color: 'var(--muted)' }}>Lade Statistik…</div>
      ) : !summary?.available ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          Noch keine Auswertung vorhanden. Sobald Partien gespeichert wurden und der Spark-Service einen Batch
          verarbeitet hat, erscheinen hier die Kennzahlen.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <StatCard label="Partien gesamt" value={String(summary.totalGames)} />
            <StatCard label="Ø Zugzahl" value={summary.averageMoveCount.toFixed(1)} />
          </div>

          <DistributionBars
            title="Ergebnisverteilung"
            counts={summary.resultCounts}
            total={summary.totalGames}
            labels={RESULT_LABELS}
          />

          <DistributionBars
            title="Partien je Zeitkontrolle"
            counts={summary.timeControlCounts}
            total={summary.totalGames}
          />
        </div>
      )}
    </div>
  );
}
