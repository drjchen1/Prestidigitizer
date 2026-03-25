
import React from 'react';
import { motion } from 'framer-motion';

interface ProcessingOverlayProps {
  progress: number;
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

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ progress }) => {
  const isDone = progress >= 100;

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
        className="relative z-10 bg-white/40 backdrop-blur-3xl rounded-[3rem] p-12 max-w-md w-full border border-white/20 shadow-2xl"
      >
        <FloatingMath />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full max-w-[320px]">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200/50">
              <motion.div 
                className="h-full bg-purdue"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="mt-4 flex justify-between items-center px-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                {isDone ? 'Complete' : 'Magic in progress'}
              </span>
              <span className="text-sm font-black text-purdue">{Math.round(progress)}%</span>
            </div>
          </div>
          
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <h2 className="text-4xl font-black tracking-tighter text-purdue">Done!</h2>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingOverlay;
