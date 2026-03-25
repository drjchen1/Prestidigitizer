
import React from 'react';

interface HeaderProps {
  onShowDocs: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowDocs }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-[1800px] mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-purdue text-slate-900 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl shadow-lg shadow-slate-200 flex-shrink-0">
            <span className="text-xl md:text-2xl font-serif italic font-bold leading-none select-none transform -translate-x-0.5 -translate-y-0.5">P</span>
          </div>
          <h1 className="text-[32px] md:text-[40px] font-black tracking-tighter md:whitespace-normal pr-2 flex items-center">
            <span className="text-black">Presti</span><span className="text-purdue font-bold">digitizer</span>
          </h1>
        </div>
        
        <nav className="hidden sm:flex items-center gap-4 md:gap-8 text-[11px] md:text-sm font-black text-slate-400 uppercase tracking-widest flex-shrink-0">
          <button onClick={onShowDocs} className="inline-flex items-center text-[12px] md:text-[15px] hover:text-purdue transition-colors">How to Use</button>
          <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center hover:text-purdue transition-colors">WCAG 2.2 AA</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
