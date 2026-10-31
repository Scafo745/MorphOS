import React from 'react';
import { Desktop } from './shell/Desktop';
import { BootScreen } from './shell/BootScreen';

export const App: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-slate-100 font-sans select-none">
      <BootScreen />
      <Desktop />
    </div>
  );
};

export default App;
