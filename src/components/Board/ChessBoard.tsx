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
  onMove: (from: string, to: string, promotion?: string) => void;
}

export default function ChessBoard({ fen, currentPlayer, isTerminal, isAtLatest, onMove }: ChessBoardProps) {
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

  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: 'rgba(255, 255, 0, 0.4)',
    };
  }

  for (const move of legalMoves) {
    customSquareStyles[move.to] = {
      background: move.isCapture
        ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
        : 'radial-gradient(circle, rgba(0,0,0,.2) 25%, transparent 25%)',
      borderRadius: '50%',
    };
  }

  return (
    <div className="relative" style={{ width: '560px' }}>
      <Chessboard
        options={{
          id: 'main-board',
          position: fen,
          onSquareClick: ({ square }) => onSquareClick(square),
          onPieceDrop: ({ sourceSquare, targetSquare }) => onPieceDrop(sourceSquare, targetSquare),
          squareStyles: customSquareStyles,
          boardStyle: {
            borderRadius: '4px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          },
          darkSquareStyle: { backgroundColor: '#779952' },
          lightSquareStyle: { backgroundColor: '#edeed1' },
          animationDurationInMs: 200,
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
