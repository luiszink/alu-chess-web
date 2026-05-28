import { useEffect } from 'react';
import { useLichessStore } from '../store/lichessStore';
import type { LichessChallenge, LichessEvent } from '../types/lichess';

function fmtTime(secs?: number): string {
  if (!secs) return '?';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function describeChallenge(c: LichessChallenge): string {
  const tc = `${fmtTime(c.timeControl.limit)}+${c.timeControl.increment ?? 0}`;
  const who = c.challenger?.name ?? '?';
  const rated = c.rated ? 'rated' : 'casual';
  return `${who} → ${c.variant.key} ${tc} (${rated})`;
}

function describeEvent(ev: LichessEvent): string {
  switch (ev.type) {
    case 'connected':         return `verbunden als ${ev.username}`;
    case 'challenge':         return `Challenge: ${describeChallenge(ev.challenge)}`;
    case 'challengeCanceled': return `Challenge abgebrochen (${ev.id})`;
    case 'challengeDeclined': return `Challenge zurückgezogen (${ev.id})`;
    case 'accepted':          return `Challenge angenommen (${ev.id})`;
    case 'declined':          return `Challenge abgelehnt (${ev.id}, ${ev.reason})`;
    case 'gameStart':         return `Spiel gestartet (${ev.id})`;
    case 'gameFinish':        return `Spiel beendet (${ev.id})`;
    case 'gameFull':          return `gameFull ${ev.gameId} — ${ev.state.moves || '(start)'}`;
    case 'gameState':         return `gameState ${ev.gameId} — ${ev.state.moves}`;
    case 'myMove':            return `Bot-Zug ${ev.gameId}: ${ev.uci}`;
    case 'error':             return `Fehler ${ev.stage ?? ''}: ${ev.message}`;
  }
}

export default function LichessPage() {
  const status      = useLichessStore((s) => s.status);
  const events      = useLichessStore((s) => s.events);
  const error       = useLichessStore((s) => s.error);
  const refresh     = useLichessStore((s) => s.refresh);
  const connect     = useLichessStore((s) => s.connect);
  const disconnect  = useLichessStore((s) => s.disconnect);
  const clearEvents = useLichessStore((s) => s.clearEvents);

  useEffect(() => {
    refresh().catch(() => undefined);
    connect();
    return () => disconnect();
  }, [refresh, connect, disconnect]);

  const configured = status?.configured === true;

  return (
    <main style={{ padding: '24px', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ color: 'var(--heading)', margin: 0 }}>Lichess Bot</h1>

      {error && (
        <div style={{ background: '#3b1f1f', color: '#ffb4b4', padding: 10, borderRadius: 6 }}>{error}</div>
      )}

      <section style={card}>
        <h2 style={h2}>Status</h2>
        {!status && <div>Lade…</div>}
        {status && !configured && (
          <div>
            <div style={{ marginBottom: 8 }}>Nicht konfiguriert.</div>
            <div style={{ color: 'var(--muted)' }}>{status.message}</div>
          </div>
        )}
        {status && configured && (
          <div>
            <div>Angemeldet als <strong>{status.username}</strong></div>
            <div style={{ marginTop: 8, color: 'var(--muted)' }}>
              Policy: {status.policy.autoAccept ? 'auto-accept' : 'manuell'},{' '}
              {status.policy.acceptRated ? 'rated+casual' : 'casual'}, Varianten:{' '}
              {status.policy.variants.join(', ')}, Zeit{' '}
              {status.policy.minInitialSeconds}–{status.policy.maxInitialSeconds}s, max{' '}
              {status.policy.maxGames} Spiele
            </div>
          </div>
        )}
      </section>

      {status && configured && (
        <section style={card}>
          <h2 style={h2}>Aktive Spiele ({status.games.length})</h2>
          {status.games.length === 0 && <div style={{ color: 'var(--muted)' }}>Keine.</div>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {status.games.map((id) => (
              <li key={id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <a
                  href={`https://lichess.org/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--heading)' }}
                >
                  {id}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {status && configured && (
        <section style={card}>
          <h2 style={h2}>Offene Challenges ({status.challenges.length})</h2>
          {status.challenges.length === 0 && <div style={{ color: 'var(--muted)' }}>Keine.</div>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {status.challenges.map((c) => (
              <li key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                {describeChallenge(c)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={h2}>Event-Log</h2>
          <button onClick={clearEvents} style={btn}>Leeren</button>
        </div>
        <div style={{ maxHeight: 320, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}>
          {events.length === 0 && <div style={{ color: 'var(--muted)' }}>Keine Events.</div>}
          {events.map((ev, i) => (
            <div key={i} style={{ padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              {describeEvent(ev)}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 16,
};

const h2: React.CSSProperties = { color: 'var(--heading)', margin: 0, fontSize: '1.1rem' };

const btn: React.CSSProperties = {
  padding: '4px 10px',
  background: 'transparent',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  cursor: 'pointer',
};
