import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Dices, SkipForward, FileText } from 'lucide-react';
import { COLOR_MAP } from '../constants';
import clsx from 'clsx';

interface ControlsProps {
    onToggleLog: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onToggleLog }) => {
  const { currentPlayerIndex, players, diceValue, turnState, rollDice, skipTurn, movePiece, setHighlightedPiece } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  const styles = COLOR_MAP[currentPlayer.color];

  const handlePieceAction = (pieceIndex: number) => {
      const piece = currentPlayer.pieces[pieceIndex];
      // Final validity check before action
      const isValid = piece.state !== 'finished' && (piece.state !== 'base' || diceValue === 6);
      if (piece && isValid) {
          movePiece(piece.id);
      }
  }

  const canRoll = turnState === 'rolling';

  return (
    <div className="w-full md:w-80 bg-slate-900/90 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/10 p-4 md:p-6 flex flex-col shadow-2xl z-20 shrink-0 transition-all">
      
      {/* Header / Turn Info */}
      <div className="flex flex-row md:flex-col gap-4 mb-4 md:mb-8 items-stretch justify-between md:justify-start">
        <div className="md:hidden flex items-center justify-between w-full px-2">
            <span className="text-xs font-bold text-gray-400 tracking-widest">CURRENT TURN</span>
            <span className={clsx("text-xl font-black uppercase", styles.text)}>{currentPlayer.name}</span>
        </div>

        <div className={clsx(
            "hidden md:flex flex-1 p-6 rounded-xl border transition-all duration-500 flex-col justify-center",
            styles.bg, "bg-opacity-10", styles.border, styles.glow
        )}>
            <span className="text-xs uppercase tracking-widest text-gray-400 block mb-1">Current Turn</span>
            <div className={clsx("text-4xl font-black truncate", styles.text)}>
            {currentPlayer.name}
            </div>
            <div className="flex mt-4 items-center gap-2 text-sm text-gray-300">
                <div className={clsx("w-2 h-2 rounded-full animate-pulse", styles.bg)} />
                {turnState === 'rolling' ? 'Waiting to Roll...' : 'Select a piece'}
            </div>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="flex flex-row md:flex-col items-center gap-4 md:gap-8 flex-1">
        
        {/* Dice Container */}
        <div className="relative flex items-center justify-center shrink-0 w-16 md:w-full">
           {diceValue && (
             <div className={clsx(
               "text-6xl md:text-8xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-bounce",
               styles.text
             )}>
               {diceValue}
             </div>
           )}
           {!diceValue && (
             <Dices className="w-12 h-12 md:w-24 md:h-24 text-slate-700" />
           )}
        </div>

        {/* Controls Center Block */}
        <div className="flex flex-col gap-2 w-full">
            <button
                onClick={rollDice}
                disabled={!canRoll}
                className={clsx(
                    "w-full py-3 md:py-4 rounded-xl text-lg md:text-xl font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95",
                    canRoll 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:brightness-110 hover:shadow-purple-500/50"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                )}
            >
            {canRoll ? 'ROLL' : 'MOVING'}
            </button>
            
            {/* Piece Selectors */}
            <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((idx) => {
                    const piece = currentPlayer.pieces[idx];
                    // Strict validity check for UI state
                    const isValidPiece = piece.state !== 'finished' && (piece.state !== 'base' || diceValue === 6);
                    const canMove = turnState === 'moving' && diceValue !== null && isValidPiece;
                    
                    return (
                        <button 
                            key={idx}
                            onPointerEnter={() => canMove && setHighlightedPiece(piece?.id)}
                            onPointerDown={() => canMove && setHighlightedPiece(piece?.id)}
                            onPointerUp={() => {
                                if (canMove) {
                                    setHighlightedPiece(null);
                                    handlePieceAction(idx);
                                }
                            }}
                            onPointerLeave={() => setHighlightedPiece(null)}
                            disabled={!canMove}
                            className={clsx(
                                "aspect-square rounded-lg font-bold text-sm border transition-all touch-none relative group", 
                                canMove 
                                    ? clsx(styles.bg, "text-white border-white/20 hover:brightness-110 active:scale-95") 
                                    : "bg-slate-800/50 text-gray-600 border-transparent cursor-not-allowed opacity-50"
                            )}
                        >
                            {idx + 1}
                        </button>
                    )
                })}
            </div>
            
            {turnState === 'moving' && !diceValue && (
                 <button 
                    onClick={skipTurn} 
                    className="hidden md:flex bg-slate-800/50 hover:bg-slate-800 text-gray-400 hover:text-white rounded-lg py-2 items-center justify-center gap-2 text-xs"
                >
                    <SkipForward size={14} /> Skip
                </button>
            )}
        </div>

        {/* Mobile: Log Button */}
        <div className="md:hidden flex flex-col gap-2 shrink-0">
             <button 
                onClick={onToggleLog}
                className="flex flex-col items-center justify-center text-gray-400 hover:text-white p-2"
            >
                <FileText size={24} />
                <span className="text-[10px] mt-1">LOG</span>
            </button>
             {turnState === 'moving' && !diceValue && (
                <button onClick={skipTurn} className="text-gray-500 hover:text-white p-2">
                     <SkipForward size={24} />
                </button>
            )}
        </div>
      </div>
      
      <div className="hidden md:flex lg:hidden mt-4">
         <button 
            onClick={onToggleLog}
            className="w-full bg-slate-800/50 hover:bg-slate-800 text-gray-400 hover:text-white rounded-lg py-3 flex items-center justify-center gap-2"
         >
            <FileText size={16} /> TOGGLE FLIGHT LOG
         </button>
      </div>

      <div className="hidden md:grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-white/10 pt-4 mt-auto">
         <div>Roll 6 to Launch</div>
         <div>Land on color to Jump</div>
      </div>
    </div>
  );
};

export default Controls;