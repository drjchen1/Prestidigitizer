
export type LanguageLevel = 'faithful' | 'natural' | 'fleshed_out';
export type ModelType = 'gemini-3-flash-preview' | 'gemini-3.1-flash-lite-preview' | 'gemini-3.1-pro-preview';
export type LayoutMode = 'paginated' | 'continuous';
export type DocumentType = 'handwritten' | 'printed';
export type TranscriptionStyle = 'verbatim' | 'audio_optimized';

export interface Figure {
  id: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  alt: string;
  caption: string;
}

export interface GeminiPageResponse {
  html: string;
  figures: Figure[];
}

export interface BatchResponse {
  pages: GeminiPageResponse[];
  tokenCount: number;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export interface AccessibilityAudit {
  score: number;
  checks: {
    title: string;
    passed: boolean;
    description: string;
    suggestion?: string;
  }[];
}

export interface FigureResult {
  id: string;
  originalSrc: string;
  currentSrc: string;
  alt: string;
  caption: string;
}

export interface ConversionResult {
  html: string;
  pageNumber: number;
  width: number;
  height: number;
  audit?: AccessibilityAudit;
  figures: FigureResult[];
}

export interface AppState {
  isProcessing: boolean;
  progress: number;
  results: ConversionResult[];
  error: string | null;
  statusMessage: string;
  totalTime?: number;
  sessionRequestCount: number;
  dailyRequestCount: number;
  selectedModel: ModelType;
  documentType: DocumentType;
  transcriptionStyle: TranscriptionStyle;
}

declare global {
  const __BUILD_DATE__: string;
  interface Window {
    MathJax: {
      typesetPromise: (elements: any[]) => Promise<void>;
    };
    pdfjsLib: any;
  }
}
