import { useEffect, useRef, useState, useCallback } from 'react';
import { tournamentApi } from '../api/tournamentApi';
import type { BotStatus, TournamentInfo, TournamentList } from '../types/tournament';

// ── Shared styles ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '1.25rem',
};

const h2: React.CSSProperties = {
  color: 'var(--heading)',
  fontSize: '0.95rem',
  fontWeight: 600,
  marginBottom: '0.75rem',
};

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: 'var(--muted)',
  marginBottom: '0.25rem',
  marginTop: '0.6rem',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.6rem',
  borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '0.9rem',
};

const btnPrimary: React.CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.45rem 1.2rem',
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  background: '#e94560',
  color: '#fff',
};

const btnSecondary: React.CSSProperties = {
  padding: '0.3rem 0.75rem',
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 600,
  background: 'var(--surface)',
  color: 'var(--text)',
};

const btnSuccess: React.CSSProperties = {
  padding: '0.3rem 0.75rem',
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: 600,
  background: '#1a7a1a',
  color: '#fff',
};

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: BotStatus['status'] }) {
  const colors: Record<string, React.CSSProperties> = {
    idle:    { background: '#2a2a3a', color: '#aaa' },
    playing: { background: '#1a5a1a', color: '#fff' },
    error:   { background: '#5a1a1a', color: '#fff' },
  };
  return (
    <span
      style={{
        padding: '0.2rem 0.7rem',
        borderRadius: 999,
        fontSize: '0.75rem',
        fontWeight: 600,
        ...(colors[status] ?? colors.idle),
      }}
    >
      {status}
    </span>
  );
}

