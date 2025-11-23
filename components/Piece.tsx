import React from 'react';
import { Plane } from 'lucide-react';
import { PlayerColor } from '../types';
import { COLOR_MAP } from '../constants';
import clsx from 'clsx';

interface PieceProps {
  color: PlayerColor;
  onClick?: (e: React.MouseEvent) => void;
  isClickable?: boolean;
  isHighlighted?: boolean;
  count?: number; 
  scale?: number; 
  moveableLabel?: string | null; // e.g., "1", "2", "3", "4"
}

const Piece: React.FC<PieceProps> = ({ color, onClick, isClickable, isHighlighted, count = 1, scale = 1, moveableLabel }) => {
  const styles = COLOR_MAP[color];
  
  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={clsx(
        "relative rounded-full flex items-center justify-center transition-all duration-200",
        styles.bg,
        styles.glow,
        "shadow-lg border-2 border-white/50",
        isClickable ? "cursor-pointer hover:scale-110" : "",
        isHighlighted ? "scale-125 ring-4 ring-white z-50" : ""
      )}
      style={{
        width: '80%',
        height: '80%',
      }}
    >
      <Plane className="text-white w-[70%] h-[70%] rotate-45" fill="currentColor" />
      
      {/* Count Badge (Stacking) */}
      {count > 1 && (
        <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-gray-400 shadow-sm z-10">
          {count}
        </span>
      )}

      {/* Moveable Indicator (Large Bouncing Number) */}
      {moveableLabel && (
        <div className="absolute inset-0 z-20 flex items-center justify-center animate-bounce pointer-events-none">
             <span 
                className={clsx(
                    "text-3xl sm:text-4xl font-black text-white drop-shadow-lg"
                )}
                style={{ 
                    // Add a strong shadow/stroke effect to make it pop against any background
                    textShadow: '0px 0px 4px rgba(0,0,0,0.8), 0px 0px 10px currentColor' 
                }}
             >
                {moveableLabel}
             </span>
        </div>
      )}
    </div>
  );
};

export default Piece;