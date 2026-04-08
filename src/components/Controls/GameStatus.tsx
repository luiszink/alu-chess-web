interface GameStatusProps {
  statusText: string;
  isInReplay: boolean;
  isAtLatest: boolean;
}

export default function GameStatus({ statusText, isInReplay, isAtLatest }: GameStatusProps) {
  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3">
      <p className="text-white font-medium text-center">{statusText}</p>
      {isInReplay && (
        <p className="text-amber-400 text-xs text-center mt-1">Replay-Modus</p>
      )}
      {!isAtLatest && !isInReplay && (
        <p className="text-blue-400 text-xs text-center mt-1">Verlauf wird angezeigt</p>
      )}
    </div>
  );
}
