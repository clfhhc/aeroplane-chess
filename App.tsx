import { createSignal, Show } from 'solid-js';
import Board from './components/Board';
import Controls from './components/Controls';
import History from './components/History';
import Setup from './components/Setup';
import { gameStore } from './store/gameStore';

const App = () => {
  const [isLogOpen, setIsLogOpen] = createSignal(false);

  return (
    <div class="flex flex-col md:flex-row h-[100dvh] w-screen text-white overflow-hidden bg-transparent relative">
      <Show when={gameStore.gameStatus === 'setup'}>
        <Setup />
      </Show>
      
      <Show when={gameStore.gameStatus === 'playing'}>
        {/* 
          Mode 1 (XL+, ≥1280px): Permanent Sidebar.
          Mode 2 (MD to XL-1, 768-1279px OR mobile landscape): Hidden sidebar, modal available.
          Mode 3 (SM portrait, <768px portrait): Hidden sidebar, modal available.
        */}
        <div class="hidden xl:block h-full shrink-0">
           <History isOpen={true} onClose={() => {}} />
        </div>

        {/* Modal History for Tablet/Mobile */}
        <Show when={isLogOpen()}>
          <div class="block xl:hidden absolute inset-0 z-50 pointer-events-none">
             {/* Backdrop */}
             <div class="absolute inset-0 bg-black/50 pointer-events-auto" onClick={() => setIsLogOpen(false)} />
             {/* Sliding Content */}
             <div class="absolute left-0 top-0 bottom-0 pointer-events-auto">
                 <History isOpen={true} onClose={() => setIsLogOpen(false)} />
             </div>
          </div>
        </Show>
        
        {/* Center Panel: Board */}
        <div class="flex-1 flex items-center justify-center relative z-0 order-1 overflow-hidden p-2 md:p-6">
           <div class="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-900/30 rounded-full blur-[60px] md:blur-[100px] pointer-events-none animate-pulse" />
           <Board />
        </div>
        
        {/* Right (Tablet/Desktop) or Bottom (Mobile) Panel: Controls */}
        <div class="order-2 w-full md:w-auto shrink-0">
           <Controls onToggleLog={() => setIsLogOpen(!isLogOpen())} />
        </div>
      </Show>
    </div>
  );
};

export default App;