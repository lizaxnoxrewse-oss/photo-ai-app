
import React from 'react';
import { PresetBlock } from '../types';

interface BlockEditorProps {
  block: PresetBlock;
  onUpdate: (id: string, updates: Partial<PresetBlock>) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ block, onUpdate }) => {
  return (
    <div className={`p-5 sm:p-6 border border-zinc-800 rounded-2xl transition-all duration-300 ${block.isActive ? 'bg-zinc-900 border-zinc-700 shadow-xl' : 'bg-zinc-950/50 opacity-40 grayscale pointer-events-none'}`}>
      <div className="flex items-center justify-between mb-5 pointer-events-auto">
        <div className="flex items-center gap-3">
           <div className={`w-1.5 h-3.5 rounded-full transition-colors duration-500 ${block.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-800'}`}></div>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {block.title}
          </h3>
        </div>
        <button 
          onClick={() => onUpdate(block.id, { isActive: !block.isActive })}
          className={`w-10 h-5 rounded-full relative transition-all duration-300 active:scale-90 ${block.isActive ? 'bg-emerald-600' : 'bg-zinc-800'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${block.isActive ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
      
      {block.isActive && (
        <textarea
          value={block.content}
          onChange={(e) => onUpdate(block.id, { content: e.target.value })}
          className="w-full bg-zinc-950/80 text-zinc-300 text-xs p-4 rounded-xl border border-zinc-800 focus:border-emerald-500/50 outline-none resize-none h-32 leading-relaxed font-medium transition-all"
          spellCheck={false}
        />
      )}
    </div>
  );
};
