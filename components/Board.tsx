import { onMount, createSignal, For, Show, createMemo } from 'solid-js';
import { START_INDICES, GATEWAY_INDICES, SHORTCUTS, COLOR_MAP } from '../constants';
import { TRACK_COORDS, getHomeCoordinates, getLaunchCoordinate, getHangarZone } from '../utils/boardUtils';
import { gameStore, gameActions } from '../store/gameStore';
import Piece from './Piece';
import { PlayerColor } from '../types';
import clsx from 'clsx';
import { Rocket, Plane, Zap, Trophy } from 'lucide-solid';

interface GridCellProps { 
  x: number; 
  y: number; 
  cellSize: number;
}

const GridCell = (props: GridCellProps) => {
  const logicalX = () => props.x;
  const logicalY = () => 14 - props.y;

  const cellInfo = createMemo(() => {
    let cellColorClass = "bg-transparent border-transparent"; 
    let isTrack = false;
    let trackIndex = -1;
    let homeColor: PlayerColor | null = null;
    let isCenter = (logicalX() === 7 && logicalY() === 7);
    let isLaunch = false;
    let launchColor: PlayerColor | null = null;

    [PlayerColor.YELLOW, PlayerColor.RED, PlayerColor.GREEN, PlayerColor.BLUE].forEach(c => {
        const launch = getLaunchCoordinate(c);
        if (launch.x === logicalX() && launch.y === logicalY()) {
            isLaunch = true;
            launchColor = c;
        }
    });

    const trackIdx = TRACK_COORDS.findIndex(c => c.x === logicalX() && c.y === logicalY());
    if (trackIdx !== -1) {
      isTrack = true;
      trackIndex = trackIdx;
      const c = TRACK_COORDS[trackIdx].color!;
      cellColorClass = `${COLOR_MAP[c].bg20} border-${c}-500/40 border`;
    }

    [PlayerColor.YELLOW, PlayerColor.GREEN, PlayerColor.RED, PlayerColor.BLUE].forEach(c => {
      const homePath = getHomeCoordinates(c);
      for (let i=0; i<6; i++) {
          if (homePath[i].x === logicalX() && homePath[i].y === logicalY()) {
              homeColor = c;
              cellColorClass = `${COLOR_MAP[c].bg60} border-${c}-500 border shadow-[0_0_10px_rgba(0,0,0,0.3)]`;
          }
      }
    });

    const isHome = homeColor !== null;

    let launchRotation = 0;
    if (isLaunch && launchColor) {
       if (launchColor === PlayerColor.YELLOW) launchRotation = 135; 
       if (launchColor === PlayerColor.BLUE) launchRotation = 45; 
       if (launchColor === PlayerColor.RED) launchRotation = -135; 
       if (launchColor === PlayerColor.GREEN) launchRotation = -45; 
    }

    return { cellColorClass, isTrack, trackIndex, homeColor, isCenter, isLaunch, launchColor, launchRotation, isHome };
  });

  const piecesHere = () => gameStore.players.flatMap(p => 
    p.pieces.filter(piece => {
      if (piece.state === 'active' && cellInfo().trackIndex !== -1 && piece.position === cellInfo().trackIndex) return true;
      if (piece.state === 'home' && cellInfo().homeColor === p.color) {
         const relativePos = piece.position - 100;
         const homeCoords = getHomeCoordinates(p.color);
         if (homeCoords[relativePos] && homeCoords[relativePos].x === logicalX() && homeCoords[relativePos].y === logicalY()) return true;
      }
      if (piece.state === 'launched' && cellInfo().isLaunch && cellInfo().launchColor === p.color) return true;
      if (piece.state === 'finished' && cellInfo().isCenter) return true;
      return false;
    }).map(piece => ({ ...piece, playerColor: p.color, playerId: p.id }))
  );

  const currentPlayer = () => gameStore.players[gameStore.currentPlayerIndex];

  if (!cellInfo().isTrack && !cellInfo().isHome && !cellInfo().isCenter && !cellInfo().isLaunch) {
     return <div style={{ width: `${props.cellSize}px`, height: `${props.cellSize}px` }} />;
  }

  return (
    <div 
      class={clsx(
        "relative flex items-center justify-center transition-all duration-300",
        cellInfo().cellColorClass,
        cellInfo().isCenter && "bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 animate-pulse z-10 border-4 border-white/20",
        cellInfo().isLaunch && `border-none`
      )}
      style={{ width: `${props.cellSize}px`, height: `${props.cellSize}px` }}
    >
      <Show when={cellInfo().isLaunch}>
         <Plane 
            class={clsx("absolute opacity-30 w-[80%] h-[80%]", COLOR_MAP[cellInfo().launchColor!].text)} 
            style={{ transform: `rotate(${cellInfo().launchRotation}deg)` }}
         />
      </Show>
      <Show when={cellInfo().isCenter}>
        <Rocket class="text-white w-[80%] h-[80%] animate-spin-slow" />
      </Show>
      
      <Show when={cellInfo().isTrack && Object.values(SHORTCUTS).some(s => s.start === cellInfo().trackIndex)}>
          <Zap class="text-white/60 w-[40%] h-[40%] absolute bottom-0 right-0" />
      </Show>

      <Show when={piecesHere().length > 0}>
        <div class="absolute inset-0 flex items-center justify-center">
          <For each={piecesHere()}>
            {(p, idx) => {
               const isMyPiece = () => p.playerId === gameStore.currentPlayerIndex;
               const isValidState = () => p.state !== 'finished' && (p.state !== 'base' || gameStore.diceValue === 6);
               const canMove = () => gameStore.turnState === 'moving' && gameStore.diceValue !== null && isMyPiece() && isValidState();
               
               return (
                   <div 
                      class={clsx("absolute w-full h-full flex items-center justify-center transition-all duration-500", idx() > 0 && "-translate-y-1 translate-x-1", canMove() && "cursor-pointer")} 
                      style={{ "z-index": 20 + idx() }}
                      onClick={(e) => {
                          e?.stopPropagation();
                          if(canMove()) gameActions.movePiece(p.id);
                      }}
                   >
                      <Piece 
                          color={p.playerColor} 
                          isClickable={canMove()}
                          isHighlighted={p.id === gameStore.highlightedPieceId && p.playerColor === currentPlayer().color}
                          moveableLabel={canMove() ? (p.id + 1).toString() : null}
                          count={piecesHere().filter(ph => ph.playerColor === p.playerColor).length > 1 && idx() === 0 ? piecesHere().filter(ph => ph.playerColor === p.playerColor).length : 1}
                      />
                   </div>
               );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};

interface HangarProps {
  color: PlayerColor;
  cellSize: number;
}

const Hangar = (props: HangarProps) => {
  const zone = () => getHangarZone(props.color);
  const style = () => COLOR_MAP[props.color];
  
  // CRITICAL FIX: Use createMemo for reactive dimensions based on cellSize signal
  const dimensions = createMemo(() => {
    const z = zone();
    const top = (14 - z.yMax) * props.cellSize;
    const left = z.xMin * props.cellSize;
    const width = (z.xMax - z.xMin + 1) * props.cellSize;
    const height = (z.yMax - z.yMin + 1) * props.cellSize;
    return { top, left, width, height };
  });

  const myPieces = () => gameStore.players.find(p => p.color === props.color)?.pieces || [];
  const basePieces = () => myPieces().filter(p => p.state === 'base');
  
  const currentPlayer = () => gameStore.players[gameStore.currentPlayerIndex];

  return (
    <div 
       class={clsx(
         "absolute rounded-2xl border-2 sm:border-4 backdrop-blur-sm z-30 box-border", 
         style().border, style().bg10
       )}
       style={{ 
         top: `${dimensions().top}px`, 
         left: `${dimensions().left}px`, 
         width: `${dimensions().width}px`, 
         height: `${dimensions().height}px` 
       }}
    >
      <div class="w-full h-full grid grid-cols-2 grid-rows-2">
         <For each={[0, 1, 2, 3]}>
             {(slotId) => {
                 const piece = () => basePieces().find(p => p.id === slotId);
                 const isMyPiece = () => currentPlayer()?.color === props.color;
                 const canLaunch = () => isMyPiece() && gameStore.diceValue === 6 && gameStore.turnState === 'moving';

                 return (
                    <div 
                       class={clsx("flex items-center justify-center relative", canLaunch() && "cursor-pointer")}
                       onClick={(e) => {
                           e?.stopPropagation();
                           if(canLaunch() && piece()) gameActions.movePiece(piece()!.id);
                       }}
                    >
                       <Show when={piece()}>
                         <div class="w-full h-full flex items-center justify-center">
                           <Piece 
                             color={props.color} 
                             isClickable={canLaunch()} 
                             isHighlighted={piece()!.id === gameStore.highlightedPieceId && props.color === currentPlayer().color}
                             moveableLabel={canLaunch() ? (piece()!.id + 1).toString() : null}
                           />
                         </div>
                       </Show>
                    </div>
                 );
             }}
         </For>
      </div>
    </div>
  );
};

const WinnerOverlay = () => {
    const winner = () => gameStore.winner;

    return (
      <Show when={winner()}>
        <div class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl animate-in fade-in duration-500">
            <div class={clsx("flex flex-col items-center p-8 sm:p-12 border-4 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]", COLOR_MAP[winner()!.color].border, COLOR_MAP[winner()!.color].bg, "bg-opacity-20")}>
                <Trophy class={clsx("w-24 h-24 sm:w-32 sm:h-32 mb-6 animate-bounce", COLOR_MAP[winner()!.color].text)} />
                <h2 class={clsx("text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-2 text-center", COLOR_MAP[winner()!.color].text)}>
                    {winner()!.name} Wins!
                </h2>
                <p class="text-gray-300 text-lg sm:text-xl mb-8 font-mono">Mission Accomplished</p>
                <button 
                    onClick={gameActions.resetGame}
                    class={clsx("px-8 py-4 rounded-xl text-xl font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-all", COLOR_MAP[winner()!.color].bg, "text-white")}
                >
                    Play Again
                </button>
            </div>
        </div>
      </Show>
    )
}

const Board = () => {
  let containerRef: HTMLDivElement | undefined;
  const [cellSize, setCellSize] = createSignal(20);
  
  const boardSize = 15;

  onMount(() => {
    const updateSize = () => {
        if (containerRef) {
            const width = containerRef.clientWidth;
            const height = containerRef.clientHeight;
            const safeMargin = 80; // Increased margin to account for borders, padding, and rounding
            const availableSize = Math.min(width, height) - safeMargin;
            const size = Math.floor(Math.max(10, availableSize / boardSize));
            setCellSize(size);
        }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef) {
        resizeObserver.observe(containerRef);
    }
    updateSize();
    return () => resizeObserver.disconnect();
  });

  const fullSize = () => boardSize * cellSize();
  const getPos = (lx: number, ly: number) => ({
      x: lx * cellSize() + cellSize()/2,
      y: (14 - ly) * cellSize() + cellSize()/2
  });

  return (
    <div ref={containerRef} class="w-full h-full flex items-start justify-center pt-4 md:pt-8 p-4">
      <div 
        class="relative bg-slate-950/60 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300"
        style={{ width: `${fullSize() + 4}px`, height: `${fullSize() + 4}px` }}
      >
         <WinnerOverlay />

         <div class="relative w-full h-full">
            <Hangar color={PlayerColor.YELLOW} cellSize={cellSize()} />
            <Hangar color={PlayerColor.RED} cellSize={cellSize()} />
            <Hangar color={PlayerColor.GREEN} cellSize={cellSize()} />
            <Hangar color={PlayerColor.BLUE} cellSize={cellSize()} />

            <svg width={fullSize()} height={fullSize()} class="absolute inset-0 pointer-events-none z-0 opacity-70">
               {(() => { const s = getPos(3,4); const e = getPos(3,10); return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#10b981" stroke-width={cellSize()/6} stroke-dasharray={`${cellSize()/4},${cellSize()/4}`} stroke-linecap="round" />; })()}
               {(() => { const s = getPos(4,11); const e = getPos(10,11); return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#3b82f6" stroke-width={cellSize()/6} stroke-dasharray={`${cellSize()/4},${cellSize()/4}`} stroke-linecap="round" />; })()}
               {(() => { const s = getPos(11,10); const e = getPos(11,4); return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#eab308" stroke-width={cellSize()/6} stroke-dasharray={`${cellSize()/4},${cellSize()/4}`} stroke-linecap="round" />; })()}
               {(() => { const s = getPos(10,3); const e = getPos(4,3); return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#f43f5e" stroke-width={cellSize()/6} stroke-dasharray={`${cellSize()/4},${cellSize()/4}`} stroke-linecap="round" />; })()}
            </svg>

            <div class="grid grid-cols-15 gap-0 relative z-10" style={{ "grid-template-columns": `repeat(15, ${cellSize()}px)` }}>
               <For each={Array.from({ length: boardSize * boardSize })}>
                  {(_, i) => {
                    const x = i() % boardSize;
                    const y = Math.floor(i() / boardSize); 
                    return <GridCell x={x} y={y} cellSize={cellSize()} />;
                  }}
               </For>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Board;