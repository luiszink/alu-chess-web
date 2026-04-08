import { useState } from 'react';
import { controllerApi } from '../../api/controllerApi';
import { modelApi } from '../../api/modelApi';
import { useGameStore } from '../../store/gameStore';
import toast from 'react-hot-toast';
import type { TestPosition } from '../../types/chess';

export default function FenPgnTools() {
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [activeTab, setActiveTab] = useState<'fen' | 'pgn' | 'export' | 'test'>('fen');
  const [testPositions, setTestPositions] = useState<TestPosition[]>([]);
  const loadFen = useGameStore((s) => s.loadFen);

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
