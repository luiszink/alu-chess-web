import { useEffect, useRef, useState, useCallback } from 'react';
import { tournamentApi, getMyBotName, setMyBotName } from '../api/tournamentApi';
import type {
  BotStatus,
  TournamentInfo,
  TournamentList,
  RoundPairings,
  Standing,
  AnalyticsExport,
  Pairing,
} from '../types/tournament';

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.6rem',
  borderRadius: 4,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
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

// ── Win/Draw/Loss badge ───────────────────────────────────────────────────────

function WinnerBadge({ winner }: { winner?: string | null }) {
  if (!winner) return <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>läuft…</span>;
  const bg = winner === 'white' ? '#c8b464' : winner === 'black' ? '#444' : '#3a5a7a';
  const lbl = winner === 'white' ? '○ Weiß' : winner === 'black' ? '● Schwarz' : '½ Remis';
  return (
    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: 4, background: bg, color: '#fff', fontWeight: 600 }}>
      {lbl}
    </span>
  );
}

// ── Chess Board (FEN renderer) ────────────────────────────────────────────────

const PIECE_GLYPHS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

function ChessBoard({ fen, lastUci, flipped = false }: { fen: string; lastUci?: string; flipped?: boolean }) {
  if (!fen) return null;
  const boardFen = fen.split(' ')[0];
  const rows = boardFen.split('/');

  // Build 8x8 grid [rank0=rank8 .. rank7=rank1]
  const grid: (string | null)[][] = rows.map((row) => {
    const cells: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) cells.push(...Array(parseInt(ch)).fill(null));
      else cells.push(ch);
    }
    return cells;
  });

  const fromSq = lastUci?.slice(0, 2);
  const toSq   = lastUci?.slice(2, 4);

  const rankIndices = flipped ? [0,1,2,3,4,5,6,7] : [0,1,2,3,4,5,6,7];
  const fileIndices = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  return (
    <div style={{ display: 'inline-block', border: '2px solid #555', borderRadius: 2, userSelect: 'none' }}>
      {rankIndices.map((rankIdx) => (
        <div key={rankIdx} style={{ display: 'flex' }}>
          {fileIndices.map((fileIdx) => {
            const piece = grid[rankIdx]?.[fileIdx] ?? null;
            const sq = String.fromCharCode(97 + fileIdx) + (8 - rankIdx);
            const isLight = (rankIdx + fileIdx) % 2 === 0;
            const isFrom = sq === fromSq;
            const isTo   = sq === toSq;
            const bg = isFrom || isTo ? '#f6f669' : isLight ? '#f0d9b5' : '#b58863';
            return (
              <div
                key={fileIdx}
                style={{
                  width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bg,
                  fontSize: 24,
                  lineHeight: 1,
                  color: piece && piece === piece.toUpperCase() ? '#fff' : '#111',
                  textShadow: piece && piece === piece.toUpperCase()
                    ? '0 0 2px #000, 0 0 2px #000'
                    : '0 0 1px #eee',
                }}
              >
                {piece ? (PIECE_GLYPHS[piece] ?? piece) : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Game Watcher (live NDJSON stream) ─────────────────────────────────────────

interface LiveGameEvent {
  type: string;
  moves?: string;
  fen?: string;
  status?: string;
  turn?: string;
  winner?: string | null;
  uci?: string;
}

function GameWatcher({ tournamentId, gameId, white, black }: { tournamentId: string; gameId: string; white: string; black: string }) {
  const [events, setEvents] = useState<string[]>([]);
  const [fen, setFen] = useState('');
  const [lastUci, setLastUci] = useState('');
  const [status, setStatus] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [turn, setTurn] = useState<string>('white');
  const logsRef = useRef<HTMLDivElement>(null);

  // Load game via REST as fallback (works for finished games where stream closes immediately)
  const loadGameRest = useCallback(async () => {
    try {
      const g = await fetch(`/api/tournament/${encodeURIComponent(tournamentId)}/game/${encodeURIComponent(gameId)}`).then(r => r.json()) as any;
      if (g.fen) setFen(g.fen);
      if (g.status) setStatus(g.status);
      if (g.turn)   setTurn(g.turn);
      if (g.winner) setWinner(g.winner);
      if (g.moves && typeof g.moves === 'string') {
        const ucis = g.moves.trim().split(' ').filter(Boolean);
        if (ucis.length > 0) {
          setLastUci(ucis[ucis.length - 1]);
          setEvents(ucis);
        }
      }
    } catch { /* ignore */ }
  }, [tournamentId, gameId]);

  useEffect(() => {
    let cancelled = false;
    let gotData = false;
    const ctrl = new AbortController();

    async function stream() {
      try {
        const res = await tournamentApi.getGameStream(tournamentId, gameId, ctrl.signal);
        if (!res.ok || !res.body) { loadGameRest(); return; }
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buf = '';
        // Set a timeout — if no data after 2s, fall back to REST
        const fallbackTimer = setTimeout(() => { if (!gotData) loadGameRest(); }, 2000);
        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += value;
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const ev = JSON.parse(trimmed) as LiveGameEvent;
              if (ev.type === 'heartbeat') continue;
              gotData = true;
              clearTimeout(fallbackTimer);
              if (ev.type === 'gameState') {
                if (ev.fen)    setFen(ev.fen);
                if (ev.status) setStatus(ev.status);
                if (ev.turn)   setTurn(ev.turn);
                // Parse moves from gameState for move log
                if (ev.moves) {
                  const ucis = ev.moves.trim().split(' ').filter(Boolean);
                  if (ucis.length > 0) {
                    setLastUci(ucis[ucis.length - 1]);
                    setEvents(ucis);
                  }
                }
              } else if (ev.type === 'move') {
                if (ev.fen)  setFen(ev.fen);
                if (ev.turn) setTurn(ev.turn);
                if (ev.uci)  { setLastUci(ev.uci); setEvents((p) => [...p.slice(-99), ev.uci!]); }
              } else if (ev.type === 'gameEnd') {
                setStatus(ev.status ?? 'finished');
                setWinner(ev.winner ?? null);
                setEvents((p) => [...p.slice(-99), `Ende: ${ev.status} · ${ev.winner ?? 'Remis'}`]);
              }
            } catch { /* skip malformed */ }
          }
        }
        clearTimeout(fallbackTimer);
        // Stream ended — if no data received, fall back to REST
        if (!gotData) loadGameRest();
      } catch { if (!gotData) loadGameRest(); }
    }

    stream();
    return () => { cancelled = true; ctrl.abort(); };
  }, [tournamentId, gameId, loadGameRest]);

  const isFinished = ['checkmate', 'stalemate', 'draw', 'resigned', 'timeout', 'finished'].includes(status);

  return (
    <div style={{ marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
          <span style={{ color: '#c8b464' }}>○ {white}</span>
          <span style={{ color: 'var(--muted)', margin: '0 6px' }}>vs</span>
          <span style={{ color: '#aaa' }}>● {black}</span>
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isFinished && (
            <span style={{ fontSize: '0.75rem', color: turn === 'white' ? '#c8b464' : '#aaa', fontWeight: 600 }}>
              {turn === 'white' ? '○ Weiß' : '● Schwarz'} am Zug
            </span>
          )}
          {isFinished && <WinnerBadge winner={winner} />}
          {status && <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{status}</span>}
        </div>
      </div>

      {/* Board + Move log side by side */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Chess board */}
        <div>
          {fen
            ? <ChessBoard fen={fen} lastUci={lastUci} />
            : <div style={{ width: 288, height: 288, background: 'var(--bg)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>Warte auf Brett…</div>
          }
        </div>

        {/* Move log */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Züge</div>
          <div
            style={{
              background: 'var(--bg)',
              borderRadius: 4,
              padding: '0.4rem 0.6rem',
              maxHeight: 290,
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              lineHeight: 1.6,
            }}
          >
            {events.length === 0
              ? <span style={{ color: 'var(--muted)' }}>Warte auf Züge…</span>
              : events.reduce<React.ReactNode[]>((acc, uci, i) => {
                  if (i % 2 === 0) {
                    acc.push(
                      <div key={i} style={{ display: 'flex', gap: 6 }}>
                        <span style={{ color: 'var(--muted)', minWidth: 28 }}>{Math.floor(i / 2) + 1}.</span>
                        <span style={{ color: '#c8b464' }}>{uci}</span>
                        {events[i + 1] && <span style={{ color: '#aaa' }}>{events[i + 1]}</span>}
                      </div>
                    );
                  }
                  return acc;
                }, [])
            }
            <div ref={logsRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pairings table ────────────────────────────────────────────────────────────

function PairingsView({ tournamentId, maxRound }: { tournamentId: string; maxRound: number }) {
  const [round, setRound] = useState(1);
  const [data, setData] = useState<RoundPairings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roundNotPlayed, setRoundNotPlayed] = useState(false);
  const [watchingGameId, setWatchingGameId] = useState<string | null>(null);

  const load = useCallback(async (r: number) => {
    setLoading(true);
    setError('');
    setRoundNotPlayed(false);
    try {
      const d = await tournamentApi.roundPairings(tournamentId, r);
      setData(d);
      // Auto-watch the first game with a gameId (if only one pairing)
      if (d.pairings.length === 1 && d.pairings[0].gameId) {
        setWatchingGameId((prev) => prev ?? d.pairings[0].gameId!);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('not found')) {
        setRoundNotPlayed(true);
        setData(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(round); }, [round, load]);

  // Auto-refresh every 4s so pairing results appear without manual click
  useEffect(() => {
    const timer = setInterval(() => load(round), 4000);
    return () => clearInterval(timer);
  }, [round, load]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Runde:</span>
        {Array.from({ length: maxRound }, (_, i) => i + 1).map((r) => (
          <button
            key={r}
            style={{ ...btnSecondary, background: r === round ? '#e94560' : 'var(--surface)', color: r === round ? '#fff' : 'var(--text)' }}
            onClick={() => setRound(r)}
          >
            {r}
          </button>
        ))}
        <button style={btnSecondary} onClick={() => load(round)}>↻</button>
      </div>
      {loading && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Lädt…</p>}
      {error && <p style={{ color: '#f77', fontSize: '0.85rem' }}>{error}</p>}
      {roundNotPlayed && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Runde {round} wurde noch nicht gespielt.</p>}
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.pairings.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Keine Paarungen für diese Runde.</p>
          )}
          {data.pairings.map((p: Pairing, i: number) => (
            <div key={p.gameId ?? i}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr auto auto',
                  alignItems: 'center',
                  gap: 12,
                  background: watchingGameId === p.gameId ? 'rgba(233,69,96,0.08)' : 'var(--bg)',
                  border: `1px solid ${watchingGameId === p.gameId ? '#e94560' : 'var(--border)'}`,
                  borderRadius: 6,
                  padding: '0.6rem 0.9rem',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ textAlign: 'right', fontWeight: 600 }}>○ {p.white.name}</span>
                <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>vs</span>
                <span style={{ fontWeight: 600 }}>● {p.black.name}</span>
                <WinnerBadge winner={p.winner} />
                {p.gameId && (
                  <button
                    style={{ ...btnSecondary, fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => setWatchingGameId(watchingGameId === p.gameId ? null : p.gameId!)}
                  >
                    {watchingGameId === p.gameId ? '✕ Schließen' : '👁 Zuschauen'}
                  </button>
                )}
              </div>
              {watchingGameId === p.gameId && p.gameId && (
                <GameWatcher
                  tournamentId={tournamentId}
                  gameId={p.gameId}
                  white={p.white.name}
                  black={p.black.name}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Standings table ───────────────────────────────────────────────────────────

function StandingsView({ standings }: { standings: Standing[] }) {
  if (standings.length === 0)
    return <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Noch keine Standings verfügbar.</p>;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
      <thead>
        <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
          <th style={{ padding: '0.4rem 0.6rem' }}>#</th>
          <th style={{ padding: '0.4rem 0.6rem' }}>Bot</th>
          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>Punkte</th>
          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>S / R / V</th>
          <th style={{ padding: '0.4rem 0.6rem', textAlign: 'center' }}>Buchholz</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((s, i) => (
          <tr key={s.bot.id} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'rgba(233,69,96,0.07)' : 'transparent' }}>
            <td style={{ padding: '0.4rem 0.6rem', color: 'var(--muted)' }}>{i === 0 ? '🏆' : s.rank}</td>
            <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600 }}>{s.bot.name}</td>
            <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', color: '#e94560', fontWeight: 700 }}>{s.points}</td>
            <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', color: 'var(--muted)' }}>
              {s.wins ?? '?'} / {s.draws ?? '?'} / {s.losses ?? '?'}
            </td>
            <td style={{ padding: '0.4rem 0.6rem', textAlign: 'center', color: 'var(--muted)' }}>
              {s.tieBreak?.toFixed(1) ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Analytics view ────────────────────────────────────────────────────────────

function AnalyticsView({ data }: { data: AnalyticsExport }) {
  const totalGames = data.games.length;
  const whiteWins  = data.games.filter((g) => g.winner === 'white').length;
  const blackWins  = data.games.filter((g) => g.winner === 'black').length;
  const draws      = data.games.filter((g) => g.winner === 'draw' || g.winner == null).length;

  const reasonCounts = data.games.reduce<Record<string, number>>((acc, g) => {
    acc[g.terminationReason] = (acc[g.terminationReason] ?? 0) + 1;
    return acc;
  }, {});

  const avgPly = totalGames > 0
    ? (data.games.reduce((s, g) => s + g.totalPly, 0) / totalGames).toFixed(1)
    : '—';

  const avgDur =
    totalGames > 0 && data.games.some((g) => g.durationMillis)
      ? Math.round(data.games.reduce((s, g) => s + (g.durationMillis ?? 0), 0) / totalGames / 1000) + 's'
      : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {([
          ['Spiele gesamt', String(totalGames)],
          ['Ø Halbzüge',    avgPly],
          ['Ø Dauer',       avgDur],
          ['Format',        data.format],
          ['Bewertet',      data.rated ? 'Ja' : 'Nein'],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.6rem 1rem', flex: '1 1 120px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--heading)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Color advantage bar */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}>Ergebnisverteilung</div>
        {totalGames > 0 && (
          <div style={{ display: 'flex', height: 20, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
            <div style={{ flex: whiteWins, background: '#c8b464' }} title={`Weiß: ${whiteWins}`} />
            <div style={{ flex: draws,     background: '#4a6a8a' }} title={`Remis: ${draws}`} />
            <div style={{ flex: blackWins, background: '#555'    }} title={`Schwarz: ${blackWins}`} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.8rem' }}>
          <span style={{ color: '#c8b464' }}>○ Weiß: {whiteWins} ({totalGames > 0 ? Math.round(whiteWins / totalGames * 100) : 0}%)</span>
          <span style={{ color: '#7ab'   }}>½ Remis: {draws} ({totalGames > 0 ? Math.round(draws / totalGames * 100) : 0}%)</span>
          <span style={{ color: '#aaa'   }}>● Schwarz: {blackWins} ({totalGames > 0 ? Math.round(blackWins / totalGames * 100) : 0}%)</span>
        </div>
      </div>

      {/* Termination reasons */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}>Beendigungsgründe</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).map(([reason, count]) => {
            const pct = totalGames > 0 ? Math.round((count / totalGames) * 100) : 0;
            return (
              <div key={reason}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                  <span>{reason}</span>
                  <span style={{ color: 'var(--muted)' }}>{count} · {pct}%</span>
                </div>
                <div style={{ background: 'var(--surface)', borderRadius: 3, height: 8 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#e94560', borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final standings from analytics export */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem 1rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 8 }}>Endabrechnung</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
              <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>#</th>
              <th style={{ padding: '0.3rem 0.5rem', textAlign: 'left' }}>Bot</th>
              <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center' }}>Punkte</th>
              <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center' }}>S/R/V</th>
              <th style={{ padding: '0.3rem 0.5rem', textAlign: 'center' }}>Familie</th>
            </tr>
          </thead>
          <tbody>
            {data.standings.map((s, i) => (
              <tr key={s.botId} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.3rem 0.5rem', color: 'var(--muted)' }}>{i === 0 ? '🏆' : s.rank}</td>
                <td style={{ padding: '0.3rem 0.5rem', fontWeight: 600 }}>{s.botName}</td>
                <td style={{ padding: '0.3rem 0.5rem', textAlign: 'center', color: '#e94560', fontWeight: 700 }}>{s.points}</td>
                <td style={{ padding: '0.3rem 0.5rem', textAlign: 'center', color: 'var(--muted)' }}>{s.wins}/{s.draws}/{s.losses}</td>
                <td style={{ padding: '0.3rem 0.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.75rem' }}>
                  {s.botFamily ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tournament Detail Panel ───────────────────────────────────────────────────

type DetailTab = 'standings' | 'pairings' | 'analytics';

function TournamentDetail({
  tournament,
  onClose,
  onConnect,
  onStart,
}: {
  tournament: TournamentInfo & { _status: string };
  onClose: () => void;
  onConnect: (id: string) => void;
  onStart: (id: string) => void;
}) {
  const [tab, setTab] = useState<DetailTab>(tournament._status === 'started' ? 'pairings' : 'standings');
  const [standings, setStandings] = useState<Standing[]>([]);
  const [standingsError, setStandingsError] = useState('');
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsExport | null>(null);
  const [analyticsError, setAnalyticsError] = useState('');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const isStarted  = tournament._status === 'started';
  const isFinished = tournament._status === 'finished';

  const loadStandings = useCallback(async () => {
    setLoadingStandings(true);
    setStandingsError('');
    try {
      const data = await tournamentApi.results(tournament.id);
      setStandings(data);
    } catch (e) {
      setStandingsError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingStandings(false);
    }
  }, [tournament.id]);

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    setAnalyticsError('');
    try {
      const data = await tournamentApi.analyticsExport(tournament.id);
      setAnalytics(data);
    } catch (e) {
      setAnalyticsError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingAnalytics(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    if (tab === 'standings') loadStandings();
    if (tab === 'analytics') loadAnalytics();
  }, [tab, loadStandings, loadAnalytics]);

  // Auto-refresh standings every 5s while tournament is running
  useEffect(() => {
    if (!isStarted || tab !== 'standings') return;
    const timer = setInterval(loadStandings, 5000);
    return () => clearInterval(timer);
  }, [isStarted, tab, loadStandings]);

  const tabBtn = (t: DetailTab, lbl: string) => (
    <button
      style={{
        padding: '0.4rem 1rem',
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: 600,
        background: tab === t ? '#e94560' : 'var(--surface)',
        color: tab === t ? '#fff' : 'var(--text)',
      }}
      onClick={() => setTab(t)}
    >
      {lbl}
    </button>
  );

  return (
    <div style={{ ...card, gridColumn: '1 / -1', borderColor: '#e94560' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ ...h2, marginBottom: 4, fontSize: '1.05rem' }}>
            {tournament.fullName}
            <BadgeStatus s={tournament._status} />
          </h2>
          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--muted)' }}>{tournament.id}</span>
          <span style={{ marginLeft: 12, fontSize: '0.8rem', color: 'var(--muted)' }}>
            {tournament.nbPlayers} Spieler · {tournament.nbRounds} Runden · {tournament.format}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {tournament._status !== 'finished' && (
            <button style={btnSecondary} onClick={() => onConnect(tournament.id)}>🤖 Beitreten</button>
          )}
          {tournament._status === 'created' && (
            <button style={btnSuccess} onClick={() => onStart(tournament.id)}>Starten</button>
          )}
          <button style={{ ...btnSecondary, padding: '0.2rem 0.6rem' }} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
        {tabBtn('standings', `Standings${isStarted ? ' 🔴' : ''}`)}
        {(isStarted || isFinished) && tabBtn('pairings', 'Paarungen')}
        {isFinished && tabBtn('analytics', 'Analytics')}
      </div>

      {/* Content */}
      {tab === 'standings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button style={btnSecondary} onClick={loadStandings} disabled={loadingStandings}>
              {loadingStandings ? 'Lädt…' : '↻'}
            </button>
          </div>
          {standingsError && <p style={{ color: '#f77', fontSize: '0.85rem' }}>{standingsError}</p>}
          {!standingsError && <StandingsView standings={standings} />}
        </div>
      )}

      {tab === 'pairings' && (isStarted || isFinished) && (
        <PairingsView tournamentId={tournament.id} maxRound={tournament.nbRounds} />
      )}

      {tab === 'analytics' && isFinished && (
        <div>
          {loadingAnalytics && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Lädt Analytics…</p>}
          {analyticsError && (
            <div>
              <p style={{ color: '#f77', fontSize: '0.85rem' }}>{analyticsError}</p>
              <button style={btnSecondary} onClick={loadAnalytics}>Erneut versuchen</button>
            </div>
          )}
          {analytics && <AnalyticsView data={analytics} />}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function TournamentPage() {
  const [botStatus, setBotStatus]      = useState<BotStatus>({ status: 'idle' });
  const [tournamentList, setTournList] = useState<TournamentList | null>(null);
  const [loadingList, setLoadingList]  = useState(false);
  const [logs, setLogs]                = useState<{ text: string; err: boolean }[]>([
    { text: 'Warte auf Log-Einträge…', err: false },
  ]);
  const [selectedTournament, setSelected] = useState<(TournamentInfo & { _status: string }) | null>(null);

  // Bot name (configurable)
  const [botName, setBotNameState] = useState(() => getMyBotName());
  const [botNameEdit, setBotNameEdit] = useState(botName);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  // Create form
  const [cName,   setCName]   = useState('alu-chess Bot Battle');
  const [cRounds, setCRounds] = useState(5);
  const [cClock,  setCClock]  = useState(300);
  const [cInc,    setCInc]    = useState(3);
  const [cFormat, setCFormat] = useState('swiss');

  // Manual connect / start inputs (unused – kept for future use)
  const [_connectId] = useState('');
  const [_startId]   = useState('');

  const logsEndRef = useRef<HTMLDivElement>(null);

  function addLog(text: string, err = false) {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-199), { text: `[${ts}] ${text}`, err }]);
  }

  // ── Status polling ──────────────────────────────────────────────────────────
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

  // ── SSE log stream ──────────────────────────────────────────────────────────
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

  // ── Load tournaments ────────────────────────────────────────────────────────
  const loadTournaments = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await tournamentApi.list();
      setTournList(data);
      // Auto-open first started tournament
      if (data.started.length > 0) {
        setSelected((prev) =>
          prev ? prev : { ...data.started[0], _status: 'started' }
        );
      }
    } catch (e) {
      addLog(`Fehler beim Laden: ${e instanceof Error ? e.message : String(e)}`, true);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadTournaments(); }, [loadTournaments]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  /** Lässt deinen Bot einem Tournament beitreten (isBot=true Token) */
  async function handleJoin(id: string) {
    const tid = id.trim();
    if (!tid) return;
    try {
      await tournamentApi.join(tid);
      // Start the server-side bot loop so the bot actually plays its games and
      // reports a "playing" status — joining alone leaves it idle.
      await tournamentApi.connectBot(tid);
      setJoinedIds((prev) => new Set([...prev, tid]));
      addLog(`Bot "${botName}" ist Tournament ${tid} beigetreten und spielt jetzt`);
      loadTournaments();
    } catch (e) {
      addLog(`Fehler beim Beitreten: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  }

  async function handleConnect(id: string) {
    return handleJoin(id);
  }

  async function handleStart(id: string) {
    const tid = id.trim();
    if (!tid) return;
    try {
      await tournamentApi.start(tid);
      addLog(`Tournament ${tid} gestartet`);
      loadTournaments();
      setSelected((prev) => prev?.id === tid ? { ...prev, _status: 'started' } : prev);
    } catch (e) {
      addLog(`Fehler: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  }

  async function handleCreate() {
    try {
      const d = await tournamentApi.create({ name: cName, nbRounds: cRounds, clockLimit: cClock, clockIncrement: cInc, format: cFormat });
      addLog(`Tournament erstellt: ${(d as { id?: string }).id ?? JSON.stringify(d)}`);
      loadTournaments();
    } catch (e) {
      addLog(`Fehler: ${e instanceof Error ? e.message : String(e)}`, true);
    }
  }

  // ── All tournaments flat (started first) ────────────────────────────────────
  const allTournaments: (TournamentInfo & { _status: string })[] = tournamentList
    ? [
        ...tournamentList.started.map( (t) => ({ ...t, _status: 'started'  })),
        ...tournamentList.created.map( (t) => ({ ...t, _status: 'created'  })),
        ...tournamentList.finished.map((t) => ({ ...t, _status: 'finished' })),
      ]
    : [];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ color: 'var(--heading)', margin: 0 }}>♟ Tournament</h1>
        <StatusPill status={botStatus.status} />
        {botStatus.tournamentId && (
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            {botStatus.tournamentId} · Runde {botStatus.round ?? '?'} · {botStatus.gamesActive ?? 0} aktiv
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Tournament list – full width */}
        <section style={{ ...card, gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h2 style={{ ...h2, marginBottom: 0 }}>
              Tournaments
              <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 400 }}>
                — Klicken zum Öffnen
              </span>
            </h2>
            <button style={btnSecondary} onClick={loadTournaments} disabled={loadingList}>
              {loadingList ? 'Lädt…' : '↻ Aktualisieren'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
            {!tournamentList && <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Lädt…</span>}
            {tournamentList && allTournaments.length === 0 && (
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Keine Tournaments gefunden</span>
            )}
            {allTournaments.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(selectedTournament?.id === t.id ? null : t)}
                style={{
                  background: selectedTournament?.id === t.id ? 'rgba(233,69,96,0.08)' : 'var(--bg)',
                  border: `1px solid ${selectedTournament?.id === t.id ? '#e94560' : 'var(--border)'}`,
                  borderRadius: 6,
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontSize: '0.85rem' }}>
                  <strong>{t.fullName}</strong>
                  <BadgeStatus s={t._status} />
                  <br />
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{t.id}</span>
                  {' · '}{t.nbPlayers} Spieler · {t.nbRounds} Runden · {t.format}
                </div>
                <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {/* Beitreten: für alle noch nicht-finished Tournaments bei denen wir noch nicht joined sind */}
                  {t._status !== 'finished' && !joinedIds.has(t.id) && (
                    <button style={btnSecondary} onClick={() => handleJoin(t.id)}>
                      🤖 Beitreten
                    </button>
                  )}
                  {t._status === 'created' && (
                    <button style={btnSuccess} onClick={() => handleStart(t.id)}>Starten</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detail panel */}
        {selectedTournament && (
          <TournamentDetail
            tournament={selectedTournament}
            onClose={() => setSelected(null)}
            onConnect={handleConnect}
            onStart={handleStart}
          />
        )}

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

        {/* Bot-Name Einstellung */}
        <section style={card}>
          <h2 style={h2}>Mein Bot</h2>
          <span style={label}>Bot-Name</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={botNameEdit}
              onChange={(e) => setBotNameEdit(e.target.value)}
              placeholder="z.B. MyTeam-Bot"
            />
            <button
              style={btnPrimary}
              onClick={() => {
                const name = botNameEdit.trim();
                if (!name) return;
                setMyBotName(name);
                setBotNameState(name);
                setJoinedIds(new Set()); // Reset joins (neuer Bot-Name = neuer Bot)
                addLog(`Bot-Name geändert zu "${name}" – Token zurückgesetzt`);
              }}
            >
              Speichern
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 6 }}>
            Dieser Bot tritt Tournaments bei wenn du auf "🤖 Beitreten" klickst.
            Aktuell registriert als: <strong style={{ color: '#e94560' }}>{botName}</strong>
          </p>
        </section>

        {/* Create tournament */}
        <section style={card}>
          <h2 style={h2}>Tournament erstellen</h2>
          <span style={label}>Name</span>
          <input style={inputStyle} value={cName} onChange={(e) => setCName(e.target.value)} />

          <span style={label}>Runden</span>
          <input style={inputStyle} type="number" min={1} value={cRounds} onChange={(e) => setCRounds(+e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <span style={label}>Bedenkzeit (s)</span>
              <input style={inputStyle} type="number" min={30} value={cClock} onChange={(e) => setCClock(+e.target.value)} />
            </div>
            <div>
              <span style={label}>Inkrement (s)</span>
              <input style={inputStyle} type="number" min={0} value={cInc} onChange={(e) => setCInc(+e.target.value)} />
            </div>
          </div>

          <span style={label}>Format</span>
          <select style={{ ...inputStyle }} value={cFormat} onChange={(e) => setCFormat(e.target.value)}>
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
              <p key={i} style={{ marginBottom: '0.2rem', color: l.err ? '#f77' : '#7cf', wordBreak: 'break-all' }}>
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