function BadgeStatus({ s }: { s: string }) {
  const colors: Record<string, React.CSSProperties> = {
    created:  { background: '#2a2a3a', color: '#aaa' },
    started:  { background: '#1a5a1a', color: '#fff' },
    finished: { background: '#3a3836', color: '#ccc' },
  };
  return (
    <span
      style={{
        fontSize: '0.7rem',
        padding: '0.1rem 0.4rem',
        borderRadius: 4,
        marginLeft: 6,
        ...(colors[s] ?? colors.created),
      }}
    >
      {s}
    </span>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function TournamentPage() {
  const [botStatus, setBotStatus]       = useState<BotStatus>({ status: 'idle' });
  const [tournamentList, setTournList]  = useState<TournamentList | null>(null);
  const [loadingList, setLoadingList]   = useState(false);
  const [logs, setLogs]                 = useState<{ text: string; err: boolean }[]>([
    { text: 'Warte auf Log-Einträge…', err: false },
  ]);

  // Create form
  const [cName,    setCName]    = useState('alu-chess Bot Battle');
  const [cRounds,  setCRounds]  = useState(5);
  const [cClock,   setCClock]   = useState(300);
  const [cInc,     setCInc]     = useState(3);
  const [cFormat,  setCFormat]  = useState('swiss');

  // Connect / start
  const [connectId, setConnectId] = useState('');
  const [startId,   setStartId]   = useState('');

  const logsEndRef = useRef<HTMLDivElement>(null);

  function addLog(text: string, err = false) {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-199), { text: `[${ts}] ${text}`, err }]);
  }

  // ── Status polling ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const s = await tournamentApi.status();
        if (!cancelled) setBotStatus(s);
      } catch { /* ignore */ }
      if (!cancelled) setTimeout(poll, 3000);
    }
    poll();
    return () => { cancelled = true; };
  }, []);

  // ── SSE log stream ─────────────────────────────────────────────────────────
  useEffect(() => {
    let es: EventSource;
    function connect() {
      es = new EventSource(tournamentApi.logsUrl());
      es.onmessage = (e) => {
        const text = (e.data as string).trim();
        if (text) addLog(text);
      };
      es.onerror = () => { es.close(); setTimeout(connect, 3000); };
    }
    connect();
    return () => es?.close();
  }, []);

  // Scroll logs to bottom on new entry
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // ── Load tournaments ───────────────────────────────────────────────────────
  const loadTournaments = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await tournamentApi.list();
      setTournList(data);
    } catch (e) {
      addLog(`Fehler beim Laden: ${e instanceof Error ? e.message : String(e)}`, true);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleConnect() {
    const id = connectId.trim();
    if (!id) return;
    try {
      await tournamentApi.connect(id);
      addLog(`Bot verbunden mit ${id}`);
      loadTournaments();
    } catch (e) {
      addLog(`Fehler: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  }

  async function handleStart(id: string) {
    const tid = id.trim();
    if (!tid) return;
    try {
      await tournamentApi.start(tid);
      addLog(`Tournament ${tid} gestartet`);
      loadTournaments();
    } catch (e) {
      addLog(`Fehler: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  }

  async function handleCreate() {
    try {
      const d = await tournamentApi.create({
        name: cName,
        nbRounds: cRounds,
        clockLimit: cClock,
        clockIncrement: cInc,
        format: cFormat,
      });
      addLog(`Tournament erstellt: ${(d as { id?: string }).id ?? JSON.stringify(d)}`);
      loadTournaments();
    } catch (e) {
      addLog(`Fehler: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  }

  // ── All tournaments flat ───────────────────────────────────────────────────
  const allTournaments: (TournamentInfo & { _status: string })[] = tournamentList
    ? [
        ...tournamentList.created.map( (t) => ({ ...t, _status: 'created'  })),
        ...tournamentList.started.map( (t) => ({ ...t, _status: 'started'  })),
        ...tournamentList.finished.map((t) => ({ ...t, _status: 'finished' })),
      ]
    : [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>♟ Tournament</h1>
        <StatusPill status={botStatus.status} />
        {botStatus.tournamentId && (
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Tournament: {botStatus.tournamentId}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Bot Status */}
        <section style={card}>
          <h2 style={h2}>Bot Status</h2>
          {(
            [
              ['Status',        botStatus.status],
              ['Tournament',    botStatus.tournamentId ?? '—'],
              ['Runde',         botStatus.round != null ? String(botStatus.round) : '—'],
              ['Aktive Spiele', botStatus.gamesActive != null ? String(botStatus.gamesActive) : '—'],
            ] as [string, string][]
          ).map(([k, v]) => (
            <div
              key={k}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}
            >
              <span>{k}</span>
              <span style={{ color: '#e94560', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </section>

        {/* Connect bot */}
        <section style={card}>
          <h2 style={h2}>Bot verbinden</h2>
          <span style={label}>Tournament-ID</span>
          <input
            style={input}
            placeholder="z.B. t7kXq2"
            value={connectId}
            onChange={(e) => setConnectId(e.target.value)}
          />
          <button style={btnPrimary} onClick={handleConnect}>Bot starten</button>

          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={label}>Tournament starten (Director)</span>
            <input
              style={input}
              placeholder="Tournament-ID"
              value={startId}
              onChange={(e) => setStartId(e.target.value)}
            />
            <button style={{ ...btnPrimary, background: '#1a7a1a' }} onClick={() => handleStart(startId)}>
              Starten
            </button>
          </div>
        </section>

        {/* Tournament list – full width */}
        <section style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ ...h2, marginBottom: 0 }}>Tournaments</h2>
            <button style={btnSecondary} onClick={loadTournaments} disabled={loadingList}>
              {loadingList ? 'Lädt…' : 'Aktualisieren'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {!tournamentList && <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Lädt…</span>}
            {tournamentList && allTournaments.length === 0 && (
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Keine Tournaments gefunden</span>
            )}
            {allTournaments.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>{t.name}</strong>
                  <BadgeStatus s={t._status} />
                  <br />
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {t.id}
                  </span>
                  {' · '}{t.players} Spieler · {t.rounds} Runden · {t.format}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={btnSecondary} onClick={() => {
                    setConnectId(t.id);
                    tournamentApi.connect(t.id)
                      .then(() => { addLog(`Bot verbunden mit ${t.id}`); loadTournaments(); })
                      .catch((e: unknown) => addLog(`Fehler: ${e instanceof Error ? e.message : String(e)}`, true));
                  }}>
                    Verbinden
                  </button>
                  {t._status === 'created' && (
                    <button style={btnSuccess} onClick={() => handleStart(t.id)}>
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Create tournament */}
        <section style={card}>
          <h2 style={h2}>Tournament erstellen</h2>
          <span style={label}>Name</span>
          <input style={input} value={cName} onChange={(e) => setCName(e.target.value)} />

          <span style={label}>Runden</span>
          <input style={input} type="number" min={1} value={cRounds} onChange={(e) => setCRounds(+e.target.value)} />

          <span style={label}>Bedenkzeit (Sekunden)</span>
          <input style={input} type="number" min={30} value={cClock} onChange={(e) => setCClock(+e.target.value)} />

          <span style={label}>Inkrement (Sekunden)</span>
          <input style={input} type="number" min={0} value={cInc} onChange={(e) => setCInc(+e.target.value)} />

          <span style={label}>Format</span>
          <select style={{ ...input }} value={cFormat} onChange={(e) => setCFormat(e.target.value)}>
            <option value="swiss">Swiss</option>
            <option value="singleElimination">Single Elimination</option>
            <option value="doubleElimination">Double Elimination</option>
            <option value="league">League</option>
          </select>

          <button style={btnPrimary} onClick={handleCreate}>Erstellen</button>
        </section>

        {/* Bot Log */}
        <section style={card}>
          <h2 style={h2}>Bot Log (Live)</h2>
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 6,
              padding: '0.75rem',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              height: 260,
              overflowY: 'auto',
              border: '1px solid var(--border)',
            }}
          >
            {logs.map((l, i) => (
              <p
                key={i}
                style={{ marginBottom: '0.2rem', color: l.err ? '#f77' : '#7cf', wordBreak: 'break-all' }}
              >
                {l.text}
              </p>
            ))}
            <div ref={logsEndRef} />
          </div>
        </section>

      </div>
    </main>
  );
}
