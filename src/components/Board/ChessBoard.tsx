import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { LegalMoveTarget } from '../../types/chess';
import PromotionDialog from './PromotionDialog';
function getLocalLegalMoves(fen: string, square: string): LegalMoveTarget[] {
  try {
    const chess = new Chess(fen);
    const moves = chess.moves({ square: square as Square, verbose: true });
    return moves.map(m => ({
      to: m.to,
      isCapture: m.captured !== undefined,
      promotion: m.promotion ?? null,
    }));
  } catch {
    return [];
  }
}

interface ChessBoardProps {
  fen: string;
  currentPlayer: 'White' | 'Black';
  isTerminal: boolean;
  isAtLatest: boolean;
  boardSize: number;
  lastMove?: { from: string; to: string };
  onMove: (from: string, to: string, promotion?: string) => void;
}

export default function ChessBoard({ fen, currentPlayer, isTerminal, isAtLatest, boardSize, lastMove, onMove }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<LegalMoveTarget[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);

  const canInteract = !isTerminal && isAtLatest;

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const isPromotionMove = useCallback((from: string, to: string): boolean => {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ square: from as Square, verbose: true });
      return moves.some(m => m.to === to && m.promotion !== undefined);
    } catch {
      return false;
    }
  }, [fen]);

  const tryMove = useCallback((from: string, to: string) => {
    if (isPromotionMove(from, to)) {
      setPendingPromotion({ from, to });
    } else {
      onMove(from, to);
      clearSelection();
    }
  }, [isPromotionMove, onMove, clearSelection]);

  const onSquareClick = useCallback((square: string) => {
    if (!canInteract) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        clearSelection();
        return;
      }
      const target = legalMoves.find(m => m.to === square);
      if (target) {
        tryMove(selectedSquare, square);
      } else {
        // Try selecting a different piece
        const moves = getLocalLegalMoves(fen, square);
        if (moves.length > 0) {
          setSelectedSquare(square);
          setLegalMoves(moves);
        } else {
          clearSelection();
        }
      }
    } else {
      const moves = getLocalLegalMoves(fen, square);
      if (moves.length > 0) {
        setSelectedSquare(square);
        setLegalMoves(moves);
      }
    }
  }, [canInteract, selectedSquare, legalMoves, fen, tryMove, clearSelection]);

  const onPieceDrag = useCallback((square: string) => {
    if (!canInteract) return;
    const moves = getLocalLegalMoves(fen, square);
    if (moves.length > 0) {
      setSelectedSquare(square);
      setLegalMoves(moves);
    }
  }, [canInteract, fen]);

  const onPieceDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    if (!canInteract) return false;
    clearSelection();
    if (isPromotionMove(sourceSquare, targetSquare)) {
      // Show promotion dialog; board position is corrected by controlled FEN after choice
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      return true;
    }
    onMove(sourceSquare, targetSquare);
    return true;
  }, [canInteract, onMove, clearSelection]);

  const onPromotionSelect = useCallback((piece: string) => {
    if (pendingPromotion) {
      onMove(pendingPromotion.from, pendingPromotion.to, piece);
      setPendingPromotion(null);
      clearSelection();
    }
  }, [pendingPromotion, onMove, clearSelection]);

  // Build highlight styles
  const customSquareStyles: Record<string, React.CSSProperties> = {};

  // Last move highlight
  if (lastMove) {
    const lastMoveStyle = { backgroundColor: 'rgba(205, 210, 106, 0.48)' };
    customSquareStyles[lastMove.from] = lastMoveStyle;
    customSquareStyles[lastMove.to] = lastMoveStyle;
  }

  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(20, 85, 30, 0.55)',
    };
  }

  for (const move of legalMoves) {
    customSquareStyles[move.to] = {
      ...(customSquareStyles[move.to] ?? {}),
      background: move.isCapture
        ? 'radial-gradient(circle, rgba(0,0,0,.15) 82%, transparent 82%)'
        : 'radial-gradient(circle, rgba(0,0,0,.18) 26%, transparent 26%)',
    };
  }

  return (
    <div className="relative" style={{ width: boardSize, height: boardSize }}>
      <Chessboard
        options={{
          id: 'main-board',
          position: fen,
          onSquareClick: ({ square }) => onSquareClick(square),
          onPieceDrag: ({ square }) => onPieceDrag(square),
          onPieceDrop: ({ sourceSquare, targetSquare }) => onPieceDrop(sourceSquare, targetSquare),
          squareStyles: customSquareStyles,
          boardStyle: { width: '100%', borderRadius: '2px' },
          darkSquareStyle: { backgroundColor: '#b58863' },
          lightSquareStyle: { backgroundColor: '#f0d9b5' },
          animationDurationInMs: 150,
        }}
      />
      {pendingPromotion && (
        <PromotionDialog
          color={currentPlayer}
          onSelect={onPromotionSelect}
          onCancel={() => setPendingPromotion(null)}
        />
      )}
    </div>
  );
}
