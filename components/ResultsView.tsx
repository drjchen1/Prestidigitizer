
import React, { useRef, useEffect } from 'react';
import { ConversionResult } from '../types';

interface ResultsViewProps {
  results: ConversionResult[];
  activeTab: number;
  setActiveTab: (index: number) => void;
  viewMode: 'preview' | 'source';
  setViewMode: (mode: 'preview' | 'source') => void;
  onEditFigure: (pageIndex: number, figureId: string) => void;
  onDownloadHtml: () => void;
  onShowAudit: () => void;
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({
  results,
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  onEditFigure,
  onDownloadHtml,
  onShowAudit,
  onReset
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const activeAudit = results[activeTab]?.audit;

  useEffect(() => {
    if (window.MathJax && results.length > 0 && contentRef.current) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err: any) => 
        console.error('MathJax error:', err)
      );

      const editButtons = contentRef.current.querySelectorAll('.edit-figure-btn');
      
      const handleEditClick = (e: Event) => {
        const figureId = (e.currentTarget as HTMLElement).getAttribute('data-figure-id');
        if (figureId) {
          onEditFigure(activeTab, figureId);
        }
      };

      editButtons.forEach(btn => {
        btn.addEventListener('click', handleEditClick);
      });

      return () => {
        editButtons.forEach(btn => {
          btn.removeEventListener('click', handleEditClick);
        });
      };
    }
  }, [results, activeTab, viewMode, onEditFigure]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <aside className="w-full lg:w-64 flex-shrink-0 space-y-4 lg:sticky lg:top-24">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-[10px] uppercase tracking-widest">Accessibility</h3>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeAudit?.score === 100 ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
              {activeAudit?.score}% AA
            </div>
          </div>
          
          <div className="mb-4">
            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${activeAudit?.score === 100 ? 'bg-slate-500' : 'bg-amber-500'}`}
                style={{ width: `${activeAudit?.score || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            {activeAudit?.checks.map((check, idx) => (
              <div key={idx} className="group relative">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 flex items-center justify-center ${check.passed ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-600'}`}>
                    {check.passed ? (
                      <svg className="w-1.5 h-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : (
                      <span className="text-[8px] font-bold">!</span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold leading-tight ${check.passed ? 'text-slate-500' : 'text-amber-600'}`}>{check.title}</span>
                </div>
                <div className="hidden group-hover:block absolute left-full ml-4 top-0 w-56 p-4 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl z-50">
                  <p className="font-bold mb-1">{check.description}</p>
                  {check.suggestion && (
                    <p className="text-amber-300 mt-2 flex items-start gap-1">
                      <span className="font-black">Fix:</span> {check.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={onShowAudit}
            className="w-full py-2 mb-6 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
          >
            View Full Report
          </button>

          <h3 className="font-bold text-slate-900 mb-4 text-[10px] uppercase tracking-widest border-t border-slate-100 pt-4">Controls</h3>
          <div className="space-y-2">
             <button onClick={onDownloadHtml} className="w-full py-2.5 bg-purdue text-black rounded-xl text-[10px] font-bold hover:brightness-95 transition-all">DOWNLOAD HTML</button>
             <button 
               onClick={onReset} 
               className="w-full py-2.5 mt-4 bg-white border-2 border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
               New Document
             </button>
          </div>
        </div>

        <nav className="bg-slate-50 p-6 rounded-3xl border border-slate-100 max-h-[400px] overflow-y-auto">
          <h3 className="font-bold text-slate-900 mb-4 text-[10px] uppercase tracking-widest">Pages</h3>
          <div className="grid grid-cols-2 gap-2">
            {results.map((r, i) => (
              <button 
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-3 py-2 rounded-lg text-[10px] font-black border transition-all ${activeTab === i ? 'bg-purdue text-black border-purdue shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
              >
                P.{r.pageNumber}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <div className="flex-1 w-full flex flex-col">
        <div className="w-full max-w-none">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
             <div className="flex gap-4">
                <button onClick={() => setViewMode('preview')} className={`text-[11px] font-black tracking-widest ${viewMode === 'preview' ? 'text-purdue' : 'text-slate-300 hover:text-slate-500'}`}>PREVIEW</button>
                <button onClick={() => setViewMode('source')} className={`text-[11px] font-black tracking-widest ${viewMode === 'source' ? 'text-purdue' : 'text-slate-300 hover:text-slate-500'}`}>SOURCE</button>
             </div>
             <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Page {activeTab + 1} of {results.length}</div>
          </div>

          <div className="min-h-[800px] pb-32">
            {viewMode === 'preview' ? (
              <article ref={contentRef} className="math-content max-w-none bg-[#fafaf9] p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100 w-full">
                 <div dangerouslySetInnerHTML={{ __html: results[activeTab]?.html || '' }} />
              </article>
            ) : (
              <div className="font-mono text-[11px] text-slate-500 bg-slate-50 p-8 rounded-3xl whitespace-pre-wrap leading-loose">
                {results[activeTab]?.html}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
