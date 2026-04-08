import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'chess.js';
import { modelApi } from '../../api/modelApi';
import type { LegalMoveTarget } from '../../types/chess';
import PromotionDialog from './PromotionDialog';

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

  const isPromotionMove = (from: string, to: string): boolean => {
    const fromRank = from[1];
    const toRank = to[1];
    // Check if a pawn is moving to the last rank
    return (
      (fromRank === '7' && toRank === '8') ||
      (fromRank === '2' && toRank === '1')
    );
  };

  const tryMove = useCallback((from: string, to: string) => {
    // Check if this is in legal moves for the selected square
    const target = legalMoves.find(m => m.to === to);
    if (!target && selectedSquare === from) return;

    if (isPromotionMove(from, to)) {
      setPendingPromotion({ from, to });
    } else {
      onMove(from, to);
      clearSelection();
    }
  }, [legalMoves, selectedSquare, onMove, clearSelection]);

  const onSquareClick = useCallback(async (square: string) => {
    if (!canInteract) return;

    if (selectedSquare) {
      // If clicking the same square, deselect
      if (selectedSquare === square) {
        clearSelection();
        return;
      }
      // Try to move
      const target = legalMoves.find(m => m.to === square);
      if (target) {
        tryMove(selectedSquare, square);
      } else {
        // Select a new piece
        try {
          const result = await modelApi.legalMovesForSquare(fen, square);
          if (result.moves.length > 0) {
            setSelectedSquare(square);
            setLegalMoves(result.moves);
          } else {
            clearSelection();
          }
        } catch {
          clearSelection();
        }
      }
    } else {
      // Select piece
      try {
        const result = await modelApi.legalMovesForSquare(fen, square);
        if (result.moves.length > 0) {
          setSelectedSquare(square);
          setLegalMoves(result.moves);
        }
      } catch {
        // ignore
      }
    }
  }, [canInteract, selectedSquare, legalMoves, fen, tryMove, clearSelection]);

  const onPieceDrop = useCallback((sourceSquare: string, targetSquare: string): boolean => {
    if (!canInteract) return false;
    if (isPromotionMove(sourceSquare, targetSquare)) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare });
      return false; // Don't drop yet, wait for promotion choice
    }
    onMove(sourceSquare, targetSquare);
    clearSelection();
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
    <div className="relative">
      <Chessboard
        id="main-board"
        position={fen}
        onSquareClick={onSquareClick as (square: Square) => void}
        onPieceDrop={onPieceDrop as (source: Square, target: Square) => boolean}
        customSquareStyles={customSquareStyles}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#779952' }}
        customLightSquareStyle={{ backgroundColor: '#edeed1' }}
        boardWidth={560}
        animationDuration={200}
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
