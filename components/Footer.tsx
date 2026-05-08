import React from 'react';
import { ModelType, DocumentType, TranscriptionStyle, ThinkingMode } from '../types';

interface FooterProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  documentType: DocumentType;
  onDocumentTypeChange: (type: DocumentType) => void;
  transcriptionStyle: TranscriptionStyle;
  onTranscriptionStyleChange: (style: TranscriptionStyle) => void;
  thinkingMode: ThinkingMode;
  onThinkingModeChange: (mode: ThinkingMode) => void;
}

const Footer: React.FC<FooterProps> = ({ selectedModel, onModelChange, documentType, onDocumentTypeChange, transcriptionStyle, onTranscriptionStyleChange, thinkingMode, onThinkingModeChange }) => {
  return (
    <footer className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none select-none z-0">
      <div className="flex flex-wrap items-center justify-center gap-4 pointer-events-auto bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-slate-200">
        <select 
          value={documentType}
          onChange={(e) => onDocumentTypeChange(e.target.value as DocumentType)}
          className="bg-transparent text-[9px] font-mono text-slate-500 font-medium uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
        >
          <option value="handwritten">Handwritten</option>
          <option value="printed">Printed</option>
        </select>
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <select 
          value={transcriptionStyle}
          onChange={(e) => onTranscriptionStyleChange(e.target.value as TranscriptionStyle)}
          className="bg-transparent text-[9px] font-mono text-slate-500 font-medium uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
        >
          <option value="verbatim">Verbatim</option>
          <option value="audio_optimized">Audio-Optimized</option>
        </select>
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <select 
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as ModelType)}
          className="bg-transparent text-[9px] font-mono text-slate-500 font-medium uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
        >
          <option value="gemini-3-flash-preview">Flash 3</option>
          <option value="gemini-3.1-flash-lite-preview">Flash 3.1 Lite</option>
          <option value="gemini-3.1-pro-preview">Pro 3.1</option>
        </select>
        {selectedModel === 'gemini-3.1-pro-preview' && (
          <>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <select 
              value={thinkingMode}
              onChange={(e) => onThinkingModeChange(e.target.value as ThinkingMode)}
              className="bg-transparent text-[9px] font-mono text-slate-500 font-medium uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-slate-900 transition-colors"
            >
              <option value="auto">Think: Auto</option>
              <option value="low">Think: Low (Fast)</option>
              <option value="high">Think: High (Accurate)</option>
            </select>
          </>
        )}
        <div className="w-1 h-1 bg-slate-300 rounded-full" />
        <div className="text-[9px] font-mono text-slate-400 font-medium uppercase tracking-[0.3em]">
          © 2026 K. CHEN
        </div>
      </div>
    </footer>
  );
};

export default Footer;
