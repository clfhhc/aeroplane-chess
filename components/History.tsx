import { For, Show } from 'solid-js';
import { gameStore } from '../store/gameStore';
import { COLOR_MAP } from '../constants';
import { X } from 'lucide-solid';
import clsx from 'clsx';

interface HistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

const History = (props: HistoryProps) => {
  return (
    <Show when={props.isOpen}>
      <div class={clsx(
          "h-full w-72",
          "bg-slate-900/95 xl:bg-slate-900/80 backdrop-blur-md xl:border-r border-white/10 flex flex-col shadow-2xl transition-transform",
      )}>
        <div class="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <h2 class="text-xl font-bold text-gray-200 flex items-center gap-2">
            <span class="w-2 h-6 bg-emerald-500 rounded-full"/>
            FLIGHT LOG
          </h2>
          {/* Close button only visible on mobile/tablet (where it acts as modal) */}
          <button onClick={props.onClose} class="xl:hidden text-gray-400 hover:text-white">
              <X size={24} />
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          <Show when={gameStore.logs.length === 0}>
              <div class="text-gray-500 text-center italic text-sm mt-10">
                  No flight data recorded.
              </div>
          </Show>
          <For each={gameStore.logs}>
            {(log) => (
              <div 
                class={clsx(
                  "p-3 rounded-lg border-l-2 bg-white/5 text-sm",
                  COLOR_MAP[log.playerColor].border
                )}
              >
                <div class={clsx("font-bold text-xs uppercase mb-1 opacity-80", COLOR_MAP[log.playerColor].text)}>
                   Player {log.playerColor}
                </div>
                <div class="text-gray-300 font-mono leading-snug">
                  {log.text}
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
};

export default History;