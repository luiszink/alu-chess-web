interface NewGameDialogProps {
  onNewGame: () => void;
  onResign: () => void;
  isTerminal: boolean;
  isInReplay: boolean;
  onExitReplay: () => void;
}

export default function NewGameDialog({ onNewGame, onResign, isTerminal, isInReplay, onExitReplay }: NewGameDialogProps) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onNewGame}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors font-medium"
      >
        Neues Spiel
      </button>
      {!isTerminal && !isInReplay && (
        <button
          onClick={onResign}
          className="w-full px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors text-sm"
        >
          Aufgeben
        </button>
      )}
      {isInReplay && (
        <button
          onClick={onExitReplay}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors text-sm"
        >
          Replay verlassen
        </button>
      )}
    </div>
  );
}
