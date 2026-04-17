import { useState } from 'react';
import { controllerApi } from '../../api/controllerApi';
import { modelApi } from '../../api/modelApi';
import { useGameStore } from '../../store/gameStore';
import toast from 'react-hot-toast';
import type { EngineOptions, MoveJson, TestPosition } from '../../types/chess';

function formatEval(scoreCp: number, mate: number | null): string {
  if (mate !== null) {
    if (mate > 0) return `Matt in ${mate}`;
    return `Matt in ${Math.abs(mate)} (gegen dich)`;
  }

  const pawns = scoreCp / 100;
  return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(2)}`;
}

function formatMove(move: MoveJson): string {
  return move.promotion ? `${move.from} -> ${move.to}=${move.promotion}` : `${move.from} -> ${move.to}`;
}

function normalizeNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

export default function FenPgnTools() {
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [activeTab, setActiveTab] = useState<'fen' | 'pgn' | 'analysis' | 'export' | 'test'>('fen');
  const [testPositions, setTestPositions] = useState<TestPosition[]>([]);
  const state = useGameStore((s) => s.state);
  const engine = useGameStore((s) => s.engine);
  const loadFen = useGameStore((s) => s.loadFen);
  const refreshEngineHealth = useGameStore((s) => s.refreshEngineHealth);
  const setEngineOptions = useGameStore((s) => s.setEngineOptions);
  const requestBestMove = useGameStore((s) => s.requestBestMove);
  const requestEvaluation = useGameStore((s) => s.requestEvaluation);
  const clearEngineAnalysis = useGameStore((s) => s.clearEngineAnalysis);

  const currentFen = state?.game.fen;

  const updateEngineOption = (key: keyof EngineOptions, value: string) => {
    setEngineOptions({ [key]: normalizeNumber(value, engine.options[key]) } as Pick<EngineOptions, typeof key>);
  };

  const handleLoadFen = async () => {
    if (!fenInput.trim()) return;
    await loadFen(fenInput.trim());
    setFenInput('');
  };

  const handleLoadPgn = async () => {
    if (!pgnInput.trim()) return;
    try {
      const game = await modelApi.parsePgn(pgnInput.trim());
      await loadFen(game.fen);
      setPgnInput('');
      toast.success('PGN geladen');
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e.message ?? 'PGN ungültig');
    }
  };

  const handleExportJson = async () => {
    try {
      const data = await controllerApi.exportGame();
      const jsonStr = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(jsonStr);
      toast.success('JSON in Zwischenablage kopiert');
    } catch {
      toast.error('Export fehlgeschlagen');
    }
  };

  const handleImportJson = async () => {
    try {
      const text = await navigator.clipboard.readText();
      await controllerApi.importGame(text);
      toast.success('Spiel importiert');
    } catch {
      toast.error('Import fehlgeschlagen');
    }
  };

  const handleLoadTestPositions = async () => {
    try {
      const result = await modelApi.getTestPositions();
      setTestPositions(result.positions);
    } catch {
      toast.error('Test-Positionen konnten nicht geladen werden');
    }
  };

  const handleLoadTestPosition = async (fen: string) => {
    await loadFen(fen);
    toast.success('Position geladen');
  };

  const tabs = [
    { key: 'fen' as const, label: 'FEN' },
    { key: 'pgn' as const, label: 'PGN' },
    { key: 'analysis' as const, label: 'Analyse' },
    { key: 'export' as const, label: 'Import/Export' },
    { key: 'test' as const, label: 'Test' },
  ];

  return (
    <div style={{ background: 'var(--card)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'test' && testPositions.length === 0) {
                handleLoadTestPositions();
              }
              if (tab.key === 'analysis' && !engine.health && !engine.healthLoading) {
                void refreshEngineHealth();
              }
            }}
            style={{
              flex: 1, padding: '6px 8px', fontSize: '0.78rem', fontWeight: 500,
              background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.key ? 'var(--heading)' : 'var(--muted)',
              border: 'none', cursor: 'pointer',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={(e) => { if (activeTab !== tab.key) e.currentTarget.style.color = 'var(--muted)'; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px' }}>
        {activeTab === 'fen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
              placeholder="FEN-String eingeben..."
              style={{
                width: '100%', padding: '6px 10px',
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px',
                color: 'var(--heading)', fontSize: '0.85rem',
                outline: 'none',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleLoadFen}
              disabled={!fenInput.trim()}
              style={{
                width: '100%', padding: '6px 10px',
                background: fenInput.trim() ? 'var(--green)' : 'var(--border)',
                color: fenInput.trim() ? '#fff' : 'var(--muted)',
                border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600,
                cursor: fenInput.trim() ? 'pointer' : 'default',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={(e) => { if (fenInput.trim()) e.currentTarget.style.filter = 'brightness(1.15)'; }}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
            >
              FEN laden
            </button>
          </div>
        )}

        {activeTab === 'pgn' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              placeholder="PGN eingeben..."
              rows={3}
              style={{
                width: '100%', padding: '6px 10px',
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px',
                color: 'var(--heading)', fontSize: '0.85rem', resize: 'none',
                outline: 'none',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--green)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleLoadPgn}
              disabled={!pgnInput.trim()}
              style={{
                width: '100%', padding: '6px 10px',
                background: pgnInput.trim() ? 'var(--green)' : 'var(--border)',
                color: pgnInput.trim() ? '#fff' : 'var(--muted)',
                border: 'none', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600,
                cursor: pgnInput.trim() ? 'pointer' : 'default',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={(e) => { if (pgnInput.trim()) e.currentTarget.style.filter = 'brightness(1.15)'; }}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
            >
              PGN laden
            </button>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--heading)', fontSize: '0.78rem', fontWeight: 600 }}>Engine-Status</span>
                <span style={{
                  color: engine.healthError
                    ? '#cc6f6f'
                    : engine.health?.status === 'ok'
                      ? 'var(--green)'
                      : 'var(--muted)',
                  fontSize: '0.75rem',
                }}>
                  {engine.healthLoading
                    ? 'Prüfe Verbindung...'
                    : engine.healthError
                      ? `Fehler: ${engine.healthError}`
                      : engine.health
                        ? `${engine.health.service}: ${engine.health.status}`
                        : 'Noch nicht geprüft'}
                </span>
              </div>
              <button
                onClick={() => void refreshEngineHealth()}
                disabled={engine.healthLoading}
                style={{
                  padding: '4px 8px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text)',
                  fontSize: '0.74rem',
                  cursor: engine.healthLoading ? 'default' : 'pointer',
                }}
              >
                {engine.healthLoading ? '...' : 'Aktualisieren'}
              </button>
            </div>

            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>Think ms</span>
                <input
                  type="number"
                  min={100}
                  max={10000}
                  value={engine.options.thinkTimeMs}
                  onChange={(e) => updateEngineOption('thinkTimeMs', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--heading)',
                    fontSize: '0.8rem',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>Skill (1-20)</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={engine.options.skillLevel}
                  onChange={(e) => updateEngineOption('skillLevel', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--heading)',
                    fontSize: '0.8rem',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>Threads</span>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={engine.options.threads}
                  onChange={(e) => updateEngineOption('threads', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--heading)',
                    fontSize: '0.8rem',
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.74rem' }}>Hash MB</span>
                <input
                  type="number"
                  min={16}
                  max={1024}
                  value={engine.options.hashMb}
                  onChange={(e) => updateEngineOption('hashMb', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--heading)',
                    fontSize: '0.8rem',
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => void requestBestMove(currentFen)}
                disabled={!currentFen || engine.loadingBestMove}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  background: !currentFen || engine.loadingBestMove ? 'var(--border)' : 'var(--green)',
                  color: !currentFen || engine.loadingBestMove ? 'var(--muted)' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: !currentFen || engine.loadingBestMove ? 'default' : 'pointer',
                }}
              >
                {engine.loadingBestMove ? 'Berechne...' : 'Best Move'}
              </button>
              <button
                onClick={() => void requestEvaluation(currentFen)}
                disabled={!currentFen || engine.loadingEvaluation}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  background: !currentFen || engine.loadingEvaluation ? 'var(--border)' : 'var(--green)',
                  color: !currentFen || engine.loadingEvaluation ? 'var(--muted)' : '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: !currentFen || engine.loadingEvaluation ? 'default' : 'pointer',
                }}
              >
                {engine.loadingEvaluation ? 'Berechne...' : 'Evaluate'}
              </button>
            </div>

            <button
              onClick={clearEngineAnalysis}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--text)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              Analyse zurücksetzen
            </button>

            {engine.error && (
              <div style={{
                padding: '7px 8px',
                borderRadius: '5px',
                background: 'rgba(183, 79, 79, 0.15)',
                color: '#cc6f6f',
                fontSize: '0.75rem',
                border: '1px solid rgba(183, 79, 79, 0.35)',
              }}>
                {engine.error}
              </div>
            )}

            {(engine.bestMove || engine.evaluation) && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--heading)', fontSize: '0.78rem', fontWeight: 600 }}>Analyse-Ergebnis</span>
                  {engine.isStale && (
                    <span style={{ color: 'var(--brown)', fontSize: '0.7rem', fontWeight: 600 }}>veraltet</span>
                  )}
                </div>

                {engine.bestMove && (
                  <div style={{ color: 'var(--text)', fontSize: '0.76rem' }}>
                    <strong>Best Move:</strong> {formatMove(engine.bestMove.move)}
                    {' '}({engine.bestMove.uci})
                  </div>
                )}

                {engine.evaluation && (
                  <div style={{ color: 'var(--text)', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span><strong>Eval:</strong> {formatEval(engine.evaluation.scoreCp, engine.evaluation.mate)}</span>
                    <span><strong>PV Move:</strong> {formatMove(engine.evaluation.bestMove)}</span>
                    <span style={{ color: 'var(--muted)' }}>
                      Tiefe {engine.evaluation.depth}, {engine.evaluation.nodes.toLocaleString('de-DE')} Knoten, {engine.evaluation.timeMs}ms
                    </span>
                  </div>
                )}

                {engine.lastAnalysedFen && (
                  <div style={{ color: 'var(--muted)', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                    FEN: {engine.lastAnalysedFen}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleExportJson}
              style={{
                width: '100%', padding: '6px 10px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '4px', color: 'var(--heading)', fontSize: '0.82rem', fontWeight: 500,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
            >
              JSON exportieren (Clipboard)
            </button>
            <button
              onClick={handleImportJson}
              style={{
                width: '100%', padding: '6px 10px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '4px', color: 'var(--heading)', fontSize: '0.82rem', fontWeight: 500,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface)'}
            >
              JSON importieren (Clipboard)
            </button>
          </div>
        )}

        {activeTab === 'test' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '160px', overflowY: 'auto' }}>
            {testPositions.length === 0 && (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>Lädt...</p>
            )}
            {testPositions.map((pos) => (
              <button
                key={pos.name}
                onClick={() => handleLoadTestPosition(pos.fen)}
                title={pos.description}
                style={{
                  width: '100%', padding: '4px 8px', textAlign: 'left',
                  fontSize: '0.82rem', color: 'var(--text)', background: 'transparent',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {pos.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
