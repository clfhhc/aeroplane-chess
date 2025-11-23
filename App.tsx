import React, { useState } from 'react';
import Board from './components/Board';
import Controls from './components/Controls';
import History from './components/History';
import Setup from './components/Setup';
import { useGameStore } from './store/gameStore';

const App: React.FC = () => {
  const gameStatus = useGameStore(state => state.gameStatus);
  const [isLogOpen, setIsLogOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen text-white overflow-hidden bg-transparent relative">
      {gameStatus === 'setup' && <Setup />}
      
      {gameStatus === 'playing' && (
        <>
          {/* 
            Desktop (LG+): Permanent Sidebar.
            Tablet (MD): Hidden sidebar, modal available.
            Mobile (SM): Hidden sidebar, modal available.
          */}
          <div className="hidden lg:block h-full shrink-0">
             <History isOpen={true} onClose={() => {}} />
          </div>

          {/* Modal History for Tablet/Mobile */}
          <div className={isLogOpen ? "block lg:hidden absolute inset-0 z-50 pointer-events-none" : "hidden"}>
             {/* Backdrop */}
             <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={() => setIsLogOpen(false)} />
             {/* Sliding Content */}
             <div className="absolute left-0 top-0 bottom-0 pointer-events-auto">
                 <History isOpen={true} onClose={() => setIsLogOpen(false)} />
             </div>
          </div>
          
          {/* Center Panel: Board */}
          <div className="flex-1 flex items-center justify-center relative z-0 order-1 overflow-hidden p-2 md:p-6">
             <div className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-900/30 rounded-full blur-[60px] md:blur-[100px] pointer-events-none animate-pulse" />
             <Board />
          </div>
          
          {/* Right (Tablet/Desktop) or Bottom (Mobile) Panel: Controls */}
          <div className="order-2 w-full md:w-auto shrink-0">
             <Controls onToggleLog={() => setIsLogOpen(!isLogOpen)} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;