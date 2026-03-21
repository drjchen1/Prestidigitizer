
import React, { useState } from 'react';
import { LanguageLevel } from '../types';

interface DashboardProps {
  onFileUpload: (file: File, languageLevel: LanguageLevel) => void;
  isProcessing: boolean;
  onShowDocs: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onFileUpload, isProcessing, onShowDocs }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file, 'faithful');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileUpload(file, 'faithful');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full px-4">
      {/* 1. Top: Prestidigitizer Title and Branding */}
      <div className="flex items-center gap-4 md:gap-6 mb-12">
        <div className="bg-purdue text-slate-900 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-xl md:rounded-2xl shadow-xl shadow-slate-200 flex-shrink-0">
          <span className="text-3xl md:text-4xl font-serif italic font-bold leading-none select-none transform -translate-y-1">P</span>
        </div>
        <h1 className="text-[48px] md:text-[64px] font-black tracking-tighter leading-none flex items-center">
          <span className="text-black">Presti</span><span className="text-purdue font-bold">digitizer</span>
        </h1>
      </div>

      {/* 3. The Card */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-fit mx-auto text-center p-8 md:p-12 border-2 border-dashed rounded-[2rem] md:rounded-[2.5rem] bg-white transition-all duration-300 ${
          isDragging 
            ? 'border-purdue bg-purdue/5 scale-[1.02] shadow-2xl shadow-purdue/10' 
            : 'border-slate-200'
        }`}
      >
        <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-8 whitespace-normal md:whitespace-nowrap">
          Ready to <span className="text-purdue font-bold">Digitize.</span>
        </h2>
        
        <div>
          <label className="inline-flex items-center justify-center w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-purdue hover:brightness-95 text-black font-bold rounded-xl md:rounded-2xl shadow-xl transition-all cursor-pointer">
            <span className="text-sm md:text-base">Upload File</span>
            <input type="file" className="sr-only" accept="application/pdf,image/*,.heic,.heif,.txt" onChange={handleFileChange} disabled={isProcessing} />
          </label>
        </div>
      </div>

      {/* 5. Bottom Links */}
      <div className="mt-12 flex items-center justify-center gap-6 md:gap-10 text-[11px] md:text-sm font-black text-slate-400 uppercase tracking-widest">
        <button onClick={onShowDocs} className="hover:text-purdue transition-colors">How to Use</button>
        <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" className="hover:text-purdue transition-colors">WCAG 2.2 AA</a>
        <span className="select-none opacity-50">v1.0.0</span>
      </div>
    </div>
  );
};

export default Dashboard;
