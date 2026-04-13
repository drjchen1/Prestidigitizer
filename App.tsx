import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import ProcessingOverlay from './components/ProcessingOverlay';
import ImageEditor from './components/ImageEditor';
import Dashboard from './components/Dashboard';
import ResultsView from './components/ResultsView';
import AccessibilityAuditReport from './components/AccessibilityAuditReport';
import HelpModal from './components/HelpModal';
import ResetWarningModal from './components/ResetWarningModal';
import ErrorBanner from './components/ErrorBanner';
import Footer from './components/Footer';
import { useDigitization } from './hooks/useDigitization';
import { ModelType, LayoutMode } from './types';
import { generateHtmlDocument } from './utils/exportHtml';
import { generateMarkdownDocument } from './utils/exportMarkdown';
import { generateEpubDocument } from './utils/exportEpub';

const App: React.FC = () => {
  const {
    state,
    originalFiles,
    handleFileUpload,
    reprocessPage,
    saveEditedFigure,
    incrementUsage,
    setModel,
    reset
  } = useDigitization();

  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('paginated');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [editingFigure, setEditingFigure] = useState<{ id: string, src: string, originalSrc: string, alt: string, caption: string, pageIndex: number } | null>(null);

  const handleReset = () => {
    if (state.results.length > 0 && !hasDownloaded) {
      setShowResetWarning(true);
    } else {
      performReset();
    }
  };

  const performReset = () => {
    reset();
    setActiveTab(0);
    setViewMode('preview');
    setLayoutMode('paginated');
    setShowAuditReport(false);
    setEditingFigure(null);
    setHasDownloaded(false);
    setShowResetWarning(false);
  };

  const handleEditFigure = (pageIndex: number, figureId: string) => {
    const page = state.results[pageIndex];
    const figure = page.figures.find(f => f.id === figureId);
    if (figure) {
      setEditingFigure({ 
        id: figureId,
        pageIndex, 
        src: figure.currentSrc,
        originalSrc: figure.originalSrc,
        alt: figure.alt,
        caption: figure.caption
      });
    }
  };

  const handleDownloadHtml = () => {
    const originalFileName = originalFiles && originalFiles.length > 0 ? originalFiles[0].name : '';
    const template = generateHtmlDocument(state.results, originalFileName, layoutMode);
    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseFileName = originalFileName ? originalFileName.replace(/\.[^/.]+$/, "") : `math_notes_${new Date().getTime()}`;
    link.download = `${baseFileName}-acc.html`;
    link.click();
    URL.revokeObjectURL(url);
    setHasDownloaded(true);
  };

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdownDocument(state.results, originalFile?.name || '');
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseFileName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, "") : `math_notes_${new Date().getTime()}`;
    link.download = `${baseFileName}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setHasDownloaded(true);
  };

  const handleDownloadEpub = async () => {
    const blob = await generateEpubDocument(state.results, originalFile?.name || '');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseFileName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, "") : `math_notes_${new Date().getTime()}`;
    link.download = `${baseFileName}.epub`;
    link.click();
    URL.revokeObjectURL(url);
    setHasDownloaded(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {(state.results.length > 0 || state.isProcessing) && (
        <Header onShowDocs={() => setShowHelp(true)} />
      )}
      
      {state.isProcessing && (
        <ProcessingOverlay 
          progress={state.progress} 
        />
      )}

      {showAuditReport && (
        <AccessibilityAuditReport 
          results={state.results}
          activeTab={activeTab}
          state={state}
          onClose={() => setShowAuditReport(false)}
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}

      {showResetWarning && (
        <ResetWarningModal 
          onCancel={() => setShowResetWarning(false)}
          onConfirm={performReset}
        />
      )}

      <AnimatePresence>
        {editingFigure && (
          <ImageEditor 
            figure={editingFigure}
            onSave={(update) => {
              saveEditedFigure(update);
              setEditingFigure(null);
            }}
            onClose={() => setEditingFigure(null)}
            onApiCall={incrementUsage}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8" role="main">
        {state.error && (
          <ErrorBanner 
            error={state.error} 
            onClear={() => reset()} 
          />
        )}

        {!state.results.length && !state.isProcessing ? (
          <>
            <Dashboard 
              onFileUpload={(files) => handleFileUpload(files, 'faithful', state.selectedModel)} 
              isProcessing={state.isProcessing} 
              onShowDocs={() => setShowHelp(true)}
            />
            <Footer 
              selectedModel={state.selectedModel} 
              onModelChange={setModel} 
            />
          </>
        ) : (
          <ResultsView 
            results={state.results}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onEditFigure={handleEditFigure}
            onDownloadHtml={handleDownloadHtml}
            onDownloadMarkdown={handleDownloadMarkdown}
            onDownloadEpub={handleDownloadEpub}
            onShowAudit={() => setShowAuditReport(true)}
            onReset={handleReset}
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            onReprocessPage={reprocessPage}
            onReprocessAll={() => originalFiles && originalFiles.length > 0 && handleFileUpload(originalFiles, 'faithful', 'gemini-pro-latest')}
            isProcessing={state.isProcessing}
          />
        )}
      </main>

      <style>{`
        @media print {
          body, html, #root, main, .bg-\\[\\#FDFBF7\\] { background-color: white !important; }
          header, aside, button, label, .border-b { display: none !important; }
          main, .flex-1, .w-full { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; }
          article { border: none !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; page-break-after: always; }
          .math-content { font-size: 12pt; }
        }
      `}</style>
    </div>
  );
};

export default App;
