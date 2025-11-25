import { Plane } from 'lucide-solid';
import { PlayerColor } from '../types';
import { COLOR_MAP } from '../constants';
import clsx from 'clsx';

interface PieceProps {
  color: PlayerColor;
  onClick?: (e: MouseEvent) => void;
  isClickable?: boolean;
  isHighlighted?: boolean;
  count?: number; 
  scale?: number; 
  moveableLabel?: string | null;
}

const Piece = (props: PieceProps) => {
  const styles = () => COLOR_MAP[props.color];
  
  return (
    <div 
      onClick={props.isClickable ? props.onClick : undefined}
      class={clsx(
        "relative rounded-full flex items-center justify-center transition-all duration-200",
        styles().bg,
        styles().glow,
        "shadow-lg border-2 border-white/50",
        props.isClickable ? "cursor-pointer hover:scale-110" : "",
        props.isHighlighted ? "scale-125 ring-4 ring-white z-50" : ""
      )}
      style={{
        width: '80%',
        height: '80%',
      }}
    >
      <Plane class="text-white w-[70%] h-[70%] rotate-45" fill="currentColor" />
      
      {/* Count Badge (Stacking) */}
      {(props.count && props.count > 1) && (
        <span class="absolute -top-1 -right-1 bg-white text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-gray-400 shadow-sm z-10">
          {props.count}
        </span>
      )}

      {/* Moveable Indicator (Large Bouncing Number) */}
      {props.moveableLabel && (
        <div class="absolute inset-0 z-20 flex items-center justify-center animate-bounce pointer-events-none select-none">
             <span 
                class={clsx(
                    "text-3xl sm:text-4xl font-black text-white drop-shadow-lg select-none"
                )}
                style={{ 
                    "text-shadow": '0px 0px 4px rgba(0,0,0,0.8), 0px 0px 10px currentColor' 
                }}
             >
                {props.moveableLabel}
             </span>
        </div>
      )}
    </div>
  );
};

export default Piece;