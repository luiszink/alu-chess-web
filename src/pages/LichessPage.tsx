import { useEffect, useState } from 'react';
import { useLichessStore } from '../store/lichessStore';
import { lichessApi } from '../api/lichessApi';
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

type BotPreset = { name: string; description: string };
const BOT_PRESETS: BotPreset[] = [
  { name: 'maia1',           description: 'Maia ~1100 (menschlich, Anfänger)' },
  { name: 'maia5',           description: 'Maia ~1500 (menschlich, Klubspieler)' },
  { name: 'maia9',           description: 'Maia ~1900 (menschlich, stark)' },
  { name: 'Boris-Trapsky',   description: 'Eröffnungsexperte' },
  { name: 'leelaknightodds', description: 'Lc0 mit Springer-Vorgabe' },
  { name: 'raspfish',        description: 'Stockfish auf Raspberry Pi' },
];

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
    case 'challengeCreated':  return `Challenge erstellt → ${ev.target}`;
    case 'aborted':           return `Spiel abgebrochen (${ev.id})`;
    case 'resigned':          return `Aufgegeben (${ev.id})`;
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

  const [opponent, setOpponent]     = useState('');
  const [limitMin, setLimitMin]     = useState(5);
  const [increment, setIncrement]   = useState(3);
  const [rated, setRated]           = useState(false);
  const [color, setColor]           = useState<'random' | 'white' | 'black'>('random');
  const [busy, setBusy]             = useState(false);
  const [actionError, setActionErr] = useState<string | null>(null);

  useEffect(() => {
    refresh().catch(() => undefined);
    connect();
    return () => disconnect();
  }, [refresh, connect, disconnect]);

  const configured = status?.configured === true;

  async function handleChallenge(e: React.FormEvent) {
    e.preventDefault();
    setActionErr(null);
    if (!opponent.trim()) return;
    setBusy(true);
    try {
      await lichessApi.createChallenge({
        username: opponent.trim(),
        limitSeconds: Math.round(limitMin * 60),
        incrementSeconds: increment,
        rated,
        color,
      });
      setOpponent('');
      refresh().catch(() => undefined);
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAbort(id: string) {
    setActionErr(null);
    try { await lichessApi.abortGame(id); refresh().catch(() => undefined); }
    catch (err) { setActionErr(err instanceof Error ? err.message : String(err)); }
  }

  async function handleResign(id: string) {
    setActionErr(null);
    try { await lichessApi.resignGame(id); refresh().catch(() => undefined); }
    catch (err) { setActionErr(err instanceof Error ? err.message : String(err)); }
  }

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
            <div style={{ marginBottom: 8 }}>
              {status.state === 'connecting' && 'Verbinde…'}
              {status.state === 'failed' && 'Verbindung fehlgeschlagen.'}
              {(status.state === 'notConfigured' || !status.state) && 'Nicht konfiguriert.'}
            </div>
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
          <h2 style={h2}>Challenge versenden</h2>
          {actionError && (
            <div style={{ background: '#3b1f1f', color: '#ffb4b4', padding: 8, borderRadius: 6, marginBottom: 8 }}>
              {actionError}
            </div>
          )}
          <form onSubmit={handleChallenge} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', alignItems: 'end' }}>
            <label style={lbl}>
              Gegner (Lichess-Username)
              <input
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="z. B. maia1"
                style={inp}
              />
            </label>
            <label style={lbl}>
              Farbe
              <select value={color} onChange={(e) => setColor(e.target.value as 'random' | 'white' | 'black')} style={inp}>
                <option value="random">zufällig</option>
                <option value="white">weiß</option>
                <option value="black">schwarz</option>
              </select>
            </label>
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BOT_PRESETS.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => { setOpponent(b.name); setRated(false); }}
                  title={b.description}
                  style={{
                    ...btn,
                    background: opponent === b.name ? 'var(--card-hover, #2a2a2a)' : 'transparent',
                  }}
                >
                  {b.name}
                </button>
              ))}
            </div>
            <label style={lbl}>
              Zeit (Minuten)
              <input
                type="number"
                min={1}
                max={60}
                value={limitMin}
                onChange={(e) => setLimitMin(Number(e.target.value))}
                style={inp}
              />
            </label>
            <label style={lbl}>
              Inkrement (Sekunden)
              <input
                type="number"
                min={0}
                max={60}
                value={increment}
                onChange={(e) => setIncrement(Number(e.target.value))}
                style={inp}
              />
            </label>
            <label style={{ ...lbl, gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={rated} onChange={(e) => setRated(e.target.checked)} />
              <span>rated</span>
            </label>
            <button type="submit" disabled={busy || !opponent.trim()} style={{ ...btn, gridColumn: '1 / -1' }}>
              {busy ? 'Sende…' : 'Challenge senden'}
            </button>
          </form>
          <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
            Hinweis: Gegen Bot-Konten ist nur <em>casual</em> erlaubt. Wenn ein Bot nicht antwortet, ist er evtl. offline — probiere einen anderen aus der Liste.
          </div>
        </section>
      )}

      {status && configured && (
        <section style={card}>
          <h2 style={h2}>Aktive Spiele ({status.games.length})</h2>
          {status.games.length === 0 && <div style={{ color: 'var(--muted)' }}>Keine.</div>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {status.games.map((id) => (
              <li
                key={id}
                style={{
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <a
                  href={`https://lichess.org/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--heading)', flex: 1 }}
                >
                  {id}
                </a>
                <button onClick={() => handleAbort(id)} style={btn}>Abbrechen</button>
                <button onClick={() => handleResign(id)} style={btn}>Aufgeben</button>
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

const lbl: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  color: 'var(--muted)',
  fontSize: 12,
};

const inp: React.CSSProperties = {
  padding: '6px 8px',
  background: 'var(--bg)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 4,
};
