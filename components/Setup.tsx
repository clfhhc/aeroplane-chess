import React, { useState } from 'react';
import { PlayerColor } from '../types';
import { useGameStore } from '../store/gameStore';
import { COLOR_MAP, PLAYER_ORDER } from '../constants';
import clsx from 'clsx';
import { Plane, Users, Play, Check } from 'lucide-react';

const Setup: React.FC = () => {
  const startGame = useGameStore(state => state.startGame);
  const [playerCount, setPlayerCount] = useState(4);
  const [selectedColors, setSelectedColors] = useState<PlayerColor[]>(PLAYER_ORDER);

  const handleCountChange = (count: number) => {
      setPlayerCount(count);
      setSelectedColors(PLAYER_ORDER.slice(0, count));
  };

  const handleColorClick = (color: PlayerColor) => {
      if (selectedColors.includes(color)) {
          // Logic could be added to deselect if flexible
      } else {
          if (selectedColors.length < playerCount) {
               setSelectedColors([...selectedColors, color]);
          } else {
               const newSelection = [...selectedColors.slice(1), color];
               setSelectedColors(newSelection);
          }
      }
  };
  
  const isValid = selectedColors.length === playerCount;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-white z-20 relative p-4">
       <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl">
           <div className="text-center mb-8 sm:mb-10">
               <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                   MISSION SETUP
               </h1>
               <div className="h-1 w-24 bg-blue-500 mx-auto mt-2 rounded-full" />
           </div>

           <div className="space-y-6 sm:space-y-8">
               {/* Player Count */}
               <div>
                   <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 sm:mb-4 flex items-center gap-2">
                       <Users className="w-4 h-4" /> Pilot Count
                   </label>
                   <div className="grid grid-cols-3 gap-3 sm:gap-4">
                       {[2, 3, 4].map(num => (
                           <button
                               key={num}
                               onClick={() => handleCountChange(num)}
                               className={clsx(
                                   "py-2 sm:py-3 rounded-xl font-bold text-lg sm:text-xl transition-all border-2",
                                   playerCount === num 
                                     ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/30 scale-105 text-white"
                                     : "bg-slate-800 border-transparent text-gray-500 hover:bg-slate-700"
                               )}
                           >
                               {num}
                           </button>
                       ))}
                   </div>
               </div>

               {/* Color Selection */}
               <div>
                   <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 sm:mb-4 flex items-center justify-between">
                       <div className="flex items-center gap-2"><Plane className="w-4 h-4" /> Select Squadrons</div>
                       <span className={clsx("text-xs", isValid ? "text-emerald-400" : "text-rose-400")}>
                           {selectedColors.length} / {playerCount} Selected
                       </span>
                   </label>
                   <div className="grid grid-cols-4 gap-3 sm:gap-4">
                       {PLAYER_ORDER.map(color => {
                           const isSelected = selectedColors.includes(color);
                           const style = COLOR_MAP[color];
                           return (
                               <button
                                   key={color}
                                   onClick={() => handleColorClick(color)}
                                   className={clsx(
                                       "aspect-square rounded-2xl flex items-center justify-center transition-all relative group",
                                       isSelected 
                                          ? clsx(style.bg, "bg-opacity-20 border-2", style.border, style.glow)
                                          : "bg-slate-800/50 border-2 border-transparent grayscale hover:grayscale-0"
                                   )}
                               >
                                   <Plane className={clsx("w-6 h-6 sm:w-8 sm:h-8 transform group-hover:scale-110 transition-transform", isSelected ? style.text : "text-gray-500 group-hover:text-white")} />
                                   {isSelected && (
                                       <div className={clsx("absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg")}>
                                           <Check size={12} strokeWidth={4} />
                                       </div>
                                   )}
                               </button>
                           );
                       })}
                   </div>
               </div>

               {/* Start Button */}
               <button
                   onClick={() => isValid && startGame(selectedColors)}
                   disabled={!isValid}
                   className={clsx(
                       "w-full py-3 sm:py-4 rounded-xl text-lg font-bold uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-3 mt-4 sm:mt-8",
                       isValid 
                         ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 hover:scale-[1.02] shadow-emerald-500/30 text-white" 
                         : "bg-slate-800 text-gray-600 cursor-not-allowed"
                   )}
               >
                   <Play fill="currentColor" /> Launch Mission
               </button>
           </div>
       </div>
    </div>
  );
};

export default Setup;