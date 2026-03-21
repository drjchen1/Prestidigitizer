
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessingOverlayProps {
  progress: number;
  status: string;
}

const FloatingMath = () => {
  const symbols = ['∑', '∫', 'π', '∞', '√', 'Δ', 'Ω', 'θ', 'λ', 'μ'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      {symbols.map((symbol, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            rotate: Math.random() * 360,
            scale: 0.5 + Math.random()
          }}
          animate={{ 
            y: [null, '-10%', '110%'],
            rotate: [null, 360],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 10 + Math.random() * 20, 
            repeat: Infinity, 
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute text-purdue font-serif text-2xl"
        >
          {symbol}
        </motion.div>
      ))}
    </div>
  );
};

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress, status }) => {
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Immersive background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purdue/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-900/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 bg-white/80 backdrop-blur-3xl rounded-[3rem] p-12 max-w-md w-full border border-slate-200 shadow-2xl"
      >
        <FloatingMath />
        
        <div className="relative z-10">
          <div className="mb-8 flex justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Progress Ring SVG */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-100"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="text-purdue"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: progress / 100 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </svg>

              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-40 h-40 border border-slate-100 rounded-full border-dashed flex items-center justify-center"
              />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div 
                  key={Math.round(progress)}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-baseline"
                >
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">
                    {Math.round(progress)}
                  </span>
                  <span className="text-xl font-black text-purdue ml-1">%</span>
                </motion.div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Processing</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Digitizing
            </h2>
            <div className="h-12 overflow-hidden flex justify-center items-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={status}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="text-slate-500 font-bold text-[10px] uppercase tracking-widest leading-relaxed max-w-[280px]"
                >
                  {status}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingOverlay;
