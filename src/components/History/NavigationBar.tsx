interface NavigationBarProps {
  browseIndex: number;
  totalStates: number;
  isAtLatest: boolean;
  onBack: () => void;
  onForward: () => void;
  onToStart: () => void;
  onToEnd: () => void;
}

export default function NavigationBar({
  browseIndex,
  totalStates,
  isAtLatest,
  onBack,
  onForward,
  onToStart,
  onToEnd,
}: NavigationBarProps) {
  const atStart = browseIndex === 0;

  return (
    <div className="flex items-center justify-center gap-1 bg-gray-800 rounded-lg p-2">
      <NavButton onClick={onToStart} disabled={atStart} title="Zum Anfang">
        ⏮
      </NavButton>
      <NavButton onClick={onBack} disabled={atStart} title="Einen Zug zurück">
        ◀
      </NavButton>
      <span className="text-gray-400 text-sm px-2 min-w-[60px] text-center">
        {browseIndex} / {totalStates - 1}
      </span>
      <NavButton onClick={onForward} disabled={isAtLatest} title="Einen Zug vor">
        ▶
      </NavButton>
      <NavButton onClick={onToEnd} disabled={isAtLatest} title="Zum aktuellen Zustand">
        ⏭
      </NavButton>
    </div>
  );
}

function NavButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-3 py-1.5 rounded transition-colors text-lg
        ${disabled
          ? 'text-gray-600 cursor-not-allowed'
          : 'text-white hover:bg-gray-600 active:bg-gray-500'
        }
      `}
    >
      {children}
    </button>
  );
}
