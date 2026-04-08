import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import ChessBoard from '../components/Board/ChessBoard';
import ChessClock from '../components/Clock/ChessClock';
import MoveList from '../components/History/MoveList';
import NavigationBar from '../components/History/NavigationBar';
import GameStatus from '../components/Controls/GameStatus';
import NewGameDialog from '../components/Controls/NewGameDialog';
import FenPgnTools from '../components/Controls/FenPgnTools';
import SidePanel from '../components/Layout/SidePanel';
import { controllerApi } from '../api/controllerApi';

export default function PlayPage() {
  const state = useGameStore((s) => s.state);
  const moveHistory = useGameStore((s) => s.moveHistory);
  const makeMove = useGameStore((s) => s.makeMove);
  const newGame = useGameStore((s) => s.newGame);
  const resign = useGameStore((s) => s.resign);
  const browseBack = useGameStore((s) => s.browseBack);
  const browseForward = useGameStore((s) => s.browseForward);
  const browseToStart = useGameStore((s) => s.browseToStart);
  const browseToEnd = useGameStore((s) => s.browseToEnd);
  const browseToMove = useGameStore((s) => s.browseToMove);
  const fetchState = useGameStore((s) => s.fetchState);
  const fetchMoveHistory = useGameStore((s) => s.fetchMoveHistory);
  const connectSSE = useGameStore((s) => s.connectSSE);

  useEffect(() => {
    fetchState();
    fetchMoveHistory();
    const disconnect = connectSSE();
    return disconnect;
  }, [fetchState, fetchMoveHistory, connectSSE]);

  const handleExitReplay = async () => {
    try {
      const s = await controllerApi.exitReplay();
      useGameStore.getState().setState(s);
    } catch {
      // ignore
    }
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">Verbinde mit Server...</p>
          <p className="text-gray-500 text-sm">Stelle sicher, dass der Controller-Service auf Port 8081 läuft.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 p-6 justify-center items-start">
      <div className="flex flex-col gap-3">
        <ChessBoard
          fen={state.game.fen}
          currentPlayer={state.game.currentPlayer}
          isTerminal={state.game.isTerminal}
          isAtLatest={state.isAtLatest}
          onMove={makeMove}
        />
        <NavigationBar
          browseIndex={state.browseIndex}
          totalStates={state.totalStates}
          isAtLatest={state.isAtLatest}
          onBack={browseBack}
          onForward={browseForward}
          onToStart={browseToStart}
          onToEnd={browseToEnd}
        />
      </div>

      <SidePanel>
        <GameStatus
          statusText={state.statusText}
          isInReplay={state.isInReplay}
          isAtLatest={state.isAtLatest}
        />

        {state.clock && (
          <ChessClock
            clock={state.clock}
            currentPlayer={state.game.currentPlayer}
            isTerminal={state.game.isTerminal}
          />
        )}

        <MoveList
          moves={moveHistory}
          browseIndex={state.browseIndex}
          onBrowseToMove={browseToMove}
        />

        <NewGameDialog
          onNewGame={newGame}
          onResign={resign}
          isTerminal={state.game.isTerminal}
          isInReplay={state.isInReplay}
          onExitReplay={handleExitReplay}
        />

        <FenPgnTools />
      </SidePanel>
    </div>
  );
}
