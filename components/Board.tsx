import React, { useEffect, useRef, useState } from 'react';
import { START_INDICES, GATEWAY_INDICES, SHORTCUTS, COLOR_MAP } from '../constants';
import { TRACK_COORDS, getHomeCoordinates, getLaunchCoordinate, getHangarZone } from '../utils/boardUtils';
import { useGameStore } from '../store/gameStore';
import Piece from './Piece';
import { PlayerColor } from '../types';
import clsx from 'clsx';
import { Rocket, Plane, Zap, Trophy } from 'lucide-react';

const GridCell: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const { players, currentPlayerIndex, turnState, diceValue, movePiece, highlightedPieceId } = useGameStore();

  const logicalX = x;
  const logicalY = 14 - y;

  let cellColorClass = "bg-transparent border-transparent"; 
  let isTrack = false;
  let trackIndex = -1;
  let homeColor: PlayerColor | null = null;
  let isCenter = (logicalX === 7 && logicalY === 7);
  let isLaunch = false;
  let launchColor: PlayerColor | null = null;

  [PlayerColor.YELLOW, PlayerColor.RED, PlayerColor.GREEN, PlayerColor.BLUE].forEach(c => {
      const launch = getLaunchCoordinate(c);
      if (launch.x === logicalX && launch.y === logicalY) {
          isLaunch = true;
          launchColor = c;
      }
  });

  const trackIdx = TRACK_COORDS.findIndex(c => c.x === logicalX && c.y === logicalY);
  if (trackIdx !== -1) {
    isTrack = true;
    trackIndex = trackIdx;
    const c = TRACK_COORDS[trackIdx].color!;
    cellColorClass = `${COLOR_MAP[c].bg} bg-opacity-20 border-${c}-500/40 border`;
  }

  [PlayerColor.YELLOW, PlayerColor.GREEN, PlayerColor.RED, PlayerColor.BLUE].forEach(c => {
    const homePath = getHomeCoordinates(c);
    for (let i=0; i<6; i++) {
        if (homePath[i].x === logicalX && homePath[i].y === logicalY) {
            homeColor = c;
            cellColorClass = `${COLOR_MAP[c].bg} bg-opacity-60 border-${c}-500 border shadow-[0_0_10px_rgba(0,0,0,0.3)]`;
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

  const piecesHere = players.flatMap(p => 
    p.pieces.filter(piece => {
      if (piece.state === 'active' && trackIndex !== -1 && piece.position === trackIndex) return true;
      if (piece.state === 'home' && homeColor === p.color) {
         const relativePos = piece.position - 100;
         const homeCoords = getHomeCoordinates(p.color);
         if (homeCoords[relativePos] && homeCoords[relativePos].x === logicalX && homeCoords[relativePos].y === logicalY) return true;
      }
      if (piece.state === 'launched' && isLaunch && launchColor === p.color) return true;
      if (piece.state === 'finished' && isCenter) return true;
      return false;
    }).map(piece => ({ ...piece, playerColor: p.color, playerId: p.id }))
  );

  const currentPlayer = players[currentPlayerIndex];

  if (!isTrack && !isHome && !isCenter && !isLaunch) {
     return <div style={{ width: `${size}px`, height: `${size}px` }} />;
  }

  return (
    <div 
      className={clsx(
        "relative flex items-center justify-center transition-all duration-300",
        cellColorClass,
        isCenter && "bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600 animate-pulse z-10 border-4 border-white/20",
        isLaunch && `border-none`
      )}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {isLaunch && (
         <Plane 
            className={clsx("absolute opacity-30 w-[80%] h-[80%]", COLOR_MAP[launchColor!].text)} 
            style={{ transform: `rotate(${launchRotation}deg)` }}
         />
      )}
      {isCenter && <Rocket className="text-white w-[80%] h-[80%] animate-spin-slow" />}
      
      {isTrack && Object.values(SHORTCUTS).some(s => s.start === trackIndex) && (
          <Zap className="text-white/60 w-[40%] h-[40%] absolute bottom-0 right-0" />
      )}

      {piecesHere.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          {piecesHere.map((p, idx) => {
             const isMyPiece = p.playerId === currentPlayerIndex;
             const isValidState = p.state !== 'finished' && (p.state !== 'base' || diceValue === 6);
             const canMove = turnState === 'moving' && diceValue !== null && isMyPiece && isValidState;
             
             return (
                 <div 
                    key={`${p.playerId}-${p.id}`} 
                    className={clsx("absolute w-full h-full flex items-center justify-center transition-all duration-500", idx > 0 && "-translate-y-1 translate-x-1")} 
                    style={{ zIndex: 20 + idx }}
                 >
                    <Piece 
                        color={p.playerColor} 
                        isClickable={canMove}
                        isHighlighted={p.id === highlightedPieceId && p.playerColor === currentPlayer.color}
                        moveableLabel={canMove ? (p.id + 1).toString() : null}
                        onClick={(e) => {
                            // Prevent double-firing if pieces are stacked
                            e?.stopPropagation();
                            if(canMove) movePiece(p.id);
                        }}
                        count={piecesHere.filter(ph => ph.playerColor === p.playerColor).length > 1 && idx === 0 ? piecesHere.filter(ph => ph.playerColor === p.playerColor).length : 1}
                    />
                 </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

const Hangar: React.FC<{ color: PlayerColor; size: number; cellSize: number }> = ({ color, size, cellSize }) => {
  const { players, currentPlayerIndex, turnState, diceValue, movePiece, highlightedPieceId } = useGameStore();
  const zone = getHangarZone(color);
  const style = COLOR_MAP[color];
  
  const top = (14 - zone.yMax) * cellSize;
  const left = zone.xMin * cellSize;
  const width = (zone.xMax - zone.xMin + 1) * cellSize;
  const height = (zone.yMax - zone.yMin + 1) * cellSize;

  const myPieces = players.find(p => p.color === color)?.pieces || [];
  const basePieces = myPieces.filter(p => p.state === 'base');
  
  const currentPlayer = players[currentPlayerIndex];

  return (
    <div 
       className={clsx(
         "absolute rounded-2xl border-2 sm:border-4 bg-opacity-10 backdrop-blur-sm z-30 box-border", 
         style.border, style.bg
       )}
       style={{ top, left, width, height }}
    >
      <div className="w-full h-full grid grid-cols-2 grid-rows-2">
         {[0, 1, 2, 3].map(idx => {
             const piece = basePieces[idx];
             if (!piece) return <div key={idx} />;

             const isMyPiece = currentPlayer?.color === color;
             const canLaunch = isMyPiece && diceValue === 6 && turnState === 'moving';

             return (
                <div key={idx} className="flex items-center justify-center relative">
                   <div className="w-full h-full flex items-center justify-center">
                     <Piece 
                       color={color} 
                       isClickable={canLaunch} 
                       isHighlighted={piece.id === highlightedPieceId && color === currentPlayer.color}
                       moveableLabel={canLaunch ? (piece.id + 1).toString() : null}
                       onClick={(e) => {
                           e?.stopPropagation();
                           if(canLaunch) movePiece(piece.id);
                       }} 
                     />
                   </div>
                </div>
             );
         })}
      </div>
    </div>
  );
};

const WinnerOverlay: React.FC = () => {
    const { winner, resetGame } = useGameStore();
    if (!winner) return null;

    const style = COLOR_MAP[winner.color];

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl animate-in fade-in duration-500">
            <div className={clsx("flex flex-col items-center p-8 sm:p-12 border-4 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]", style.border, style.bg, "bg-opacity-20")}>
                <Trophy className={clsx("w-24 h-24 sm:w-32 sm:h-32 mb-6 animate-bounce", style.text)} />
                <h2 className={clsx("text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-2 text-center", style.text)}>
                    {winner.name} Wins!
                </h2>
                <p className="text-gray-300 text-lg sm:text-xl mb-8 font-mono">Mission Accomplished</p>
                <button 
                    onClick={resetGame}
                    className={clsx("px-8 py-4 rounded-xl text-xl font-bold uppercase tracking-wider shadow-lg hover:scale-105 transition-all", style.bg, "text-white")}
                >
                    Play Again
                </button>
            </div>
        </div>
    )
}

const Board: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(20);
  
  const boardSize = 15;

  useEffect(() => {
    const updateSize = () => {
        if (containerRef.current) {
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            // Increased safe margin to prevent cropping of rounded corners/hangars
            const safeMargin = 40; 
            const availableSize = Math.min(width, height) - safeMargin;
            const size = Math.floor(Math.max(10, availableSize / boardSize));
            setCellSize(size);
        }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }
    updateSize();
    return () => resizeObserver.disconnect();
  }, []);

  const fullSize = boardSize * cellSize;
  const getPos = (lx: number, ly: number) => ({
      x: lx * cellSize + cellSize/2,
      y: (14 - ly) * cellSize + cellSize/2
  });

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center overflow-hidden">
      <div 
        className="relative bg-slate-950/60 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300"
        style={{ width: fullSize, height: fullSize }}
      >
         <WinnerOverlay />

         <div className="relative w-full h-full">
            <Hangar color={PlayerColor.YELLOW} size={boardSize} cellSize={cellSize} />
            <Hangar color={PlayerColor.RED} size={boardSize} cellSize={cellSize} />
            <Hangar color={PlayerColor.GREEN} size={boardSize} cellSize={cellSize} />
            <Hangar color={PlayerColor.BLUE} size={boardSize} cellSize={cellSize} />

            <svg width={fullSize} height={fullSize} className="absolute inset-0 pointer-events-none z-0 opacity-70">
               {(() => { const s = getPos(3,4); const e = getPos(3,10); return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#10b981" strokeWidth={cellSize/6} strokeDasharray={`${cellSize/4},${cellSize/4}`} strokeLinecap="round" />; })()}
               {(() => { const s = getPos(4,11); const e = getPos(10,11); return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#3b82f6" strokeWidth={cellSize/6} strokeDasharray={`${cellSize/4},${cellSize/4}`} strokeLinecap="round" />; })()}
               {(() => { const s = getPos(11,10); const e = getPos(11,4); return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#eab308" strokeWidth={cellSize/6} strokeDasharray={`${cellSize/4},${cellSize/4}`} strokeLinecap="round" />; })()}
               {(() => { const s = getPos(10,3); const e = getPos(4,3); return <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="#f43f5e" strokeWidth={cellSize/6} strokeDasharray={`${cellSize/4},${cellSize/4}`} strokeLinecap="round" />; })()}
            </svg>

            <div className="grid grid-cols-15 gap-0 relative z-10" style={{ gridTemplateColumns: `repeat(15, ${cellSize}px)` }}>
               {Array.from({ length: boardSize * boardSize }).map((_, i) => {
                  const x = i % boardSize;
                  const y = Math.floor(i / boardSize); 
                  return <GridCell key={i} x={x} y={y} size={cellSize} />;
               })}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Board;