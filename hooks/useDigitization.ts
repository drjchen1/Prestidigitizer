
import { useState, useEffect, useCallback } from 'react';
import { AppState, ConversionResult, LanguageLevel, ModelType, DocumentType, TranscriptionStyle } from '../types';
import { pdfToImageData } from '../services/pdfService';
import { convertBatchToHtml } from '../services/geminiService';
import { runAccessibilityAudit } from '../utils/accessibility';
import { cropImage } from '../utils/image';
import { cleanAltText } from '../utils/dom';

import { optimizeImageForGemini } from '../utils/imageOptimizer';

export const useDigitization = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    progress: 0,
    results: [],
    error: null,
    statusMessage: 'Waiting for upload...',
    sessionRequestCount: 0,
    dailyRequestCount: 0,
    selectedModel: 'gemini-3-flash-preview',
    documentType: 'handwritten',
    transcriptionStyle: 'verbatim'
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [pageMapping, setPageMapping] = useState<{fileIndex: number, localPageIndex: number}[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('qed_daily_usage');
    if (stored) {
      const { date, count } = JSON.parse(stored);
      if (date === today) {
        setState(prev => ({ ...prev, dailyRequestCount: count || 0 }));
      } else {
        localStorage.setItem('qed_daily_usage', JSON.stringify({ date: today, count: 0 }));
      }
    } else {
      localStorage.setItem('qed_daily_usage', JSON.stringify({ date: today, count: 0 }));
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (state.isProcessing) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [state.isProcessing]);

  const incrementUsage = useCallback(() => {
    setState(prev => {
      const newDailyCount = prev.dailyRequestCount + 1;
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('qed_daily_usage', JSON.stringify({ date: today, count: newDailyCount }));
      return {
        ...prev,
        sessionRequestCount: prev.sessionRequestCount + 1,
        dailyRequestCount: newDailyCount
      };
    });
  }, []);

  const handleFileUpload = async (files: File[], languageLevel: LanguageLevel = 'faithful', model: ModelType = 'gemini-3-flash-preview', docType: DocumentType = 'handwritten', transcriptionStyle: TranscriptionStyle = 'verbatim') => {
    if (!files || files.length === 0) return;

    setOriginalFiles(files);
    const startTime = Date.now();
    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      results: [],
      error: null,
      statusMessage: 'Reading files...'
    }));

    try {
      let pageData: any[] = [];
      const mapping: {fileIndex: number, localPageIndex: number}[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const data = await pdfToImageData(files[i], true);
        pageData = pageData.concat(data);
        for (let j = 0; j < data.length; j++) {
          mapping.push({ fileIndex: i, localPageIndex: j });
        }
      }
      setPageMapping(mapping);
      
      const totalPages = pageData.length;
      
      setState(prev => ({ ...prev, progress: 10, statusMessage: 'Analyzing document structure...' }));
      
      const BATCH_SIZE = 2;
      const CONCURRENCY_LIMIT = 2;
      const results: ConversionResult[] = new Array(totalPages);
      let completedPages = 0;
      
      const progressPerPage = 90 / totalPages;
      const OPTIMIZATION_WEIGHT = 0.2;
      const AI_WEIGHT = 0.6;
      const FIGURE_WEIGHT = 0.2;

      const processBatch = async (batchIndices: number[]) => {
        try {
          setState(prev => ({ 
            ...prev, 
            statusMessage: `Optimizing images for Pages ${batchIndices.map(i => i + 1).join(', ')}...`,
          }));

          const batchImages = await Promise.all(batchIndices.map(async idx => {
            const optimized = await optimizeImageForGemini(pageData[idx].base64);
            return {
              base64: optimized,
              pageNumber: idx + 1
            };
          }));

          setState(prev => ({ 
            ...prev, 
            progress: Math.min(99, prev.progress + (batchIndices.length * progressPerPage * OPTIMIZATION_WEIGHT)),
            statusMessage: `Digitizing Pages ${batchIndices.map(i => i + 1).join(', ')}...`,
          }));

          const batchResponses = await convertBatchToHtml(batchImages, model, docType, transcriptionStyle);
          incrementUsage();

          setState(prev => ({ 
            ...prev, 
            progress: Math.min(99, prev.progress + (batchIndices.length * progressPerPage * AI_WEIGHT)),
            statusMessage: `Processing mathematical figures for Pages ${batchIndices.map(i => i + 1).join(', ')}...`,
          }));

          for (let k = 0; k < batchIndices.length; k++) {
            const i = batchIndices[k];
            const geminiResponse = batchResponses.pages[k];
            
            if (!geminiResponse) continue;

            let finalHtml = geminiResponse.html;
            
            const figureResults = geminiResponse.figures.map((fig) => {
              const screenshotBase64 = cropImage(pageData[i].canvas, fig);
              return {
                id: fig.id,
                originalSrc: screenshotBase64,
                currentSrc: screenshotBase64,
                alt: fig.alt,
                caption: fig.caption || "Figure"
              };
            });
            
            figureResults.forEach(figResult => {
              const imgTagRegex = new RegExp(`(?:<p[^>]*>\\s*)?<img[^>]*id=["']${figResult.id}["'][^>]*>(?:\\s*</p>)?`, 'g');
              const cleanAlt = cleanAltText(figResult.alt);
              const displayCaption = figResult.caption || "Figure";

              const figureHtml = `
                <figure class="my-8 relative overflow-x-auto rounded-2xl shadow-sm border border-slate-200 bg-white flex flex-col items-center group/fig min-w-0 box-border max-w-full" role="group" aria-label="Visual figure: ${cleanAlt}">
                  <img src="${figResult.currentSrc}" alt="${cleanAlt}" class="max-w-full h-auto" data-figure-id="${figResult.id}">
                  <button class="edit-figure-btn absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg opacity-0 group-hover/fig:opacity-100 transition-all hover:bg-purdue hover:text-black" data-figure-id="${figResult.id}" title="Edit Figure">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>
                  <figcaption class="p-4 w-full bg-slate-50 border-t border-slate-100 text-sm text-slate-700 font-sans text-center italic leading-relaxed" aria-hidden="true">
                    Figure: ${displayCaption}
                  </figcaption>
                </figure>
              `;
              finalHtml = finalHtml.replace(imgTagRegex, figureHtml);
            });

            const audit = runAccessibilityAudit(finalHtml);

            results[i] = { 
              html: finalHtml, 
              pageNumber: i + 1,
              width: pageData[i].width,
              height: pageData[i].height,
              audit,
              figures: figureResults
            };

            completedPages++;
            setState(prev => ({
              ...prev,
              progress: Math.min(99, prev.progress + (progressPerPage * FIGURE_WEIGHT)),
              statusMessage: `Completed ${completedPages} of ${totalPages} pages...`,
              results: results.filter(r => r !== undefined).sort((a, b) => a.pageNumber - b.pageNumber)
            }));
          }
        } catch (err: any) {
          console.error(`Error processing batch ${batchIndices}:`, err);
          throw err;
        }
      };

      const batches = [];
      for (let i = 0; i < totalPages; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && i + j < totalPages; j++) {
          batch.push(i + j);
        }
        batches.push(batch);
      }

      const pool = [];
      for (const batch of batches) {
        const p = processBatch(batch);
        pool.push(p);
        if (pool.length >= CONCURRENCY_LIMIT) {
          await Promise.race(pool);
        }
      }
      await Promise.all(pool);

      const totalTime = Math.floor((Date.now() - startTime) / 1000);

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        statusMessage: 'Digitization Complete! Your accessible document is ready.',
        progress: 100,
        totalTime
      }));
    } catch (err: any) {
      let userMessage = "An unexpected error occurred during digitization.";
      let workaround = "Please try refreshing the page or uploading a smaller file.";
      
      const errMsg = err.message?.toLowerCase() || "";
      
      if (errMsg.includes("quota") || errMsg.includes("rate limit") || errMsg.includes("429")) {
        userMessage = "High Traffic Detected (Rate Limit).";
        workaround = "We're processing many requests right now. Please wait 60 seconds and try again.";
      } else if (errMsg.includes("safety") || errMsg.includes("blocked")) {
        userMessage = "Content Restricted by Safety Filter.";
        workaround = "The AI was unable to process this page due to safety guidelines. Please ensure the content is strictly educational and clear.";
      } else if (errMsg.includes("output") || errMsg.includes("token") || errMsg.includes("cut off")) {
        userMessage = "Page Too Complex to Process.";
        workaround = "This page has a lot of content. Try splitting it into two separate images or scans for better results.";
      } else if (errMsg.includes("network") || errMsg.includes("fetch")) {
        userMessage = "Network Connection Issue.";
        workaround = "Please check your internet connection and try again.";
      }

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: `${userMessage}|${workaround}`, 
        statusMessage: 'Error' 
      }));
    }
  };

  const reprocessPage = async (pageIndex: number, model: ModelType = 'gemini-3.1-pro-preview') => {
    if (!originalFiles || originalFiles.length === 0) return;
    const mapping = pageMapping[pageIndex];
    if (!mapping) return;

    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      statusMessage: `Reprocessing Page ${pageIndex + 1} with Pro model...`
    }));

    try {
      // Extract just the one page we need
      const file = originalFiles[mapping.fileIndex];
      const pageData = await pdfToImageData(file, true, [mapping.localPageIndex + 1]);
      if (!pageData || pageData.length === 0) throw new Error("Could not extract page data");

      setState(prev => ({ ...prev, progress: 20 }));

      const optimized = await optimizeImageForGemini(pageData[0].base64);
      const batchImages = [{ base64: optimized, pageNumber: pageIndex + 1 }];

      setState(prev => ({ ...prev, progress: 40 }));

      const batchResponses = await convertBatchToHtml(batchImages, model, state.documentType, state.transcriptionStyle);
      incrementUsage();

      setState(prev => ({ ...prev, progress: 80 }));

      const geminiResponse = batchResponses.pages[0];
      if (!geminiResponse) throw new Error("No response from AI");

      let finalHtml = geminiResponse.html;
      
      const figureResults = geminiResponse.figures.map((fig) => {
        const screenshotBase64 = cropImage(pageData[0].canvas, fig);
        return {
          id: fig.id,
          originalSrc: screenshotBase64,
          currentSrc: screenshotBase64,
          alt: fig.alt,
          caption: fig.caption || "Figure"
        };
      });
      
      figureResults.forEach(figResult => {
        const imgTagRegex = new RegExp(`(?:<p[^>]*>\\s*)?<img[^>]*id=["']${figResult.id}["'][^>]*>(?:\\s*</p>)?`, 'g');
        const cleanAlt = cleanAltText(figResult.alt);
        const displayCaption = figResult.caption || "Figure";

        const figureHtml = `
          <figure class="my-8 relative overflow-x-auto rounded-2xl shadow-sm border border-slate-200 bg-white flex flex-col items-center group/fig min-w-0 box-border max-w-full" role="group" aria-label="Visual figure: ${cleanAlt}">
            <img src="${figResult.currentSrc}" alt="${cleanAlt}" class="max-w-full h-auto" data-figure-id="${figResult.id}">
            <button class="edit-figure-btn absolute top-2 right-2 p-2 bg-white/90 backdrop-blur shadow-lg rounded-lg opacity-0 group-hover/fig:opacity-100 transition-all hover:bg-purdue hover:text-black" data-figure-id="${figResult.id}" title="Edit Figure">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <figcaption class="p-4 w-full bg-slate-50 border-t border-slate-100 text-sm text-slate-700 font-sans text-center italic leading-relaxed" aria-hidden="true">
              Figure: ${displayCaption}
            </figcaption>
          </figure>
        `;
        finalHtml = finalHtml.replace(imgTagRegex, figureHtml);
      });

      const audit = runAccessibilityAudit(finalHtml);

      setState(prev => {
        const newResults = [...prev.results];
        const existingIndex = newResults.findIndex(r => r.pageNumber === pageIndex + 1);
        
        const newPageResult = { 
          html: finalHtml, 
          pageNumber: pageIndex + 1,
          width: pageData[0].width,
          height: pageData[0].height,
          audit,
          figures: figureResults
        };

        if (existingIndex >= 0) {
          newResults[existingIndex] = newPageResult;
        } else {
          newResults.push(newPageResult);
          newResults.sort((a, b) => a.pageNumber - b.pageNumber);
        }

        return {
          ...prev,
          isProcessing: false,
          progress: 100,
          statusMessage: 'Reprocessing Complete!',
          results: newResults
        };
      });

    } catch (err: any) {
      console.error("Error reprocessing page:", err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        statusMessage: 'Error reprocessing page',
        error: `Failed to reprocess page ${pageIndex + 1}.|Please try again.`
      }));
    }
  };

  const saveEditedFigure = (update: { figureId: string, pageIndex: number, newSrc: string, newAlt?: string, newCaption?: string }) => {
    setState(prev => {
      const newResults = [...prev.results];
      const { figureId, pageIndex, newSrc, newAlt, newCaption } = update;
      
      const page = { ...newResults[pageIndex] };
      const figureIndex = page.figures.findIndex(f => f.id === figureId);
      
      if (figureIndex !== -1) {
        const newFigures = [...page.figures];
        const updatedFig = { ...newFigures[figureIndex], currentSrc: newSrc };
        if (newAlt !== undefined) updatedFig.alt = newAlt;
        if (newCaption !== undefined) updatedFig.caption = newCaption;
        newFigures[figureIndex] = updatedFig;
        page.figures = newFigures;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(page.html, 'text/html');
        const img = doc.querySelector(`img[data-figure-id="${figureId}"]`);
        const figure = img?.closest('figure');
        
        if (img && figure) {
          const cleanAlt = cleanAltText(newAlt || updatedFig.alt);
          img.setAttribute('src', newSrc);
          img.setAttribute('alt', cleanAlt);
          figure.setAttribute('aria-label', `Visual figure: ${cleanAlt}`);
          
          let figcaption = figure.querySelector('figcaption');
          if (!figcaption) {
            figcaption = doc.createElement('figcaption');
            figure.appendChild(figcaption);
          }
          figcaption.innerHTML = `Figure: ${newCaption || updatedFig.caption || "Figure"}`;
          
          page.html = doc.body.innerHTML;
        }
        newResults[pageIndex] = page;
      }
      
      return { ...prev, results: newResults };
    });
  };

  const updatePageHtml = useCallback((pageIndex: number, newHtml: string) => {
    setState(prev => {
      const newResults = [...prev.results];
      if (newResults[pageIndex]) {
        newResults[pageIndex] = {
          ...newResults[pageIndex],
          html: newHtml
        };
      }
      return { ...prev, results: newResults };
    });
  }, []);

  const setModel = useCallback((model: ModelType) => {
    setState(prev => ({ ...prev, selectedModel: model }));
  }, []);

  const setDocumentType = useCallback((docType: DocumentType) => {
    setState(prev => ({ ...prev, documentType: docType }));
  }, []);

  const setTranscriptionStyle = useCallback((style: TranscriptionStyle) => {
    setState(prev => ({ ...prev, transcriptionStyle: style }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      isProcessing: false,
      progress: 0,
      results: [],
      error: null,
      statusMessage: 'Waiting for upload...',
      sessionRequestCount: 0,
      dailyRequestCount: prev.dailyRequestCount, // Keep daily count
      selectedModel: prev.selectedModel, // Keep selected model
      documentType: prev.documentType,
      transcriptionStyle: prev.transcriptionStyle
    }));
    setOriginalFiles([]);
    setPageMapping([]);
    setElapsedTime(0);
  }, []);

  return {
    state,
    elapsedTime,
    originalFiles,
    handleFileUpload,
    reprocessPage,
    saveEditedFigure,
    updatePageHtml,
    incrementUsage,
    setModel,
    setDocumentType,
    setTranscriptionStyle,
    reset
  };
};
