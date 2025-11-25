import { For, Show } from 'solid-js';
import { gameStore, gameActions } from '../store/gameStore';
import { Dices, SkipForward, FileText } from 'lucide-solid';
import { COLOR_MAP } from '../constants';
import clsx from 'clsx';

interface ControlsProps {
    onToggleLog: () => void;
}

const Controls = (props: ControlsProps) => {
  const currentPlayer = () => gameStore.players[gameStore.currentPlayerIndex];
  const styles = () => COLOR_MAP[currentPlayer().color];

  const handlePieceAction = (pieceIndex: number) => {
      const piece = currentPlayer().pieces[pieceIndex];
      const isValid = piece.state !== 'finished' && (piece.state !== 'base' || gameStore.diceValue === 6);
      if (piece && isValid) {
          gameActions.movePiece(piece.id);
      }
  }

  const canRoll = () => gameStore.turnState === 'rolling';

  return (
    <div class="w-full md:w-80 bg-slate-900/90 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/10 p-4 md:p-6 flex flex-col shadow-2xl z-20 shrink-0 transition-all">
      
      {/* Header / Turn Info */}
      <div class="flex flex-row md:flex-col gap-4 mb-4 md:mb-8 items-stretch justify-between md:justify-start">
        <div class="md:hidden flex items-center justify-between w-full px-2">
            <span class="text-xs font-bold text-gray-400 tracking-widest">CURRENT TURN</span>
            <span class={clsx("text-xl font-black uppercase", styles().text)}>{currentPlayer().name}</span>
        </div>

        <div class={clsx(
            "hidden md:flex flex-1 p-6 rounded-xl border transition-all duration-500 flex-col justify-center",
            styles().bg10, styles().border, styles().glow
        )}>
            <span class="text-xs uppercase tracking-widest text-gray-400 block mb-1">Current Turn</span>
            <div class={clsx("text-4xl font-black truncate", styles().text)}>
            {currentPlayer().name}
            </div>
            <div class="flex mt-4 items-center gap-2 text-sm text-gray-300">
                <div class={clsx("w-2 h-2 rounded-full animate-pulse", styles().bg)} />
                {gameStore.turnState === 'rolling' ? 'Waiting to Roll...' : 'Select a piece'}
            </div>
        </div>
      </div>

      {/* Main Action Area */}
      <div class="flex flex-row md:flex-col items-center gap-4 md:gap-8 flex-1">
        
        {/* Dice Container */}
        <div class="relative flex items-center justify-center flex-1 md:w-full md:flex-none">
           <Show when={gameStore.diceValue}>
             <div class={clsx(
               "text-6xl md:text-8xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-bounce",
               styles().text
             )}>
               {gameStore.diceValue}
             </div>
           </Show>
           <Show when={!gameStore.diceValue}>
             <Dices class="w-12 h-12 md:w-24 md:h-24 text-slate-700" />
           </Show>
        </div>

        {/* Controls Center Block */}
        <div class="flex flex-col gap-2 flex-[2] md:flex-none md:w-full">
            <button
                onClick={gameActions.rollDice}
                disabled={!canRoll()}
                class={clsx(
                    "w-full py-3 md:py-4 rounded-xl text-lg md:text-xl font-bold uppercase tracking-wider shadow-lg transition-all active:scale-95",
                    canRoll() 
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:brightness-110 hover:shadow-purple-500/50 cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                )}
            >
            {canRoll() ? 'ROLL' : 'MOVING'}
            </button>
            
            {/* Piece Selectors */}
            <div class="grid grid-cols-4 gap-2">
                <For each={[0, 1, 2, 3]}>
                    {(idx) => {
                        const piece = () => currentPlayer().pieces[idx];
                        const isValidPiece = () => piece().state !== 'finished' && (piece().state !== 'base' || gameStore.diceValue === 6);
                        const canMove = () => gameStore.turnState === 'moving' && gameStore.diceValue !== null && isValidPiece();
                        
                        return (
                            <button 
                                onPointerEnter={() => canMove() && gameActions.setHighlightedPiece(piece()?.id)}
                                onPointerDown={() => canMove() && gameActions.setHighlightedPiece(piece()?.id)}
                                onPointerUp={() => {
                                    if (canMove()) {
                                        gameActions.setHighlightedPiece(null);
                                        handlePieceAction(idx);
                                    }
                                }}
                                onPointerLeave={() => gameActions.setHighlightedPiece(null)}
                                disabled={!canMove()}
                                class={clsx(
                                    "aspect-square rounded-lg font-bold text-sm border transition-all touch-none relative group select-none", 
                                    canMove() 
                                        ? clsx(styles().bg, "text-white border-white/20 hover:brightness-110 active:scale-95 cursor-pointer") 
                                        : "bg-slate-800/50 text-gray-600 border-transparent cursor-not-allowed opacity-50"
                                )}
                            >
                                <span class="pointer-events-none select-none">{idx + 1}</span>
                            </button>
                        )
                    }}
                </For>
            </div>
            
            <Show when={gameStore.turnState === 'moving' && !gameStore.diceValue}>
                 <button 
                    onClick={gameActions.skipTurn} 
                    class="hidden md:flex bg-slate-800/50 hover:bg-slate-800 text-gray-400 hover:text-white rounded-lg py-2 items-center justify-center gap-2 text-xs cursor-pointer"
                >
                    <SkipForward size={14} /> Skip
                </button>
            </Show>
        </div>

        {/* Mobile: Log Button */}
        <div class="md:hidden flex flex-col items-center justify-center flex-1 gap-2">
             <button 
                onClick={props.onToggleLog}
                class="flex flex-col items-center justify-center text-gray-400 hover:text-white p-2 cursor-pointer"
            >
                <FileText size={24} />
                <span class="text-[10px] mt-1">LOG</span>
            </button>
             <Show when={gameStore.turnState === 'moving' && !gameStore.diceValue}>
                <button onClick={gameActions.skipTurn} class="text-gray-500 hover:text-white p-2 cursor-pointer">
                     <SkipForward size={24} />
                </button>
            </Show>
        </div>
      </div>
      
      <div class="hidden md:flex xl:hidden mt-4 gap-2">
         <button 
            onClick={props.onToggleLog}
            class="w-full bg-slate-800/50 hover:bg-slate-800 text-gray-400 hover:text-white rounded-lg py-3 flex items-center justify-center gap-2 cursor-pointer"
         >
            <FileText size={16} /> FLIGHT LOG
         </button>
      </div>

      <div class="hidden md:grid grid-cols-2 gap-2 text-xs text-gray-500 border-t border-white/10 pt-4 mt-4 select-none">
         <div>Roll 6 to Launch</div>
         <div>Land on color to Jump</div>
      </div>
    </div>
  );
};

export default Controls;