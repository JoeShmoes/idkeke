import { YooptaPlugin, YooptaEditor } from '@yoopta/editor';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, ArrowUp, X, RotateCcw, ListPlus, ThumbsUp, ThumbsDown } from 'lucide-react';

export const AiTool = {
  render: ({ editor, onClose }: { editor: YooptaEditor, onClose: () => void }) => {
    const [state, setState] = useState<'prompt' | 'thinking' | 'result'>('prompt');
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        if (state === 'prompt' || state === 'result') {
          inputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }, [state]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSubmit = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!query.trim() && state === 'prompt') return;
      
      setState('thinking');
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setResponse(`2+2 equals 4.\n\nHere is your requested output reflecting the intelligence behind Nexaris: "${query}"`);
      setState('result');
      setQuery('');
    };

    const handleInsert = () => {
      editor.focus();
      import('@yoopta/editor').then(({ generateId }) => {
        editor.insertBlock({ 
          type: 'Paragraph', 
          value: [{ id: generateId(), type: 'Paragraph', children: [{ text: response }] }] 
        });
        onClose();
      });
    };

    const renderContent = () => {
      if (state === 'thinking') {
        return (
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1f1f1f] w-full max-w-2xl">
            <div className="flex items-center gap-2 text-zinc-500 text-[13px] font-medium tracking-tight">
              Thinking
              <span className="flex gap-1.5 ml-1">
                <motion.div className="w-[5px] h-[5px] rounded-full bg-amber-400" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} />
                <motion.div className="w-[5px] h-[5px] rounded-full bg-red-400" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                <motion.div className="w-[5px] h-[5px] rounded-full bg-blue-500" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-sm text-zinc-400 hover:text-zinc-600 transition-colors">
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        );
      }

      return (
        <div className="flex flex-col bg-white dark:bg-[#252525] w-full max-w-2xl">
          {state === 'prompt' && (
            <div className="px-4 pt-4 pb-2 text-[15px] text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed tracking-tight">
              Ask me anything, I'll try to find an answer in pages and connected apps you have access to.
            </div>
          )}

          {state === 'result' && (
            <div className="px-4 py-4 text-[15px] text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium tracking-tight whitespace-pre-wrap">
              {response}
            </div>
          )}

          <div className="px-3 py-2.5 flex items-center gap-3">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask AI anything..."
              className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-zinc-400/80 px-1 py-1"
            />
            {/* Action Bar from Images */}
            <div className="flex items-center gap-2 text-zinc-400 shrink-0">
              {state === 'prompt' && (
                <div className="flex items-center gap-1.5 text-xs font-medium bg-zinc-50 dark:bg-black/20 text-zinc-500 px-2 py-1 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors border border-black/5 dark:border-white/5">
                  <span className="bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-[3px] font-bold tracking-tighter">N</span>
                  All sources
                </div>
              )}
              {state === 'result' && (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-medium bg-transparent text-zinc-500 pl-1 pr-0 py-1 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                    <span className="bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-[3px] font-bold tracking-tighter">N</span>
                    All sources <span className="text-[9px] opacity-70 ml-0.5 mt-0.5">▼</span>
                  </div>
                  <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors font-medium text-lg px-0.5">@</button>
                  <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"><ThumbsUp className="w-4 h-4" /></button>
                  <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 pr-2"><ThumbsDown className="w-4 h-4" /></button>
                </>
              )}
              {state === 'prompt' && <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium text-lg px-0.5 transition-colors">@</button>}
              <button 
                onClick={handleSubmit} 
                disabled={!query.trim() && state === 'prompt'}
                className={`w-6 h-6 ml-1 rounded-full flex items-center justify-center transition-all shadow-sm ${query.trim() || state === 'result' ? 'bg-zinc-300 dark:bg-zinc-600 text-white hover:bg-zinc-400 cursor-pointer' : 'bg-zinc-100 dark:bg-white/10 text-zinc-300 dark:text-white/30 cursor-default'}`}
              >
                <ArrowUp className="w-3.5 h-3.5" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div 
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="flex gap-4 items-start w-[800px] justify-center font-sans" onClick={e => e.stopPropagation()}>
          {/* Avatar floating left */}
          <div className="w-[34px] h-[34px] mt-1.5 rounded-full bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-sm flex items-center justify-center shrink-0">
            <img src="/Nexaris meida bg trans.png" alt="Nexaris AI" className="w-[18px] h-[18px] object-contain" />
          </div>

          <div className="flex flex-col gap-2 relative flex-1">
            {/* Main Input Box */}
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white dark:bg-[#252525] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-black/10 dark:border-white/10 rounded-xl overflow-hidden flex flex-col w-full max-w-2xl"
            >
              {renderContent()}
            </motion.div>

            {/* Result Action Dropdown floating below */}
            <AnimatePresence>
              {state === 'result' && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="w-[280px] bg-white dark:bg-[#252525] shadow-xl border border-black/10 dark:border-white/10 rounded-xl overflow-hidden flex flex-col p-1.5 absolute top-[100%] mt-2"
                >
                  <button onClick={handleInsert} className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors w-full text-left font-medium tracking-tight">
                    <ListPlus className="w-4 h-4 opacity-70" /> Insert below
                  </button>
                  <button onClick={() => { setState('prompt'); setQuery(''); }} className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors w-full text-left font-medium tracking-tight">
                    <RotateCcw className="w-4 h-4 opacity-70" /> Try again
                  </button>
                  <div className="h-px bg-black/5 dark:bg-white/5 my-1 w-full" />
                  <button onClick={onClose} className="flex items-center justify-between px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md transition-colors w-full text-left tracking-tight">
                    <span className="flex items-center gap-2.5 font-medium"><X className="w-4 h-4 opacity-70" /> Close</span>
                    <span className="text-[11px] text-zinc-400 font-medium">Escape</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  },
};

const AiPlugin = new YooptaPlugin({
  type: 'AiTool',
  elements: {
    'ai-block': {
      render: () => null,
      props: { nodeType: 'void' },
    },
  },
  tools: {
    ai: AiTool,
  },
  options: {
    display: {
      title: 'Ask AI',
      description: 'Get answers from AI',
      icon: <img src="/Nexaris meida bg trans.png" alt="AI" className="w-4 h-4 object-contain" />,
    },
    shortcuts: ['ai'],
  },
});

export default AiPlugin;
