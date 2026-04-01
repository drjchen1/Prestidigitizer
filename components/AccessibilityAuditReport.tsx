
import React from 'react';
import { ConversionResult, AppState } from '../types';

interface AccessibilityAuditReportProps {
  results: ConversionResult[];
  activeTab: number;
  state: AppState;
  onClose: () => void;
}

const AccessibilityAuditReport: React.FC<AccessibilityAuditReportProps> = ({ results, activeTab, state, onClose }) => {
  const activeAudit = results[activeTab]?.audit;
  const failingChecks = activeAudit?.checks.filter(check => !check.passed).slice(0, 3) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-10 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purdue text-black rounded-2xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Accessibility Audit</h2>
              <p className="text-slate-500 font-medium">WCAG 2.2 AA Compliance Report for Page {activeTab + 1}</p>
              {state.totalTime && (
                <div className="mt-2 space-y-1">
                  <p className="text-purdue font-bold text-xs uppercase tracking-widest">Total Processing Time: {state.totalTime}s</p>
                  <div className="flex gap-4">
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      {state.sessionRequestCount} Requests ({Math.round((state.sessionRequestCount / (state.totalTime / 60)) * 10) / 10} RPM)
                    </p>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                      {state.dailyRequestCount} Daily Requests
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-8">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Compliance Score</span>
                <span className={`text-sm font-black ${activeAudit?.score === 100 ? 'text-slate-600' : 'text-amber-600'}`}>{activeAudit?.score}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${activeAudit?.score === 100 ? 'bg-slate-500' : 'bg-amber-500'}`}
                  style={{ width: `${activeAudit?.score || 0}%` }}
                ></div>
              </div>
            </div>
            <div className={`px-6 py-3 rounded-2xl font-black text-lg ${activeAudit?.score === 100 ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'}`}>
              {activeAudit?.score === 100 ? 'EXCELLENT' : 'IMPROVEMENT NEEDED'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8">
          {failingChecks.length > 0 && (
            <section className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100">
              <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Top Fixes Needed
              </h3>
              <div className="grid gap-4">
                {failingChecks.map((check, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-white/50 p-4 rounded-2xl border border-amber-200/50">
                    <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0 text-[10px] font-black">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{check.title}</h4>
                      <p className="text-xs text-amber-800 mt-1 font-medium leading-relaxed">
                        <span className="font-black uppercase text-[9px] mr-1 opacity-70">Quick Fix:</span> 
                        {check.suggestion || "Review and update the content structure."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Detailed Checks</h3>
            <div className="grid gap-4">
              {activeAudit?.checks.map((check, idx) => (
                <div key={idx} className={`p-6 rounded-3xl border ${check.passed ? 'bg-slate-50/50 border-slate-200' : 'bg-amber-50/30 border-amber-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${check.passed ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-600'}`}>
                        {check.passed ? (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 mb-1">{check.title}</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">{check.description}</p>
                        {!check.passed && check.suggestion && (
                          <div className="mt-4 p-4 bg-white border border-amber-200 rounded-2xl">
                            <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">How to fix</p>
                            <p className="text-sm text-slate-700 font-medium">{check.suggestion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${check.passed ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                      {check.passed ? 'Passed' : 'Failed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">About WCAG 2.2 AA</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              Web Content Accessibility Guidelines (WCAG) 2.2 defines how to make Web content more accessible to people with disabilities. AA compliance is the standard level of accessibility for most commercial and government websites.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-100">
                <h5 className="text-xs font-bold text-slate-900 mb-1">Perceivable</h5>
                <p className="text-[11px] text-slate-400">Information and UI components must be presentable to users in ways they can perceive.</p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-100">
                <h5 className="text-xs font-bold text-slate-900 mb-1">Operable</h5>
                <p className="text-[11px] text-slate-400">UI components and navigation must be operable by all users.</p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityAuditReport;
