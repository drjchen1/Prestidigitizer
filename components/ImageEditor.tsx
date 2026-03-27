import React, { useState, useRef, useEffect } from 'react';
import { X, Pencil, Save, RotateCcw, Download, Sparkles, Loader2, CheckCircle2, Eraser, Sigma } from 'lucide-react';
import { motion } from 'framer-motion';
import { describeFigure } from '../services/geminiService';

interface FigureToEdit {
  id: string;
  src: string;
  originalSrc: string;
  alt: string;
  pageIndex: number;
}

interface ImageEditorProps {
  figure: FigureToEdit;
  onSave: (update: { figureId: string, pageIndex: number, newSrc: string, newAlt?: string }) => void;
  onClose: () => void;
  onApiCall?: (tokens?: number) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ figure, onSave, onClose, onApiCall }) => {
  const [color, setColor] = useState('#CEB888');
  const [mode, setMode] = useState<'view' | 'draw' | 'erase' | 'accessibility'>('view');
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const altPreviewRef = useRef<HTMLDivElement>(null);
  
  const [altText, setAltText] = useState<string>(figure.alt);
  const [editedSrc, setEditedSrc] = useState<string | null>(null);

  useEffect(() => {
    setAltText(figure.alt);
  }, [figure]);

  useEffect(() => {
    renderCanvas();
  }, [editedSrc, figure]);

  useEffect(() => {
    if (mode === 'accessibility' && altPreviewRef.current && (window as any).MathJax) {
      const timer = setTimeout(() => {
        (window as any).MathJax.typesetPromise([altPreviewRef.current]).catch((err: any) => console.error('MathJax error:', err));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mode, altText]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = editedSrc || figure.src;
  };

  const handleRegenerateDescription = async () => {
    setIsDescribing(true);
    try {
      const srcToUse = editedSrc || figure.src;
      const { result: newDescription, tokenCount } = await describeFigure(srcToUse);
      onApiCall?.(tokenCount);
      setAltText(newDescription);
    } catch (error) {
      console.error('Description regeneration failed:', error);
      alert('Failed to regenerate description. Please try again.');
    } finally {
      setIsDescribing(false);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw' && mode !== 'erase') return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          setEditedSrc(canvas.toDataURL('image/png'));
        }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || (mode !== 'draw' && mode !== 'erase')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = mode === 'erase' ? 20 : 3;
    ctx.lineCap = 'round';
    
    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = async () => {
    const src = editedSrc || figure.src;
    onSave({
      figureId: figure.id,
      pageIndex: figure.pageIndex,
      newSrc: src,
      newAlt: altText
    });
    onClose();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `edited-figure-${figure.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleResetFigure = () => {
    setEditedSrc(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md p-0 lg:p-8"
    >
      <div className="bg-white w-full max-w-7xl h-full lg:h-[95vh] lg:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-purdue text-black p-2 rounded-xl">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Figure Editor
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Touch up your diagrams
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Sidebar Controls */}
          <div className="w-full lg:w-72 bg-slate-50 border-r border-slate-100 p-8 space-y-8 overflow-y-auto">
            <section>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tools</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { setMode('view'); handleResetFigure(); }}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'view' ? 'bg-purdue text-black shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Reset</span>
                </button>
                <button 
                  onClick={() => setMode('draw')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'draw' ? 'bg-purdue text-black shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                >
                  <Pencil className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Draw</span>
                </button>
                <button 
                  onClick={() => setMode('erase')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'erase' ? 'bg-purdue text-black shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                >
                  <Eraser className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Erase</span>
                </button>
                <button 
                  onClick={() => setMode('accessibility')}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${mode === 'accessibility' ? 'bg-purdue text-black shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-300'}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-[9px] font-bold">Alt Text</span>
                </button>
              </div>
            </section>

            {mode === 'draw' && (
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Colors</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['#CEB888', '#ef4444', '#78716c', '#f59e0b', '#000000', '#ffffff', '#ec4899', '#8b5cf6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${color === c ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </section>
            )}

            {mode === 'accessibility' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessibility (Alt Text)</h3>
                  <button 
                    onClick={handleRegenerateDescription}
                    disabled={isDescribing}
                    className="text-[9px] font-black text-purdue uppercase tracking-widest flex items-center gap-1 hover:brightness-95 disabled:opacity-50"
                  >
                    {isDescribing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Regenerate
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-600">Description</label>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          const textarea = document.querySelector('textarea');
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '\\(' + text.substring(start, end) + '\\)' + text.substring(end);
                            setAltText(newText);
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[9px] font-black rounded-md text-slate-600 transition-colors"
                        title="Insert inline math"
                      >
                        \( ... \)
                      </button>
                      <button 
                        onClick={() => {
                          const textarea = document.querySelector('textarea');
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + '\\[' + text.substring(start, end) + '\\]' + text.substring(end);
                            setAltText(newText);
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[9px] font-black rounded-md text-slate-600 transition-colors"
                        title="Insert block math"
                      >
                        \[ ... \]
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs min-h-[120px] focus:ring-2 focus:ring-purdue focus:border-purdue transition-all font-sans"
                    placeholder="Describe the figure for screen readers..."
                  />
                  <div className="p-3 bg-purdue/10 rounded-xl border border-purdue/20">
                    <h4 className="text-[9px] font-black text-purdue uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Sigma size={10} /> Math Preview
                    </h4>
                    <div ref={altPreviewRef} className="text-[11px] text-slate-700 leading-relaxed min-h-[1.5rem]">
                      {altText}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed italic">
                    Tip: Use <code className="bg-slate-100 px-1 rounded">\( ... \)</code> for inline math or <code className="bg-slate-100 px-1 rounded">\[ ... \]</code> for block math. Provide spoken-word equivalents for complex notation.
                  </p>
                </div>
              </section>
            )}

            <div className="pt-8 border-t border-slate-200 space-y-3">
              <button 
                onClick={handleSave}
                className="w-full py-4 bg-purdue text-black font-bold rounded-2xl hover:brightness-95 shadow-xl shadow-purdue/20 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save All Changes
              </button>
              <button 
                onClick={handleDownload}
                className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Current PNG
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-slate-200 p-12 overflow-y-auto relative" ref={containerRef}>
            <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white mx-auto w-full">
              <canvas 
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`w-full h-auto object-contain ${mode === 'draw' ? 'cursor-crosshair' : mode === 'erase' ? 'cursor-cell' : 'cursor-default'}`}
              />
            </div>

            {(mode === 'draw' || mode === 'erase') && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/10">
                {mode === 'draw' ? 'Drawing Mode Active' : 'Eraser Mode Active'} • Use mouse/touch to annotate
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageEditor;
