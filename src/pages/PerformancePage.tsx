import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { perfApi } from '../api/perfApi';
import BenchmarkForm from '../components/Performance/BenchmarkForm';
import LatencyBarChart from '../components/Performance/LatencyBarChart';
import LatencyHistogram from '../components/Performance/LatencyHistogram';
import ResultsTable from '../components/Performance/ResultsTable';
import RunHistory from '../components/Performance/RunHistory';
import type {
  BenchmarkConfig, BenchmarkResult, CompareEntry, DaoStatus,
} from '../types/perf';

export default function PerformancePage() {
  const [daos, setDaos] = useState<DaoStatus[]>([]);
  const [running, setRunning] = useState(false);
  const [latest, setLatest] = useState<CompareEntry[]>([]);
  const [runs, setRuns] = useState<BenchmarkResult[]>([]);
  const [selected, setSelected] = useState<BenchmarkResult | null>(null);

  const refreshRuns = useCallback(async () => {
    try {
      const r = await perfApi.listRuns(50);
      setRuns(r.runs);
    } catch (e) {
      console.error('listRuns failed', e);
    }
  }, []);

  // Initial: DAO-Liste + Run-Historie laden
  useEffect(() => {
    perfApi.listDaos()
      .then(r => setDaos(r.daos))
      .catch(() => toast.error('Konnte DAO-Liste nicht laden'));
    refreshRuns();
  }, [refreshRuns]);

  const onRun = async (selectedDaos: string[], config: BenchmarkConfig) => {
    setRunning(true);
    setLatest([]);
    setSelected(null);
    const t = toast.loading(`Benchmarke ${selectedDaos.length} DAO(s)…`);
    try {
      const res = await perfApi.compare(selectedDaos, config);
      setLatest(res.results);
      const ok = res.results.filter(e => e.ok).length;
      const err = res.results.length - ok;
      toast.success(`${ok} erfolgreich${err ? `, ${err} mit Fehler` : ''}`, { id: t });
      const firstOk = res.results.find(e => e.ok && e.result)?.result ?? null;
      setSelected(firstOk);
      await refreshRuns();
    } catch (e) {
      console.error(e);
      toast.error('Benchmark fehlgeschlagen', { id: t });
    } finally {
      setRunning(false);
    }
  };

  const onSelectRun = async (id: string) => {
    try {
      const r = await perfApi.getRun(id);
      setSelected(r);
    } catch {
      toast.error('Run konnte nicht geladen werden');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
      <h2 style={{
        color: 'var(--heading)', fontSize: '1.4rem', fontWeight: 700,
        marginBottom: '8px', letterSpacing: '-0.01em',
      }}>
        DAO-Performance
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '24px' }}>
        Vergleicht die Persistenz-Backends (Postgres / MongoDB / In-Memory) auf Basis
        echter Schach-Partien. Ergebnisse werden persistent in der konfigurierten
        Haupt-Datenbank abgelegt (<code>DB_TYPE</code>).
      </p>

      <BenchmarkForm daos={daos} running={running} onRun={onRun} />

      <ResultsTable entries={latest} />
      <LatencyBarChart entries={latest} />

      {selected && <LatencyHistogram result={selected} />}

      <RunHistory
        runs={runs}
        selectedId={selected?.id ?? null}
        onSelect={onSelectRun}
      />
    </div>
  );
}
