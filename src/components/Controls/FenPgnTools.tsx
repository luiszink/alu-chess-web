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
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'test' && testPositions.length === 0) {
                handleLoadTestPositions();
              }
            }}
            className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors
              ${activeTab === tab.key
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-200'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {activeTab === 'fen' && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
              placeholder="FEN-String eingeben..."
              className="w-full px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleLoadFen}
              disabled={!fenInput.trim()}
              className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded text-sm transition-colors"
            >
              FEN laden
            </button>
          </div>
        )}

        {activeTab === 'pgn' && (
          <div className="flex flex-col gap-2">
            <textarea
              value={pgnInput}
              onChange={(e) => setPgnInput(e.target.value)}
              placeholder="PGN eingeben..."
              rows={3}
              className="w-full px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
            />
            <button
              onClick={handleLoadPgn}
              disabled={!pgnInput.trim()}
              className="w-full px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded text-sm transition-colors"
            >
              PGN laden
            </button>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleExportJson}
              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
            >
              JSON exportieren (Clipboard)
            </button>
            <button
              onClick={handleImportJson}
              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
            >
              JSON importieren (Clipboard)
            </button>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {testPositions.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">Lädt...</p>
            )}
            {testPositions.map((pos) => (
              <button
                key={pos.name}
                onClick={() => handleLoadTestPosition(pos.fen)}
                title={pos.description}
                className="w-full px-2 py-1 text-left text-sm text-gray-200 hover:bg-gray-700 rounded transition-colors"
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
