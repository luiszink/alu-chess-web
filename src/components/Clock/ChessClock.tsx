import { useEffect, useState } from 'react';
import type { ClockState, Color } from '../../types/chess';

interface ChessClockProps {
  clock: ClockState;
  currentPlayer: Color;
  isTerminal: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ChessClock({ clock, currentPlayer, isTerminal }: ChessClockProps) {
  const [whiteMs, setWhiteMs] = useState(clock.whiteTimeMs);
  const [blackMs, setBlackMs] = useState(clock.blackTimeMs);

  // Sync with server state
  useEffect(() => {
    setWhiteMs(clock.whiteTimeMs);
    setBlackMs(clock.blackTimeMs);
  }, [clock.whiteTimeMs, clock.blackTimeMs]);

  // Client-side interpolation for smooth countdown
  useEffect(() => {
    if (isTerminal) return;
    const interval = setInterval(() => {
      if (currentPlayer === 'White') {
        setWhiteMs((prev) => Math.max(0, prev - 100));
      } else {
        setBlackMs((prev) => Math.max(0, prev - 100));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [currentPlayer, isTerminal]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <ClockDisplay
        label="Schwarz"
        time={formatTime(blackMs)}
        active={currentPlayer === 'Black' && !isTerminal}
      />
      <ClockDisplay
        label="Weiß"
        time={formatTime(whiteMs)}
        active={currentPlayer === 'White' && !isTerminal}
      />
    </div>
  );
}

function ClockDisplay({ label, time, active }: { label: string; time: string; active: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-2 rounded font-mono text-lg
        ${active ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'}
      `}
    >
      <span className="text-sm font-sans">{label}</span>
      <span className="font-bold">{time}</span>
    </div>
  );
}
