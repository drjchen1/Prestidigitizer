import React from 'react';
import { ModelType, DocumentType, TranscriptionStyle } from '../types';

interface FooterProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  documentType: DocumentType;
  onDocumentTypeChange: (type: DocumentType) => void;
  transcriptionStyle: TranscriptionStyle;
  onTranscriptionStyleChange: (style: TranscriptionStyle) => void;
}

const Footer: React.FC<FooterProps> = ({ selectedModel, onModelChange, documentType, onDocumentTypeChange, transcriptionStyle, onTranscriptionStyleChange }) => {
  return (
    <footer className="fixed bottom-6 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none select-none z-0">
      <div className="flex items-center gap-4 pointer-events-auto">
        <select 
          value={documentType}
          onChange={(e) => onDocumentTypeChange(e.target.value as DocumentType)}
          className="bg-transparent text-[9px] font-mono text-slate-300 uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-slate-500 transition-colors"
        >
          <option value="handwritten">Handwritten</option>
          <option value="printed">Printed</option>
        </select>
        <div className="w-1 h-1 bg-slate-200 rounded-full" />
        <select 
          value={transcriptionStyle}
          onChange={(e) => onTranscriptionStyleChange(e.target.value as TranscriptionStyle)}
          className="bg-transparent text-[9px] font-mono text-slate-300 uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-slate-500 transition-colors"
        >
          <option value="verbatim">Verbatim</option>
          <option value="audio_optimized">Audio-Optimized</option>
        </select>
        <div className="w-1 h-1 bg-slate-200 rounded-full" />
        <select 
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as ModelType)}
          className="bg-transparent text-[9px] font-mono text-slate-300 uppercase tracking-widest border-none focus:ring-0 cursor-pointer hover:text-slate-500 transition-colors"
        >
          <option value="gemini-3-flash-preview">Flash 3</option>
          <option value="gemini-3.1-flash-lite-preview">Flash 3.1 Lite</option>
          <option value="gemini-3.1-pro-preview">Pro 3.1</option>
        </select>
        <div className="w-1 h-1 bg-slate-200 rounded-full" />
        <div className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.3em]">
          © 2026 K. CHEN
        </div>
      </div>
    </footer>
  );
};

export default Footer;
