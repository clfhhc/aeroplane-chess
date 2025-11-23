import React from 'react';
import { useGameStore } from '../store/gameStore';
import { COLOR_MAP } from '../constants';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface HistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

const History: React.FC<HistoryProps> = ({ isOpen, onClose }) => {
  const logs = useGameStore((state) => state.logs);

  if (!isOpen) return null;

  return (
    <div className={clsx(
        "h-full w-72",
        "bg-slate-900/95 lg:bg-slate-900/80 backdrop-blur-md lg:border-r border-white/10 flex flex-col shadow-2xl transition-transform",
        // No conditional transform needed here as parent handles visibility/positioning now
    )}>
      <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full"/>
          FLIGHT LOG
        </h2>
        {/* Close button only visible on mobile/tablet (where it acts as modal) */}
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {logs.length === 0 && (
            <div className="text-gray-500 text-center italic text-sm mt-10">
                No flight data recorded.
            </div>
        )}
        {logs.map((log) => (
          <div 
            key={log.turn} 
            className={clsx(
              "p-3 rounded-lg border-l-2 bg-white/5 text-sm",
              COLOR_MAP[log.playerColor].border
            )}
          >
            <div className={clsx("font-bold text-xs uppercase mb-1 opacity-80", COLOR_MAP[log.playerColor].text)}>
               Player {log.playerColor}
            </div>
            <div className="text-gray-300 font-mono leading-snug">
              {log.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;