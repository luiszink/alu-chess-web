import { useEffect, useState } from 'react';
import type { BenchmarkConfig, BenchmarkOp, DaoStatus } from '../../types/perf';

const OPS: BenchmarkOp[] = ['Insert', 'FindAll', 'FindById', 'Delete', 'Mixed'];

const OP_LABEL: Record<BenchmarkOp, string> = {
  Insert:   'Insert (N inserts pro Iteration)',
  FindAll:  'FindAll (gesamte Tabelle/Collection)',
  FindById: 'FindById (N Lookups pro Iteration)',
  Delete:   'Delete (N Deletes pro Iteration)',
  Mixed:    'Mixed (Insert + FindAll + FindById + Delete)',
};

interface Props {
  daos: DaoStatus[];
  running: boolean;
  onRun: (selectedDaos: string[], config: BenchmarkConfig) => void;
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--muted)',
  fontSize: '0.75rem',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text)',
  fontSize: '0.875rem',
};

export default function BenchmarkForm({ daos, running, onRun }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [operation, setOperation] = useState<BenchmarkOp>('Mixed');
  const [recordCount, setRecordCount] = useState(100);
  const [iterations, setIterations] = useState(5);
  const [warmupIterations, setWarmupIterations] = useState(1);
  const [seed, setSeed] = useState(42);

  // Default-Auswahl: alle verfügbaren DAOs
  useEffect(() => {
    if (selected.size === 0 && daos.length > 0) {
      setSelected(new Set(daos.filter(d => d.available).map(d => d.name)));
    }
  }, [daos, selected.size]);

  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name); else next.add(name);
    setSelected(next);
  };

  const submit = () => {
    if (selected.size === 0) return;
    onRun(Array.from(selected), {
      operation, recordCount, iterations, warmupIterations, seed,
    });
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '20px',
      marginBottom: '24px',
    }}>
      <h3 style={{ color: 'var(--heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
        Benchmark-Konfiguration
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <span style={labelStyle}>DAO-Backends</span>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {daos.map(d => (
            <label
              key={d.name}
              title={d.error ?? ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: d.available ? 'pointer' : 'not-allowed',
                opacity: d.available ? 1 : 0.5,
              }}
            >
              <input
                type="checkbox"
                disabled={!d.available}
                checked={selected.has(d.name)}
                onChange={() => toggle(d.name)}
              />
              <span style={{ color: 'var(--heading)', fontWeight: 500 }}>{d.name}</span>
              <span style={{
                fontSize: '0.7rem',
                color: d.available ? 'var(--success, #4ade80)' : 'var(--danger, #f87171)',
              }}>
                {d.available ? '●' : '○'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div>
          <span style={labelStyle}>Operation</span>
          <select
            value={operation}
            onChange={e => setOperation(e.target.value as BenchmarkOp)}
            style={inputStyle}
          >
            {OPS.map(op => (
              <option key={op} value={op}>{OP_LABEL[op]}</option>
            ))}
          </select>
        </div>
        <div>
          <span style={labelStyle}>Datensätze (N)</span>
          <input
            type="number" min={1} max={100_000}
            value={recordCount}
            onChange={e => setRecordCount(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div>
          <span style={labelStyle}>Iterationen</span>
          <input
            type="number" min={1} max={1000}
            value={iterations}
            onChange={e => setIterations(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div>
          <span style={labelStyle}>Warmup</span>
          <input
            type="number" min={0} max={1000}
            value={warmupIterations}
            onChange={e => setWarmupIterations(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div>
          <span style={labelStyle}>Seed</span>
          <input
            type="number"
            value={seed}
            onChange={e => setSeed(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={running || selected.size === 0}
        style={{
          padding: '8px 18px',
          background: running ? 'var(--card)' : 'var(--accent, #4f46e5)',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: running || selected.size === 0 ? 'not-allowed' : 'pointer',
          opacity: running || selected.size === 0 ? 0.6 : 1,
        }}
      >
        {running ? 'läuft …' : `Benchmark starten (${selected.size} DAO${selected.size === 1 ? '' : 's'})`}
      </button>
    </div>
  );
}
