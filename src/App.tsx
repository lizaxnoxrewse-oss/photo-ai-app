
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage, assembleFinalPrompt } from './geminiService';
import { PhotoPreset, PresetBlock, CustomTextConfig } from './types';
import { BlockEditor } from './components/BlockEditor';

const ASPECT_RATIOS = ["1:1 (Квадрат)", "4:5 (Портрет)", "2:3 (Классика)", "9:16 (Stories)", "16:9 (Кино)", "3:2 (Пейзаж)"];
const TEXT_STYLES = ["Минимализм", "Футуризм", "Неон", "Журнальный", "Винтаж", "3D Глянец", "Грубый шрифт"];

const App: React.FC = () => {
  const [preset, setPreset] = useState<PhotoPreset | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState<string | null>(null);
  const [isAssembling, setIsAssembling] = useState(false);
  const [library, setLibrary] = useState<PhotoPreset[]>([]);
  
  const [styleOverride, setStyleOverride] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [textConfig, setTextConfig] = useState<CustomTextConfig>({ text: '', style: TEXT_STYLES[0] });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('photo_presets_library_v2');
    if (saved) {
      try {
        setLibrary(JSON.parse(saved));
      } catch (e) {
        console.error("Ошибка загрузки библиотеки", e);
      }
    }
  }, []);

  const saveToLibrary = () => {
    if (!preset) return;
    const fullPresetToSave: PhotoPreset = {
      ...preset,
      styleOverride,
      aspectRatio,
      textConfig,
      timestamp: Date.now(),
      id: preset.id || Math.random().toString(36).substr(2, 9)
    };

    const updatedLibrary = [fullPresetToSave, ...library.filter(p => p.id !== fullPresetToSave.id)].slice(0, 30);
    setLibrary(updatedLibrary);
    localStorage.setItem('photo_presets_library_v2', JSON.stringify(updatedLibrary));
    alert("Пресет сохранен в вашу библиотеку!");
  };

  const loadFromLibrary = (item: PhotoPreset) => {
    setPreset(item);
    setFinalPrompt(null);
    setStyleOverride(item.styleOverride || '');
    setAspectRatio(item.aspectRatio || ASPECT_RATIOS[0]);
    setTextConfig(item.textConfig || { text: '', style: TEXT_STYLES[0] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setFinalPrompt(null);
    setStyleOverride('');
    setTextConfig({ text: '', style: TEXT_STYLES[0] });
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const blocks = await analyzeImage(base64);
        setPreset({
          id: Math.random().toString(36).substr(2, 9),
          originalImage: base64,
          blocks: blocks.map((b: any) => ({ ...b, isActive: true })),
          timestamp: Date.now()
        });
      } catch (error) {
        alert("Ошибка анализа изображения.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateBlock = (id: string, updates: Partial<PresetBlock>) => {
    if (!preset) return;
    setPreset({
      ...preset,
      blocks: preset.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
    });
  };

  const handleAssemblePrompt = async () => {
    if (!preset) return;
    setIsAssembling(true);
    try {
      const activeBlocks = preset.blocks.filter(b => b.isActive);
      const prompt = await assembleFinalPrompt(activeBlocks, styleOverride, aspectRatio, textConfig);
      setFinalPrompt(prompt || null);
    } catch (error) {
      alert("Ошибка при сборке промпта.");
    } finally {
      setIsAssembling(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Скопировано!");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 selection:bg-emerald-500/30">
      <header className="flex flex-col gap-6 mb-8 border-b border-zinc-800 pb-8 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase italic">Фотограф AI PRO</h1>
          <p className="text-emerald-500 font-bold text-[10px] sm:text-sm mt-1 uppercase tracking-widest">Lab Pavel Galkin</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a 
            href="https://t.me/photo_video_ai_moscow" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all border border-zinc-800"
          >
            <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.441-.169.575-.403.768-.607.787-.45.041-.791-.297-1.227-.583-.682-.447-1.068-.724-1.731-1.161-.765-.505-.269-.783.167-1.235.114-.118 2.094-1.921 2.132-2.083.005-.021.009-.1.009-.144 0-.044-.017-.065-.053-.082-.036-.017-.089-.011-.127-.002-.054.013-1.042.665-2.94 1.947-.278.191-.53.284-.755.279-.247-.005-.723-.139-1.077-.254-.433-.141-.778-.216-.748-.456.015-.125.187-.253.516-.384 2.022-.881 3.37-1.463 4.045-1.745 1.926-.803 2.327-.942 2.587-.947.057-.001.185.013.268.08.069.056.088.131.096.184.008.053.01.107.009.162z"/></svg>
            Telegram
          </a>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95"
          >
            {isAnalyzing ? 'Анализ...' : 'Загрузить фото'}
          </button>
        </div>
      </header>

      {!preset && !isAnalyzing && (
        <div className="space-y-12 animate-in fade-in duration-500">
          <div className="flex flex-col items-center justify-center min-h-[30vh] border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20 px-6 text-center">
            <svg className="w-12 h-12 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">AI Vision Deconstruction System</p>
            <p className="text-zinc-600 text-sm mt-2 max-w-xs">Загрузите фото, чтобы разобрать его на профессиональные настройки</p>
          </div>

          {library.length > 0 && (
            <div className="animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-6 border-l-2 border-emerald-500 pl-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Библиотека пресетов</h2>
                <span className="text-[9px] text-zinc-600 font-bold">{library.length}/30</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {library.map((item) => (
                  <button 
                    key={item.id} 
                    onClick={() => loadFromLibrary(item)}
                    className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 transition-all hover:border-emerald-500 active:scale-95"
                  >
                    <img src={item.originalImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-left">
                       <p className="text-[8px] text-white font-black uppercase truncate leading-none mb-1">
                        {item.styleOverride || 'Custom Preset'}
                       </p>
                       <p className="text-[6px] text-zinc-500 font-bold uppercase">
                        {new Date(item.timestamp).toLocaleDateString()}
                       </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isAnalyzing && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-emerald-500 border-r-2 border-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-zinc-500 animate-pulse uppercase tracking-[0.3em] text-[10px] font-black mt-8">Decoding visual DNA</p>
        </div>
      )}

      {preset && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8 order-1">
            <div className="bg-zinc-900 p-2 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden group">
              <img src={preset.originalImage} className="w-full rounded-xl object-cover aspect-[4/5]" alt="Original" />
            </div>

            {/* БЛОК: РАЗМЕРЫ */}
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 backdrop-blur-sm">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-widest border-b border-zinc-800 pb-2 italic flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                Размеры и Формат
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map(ratio => (
                  <button 
                    key={ratio} 
                    onClick={() => setAspectRatio(ratio)}
                    className={`text-[9px] font-bold py-3 px-2 rounded-xl border transition-all active:scale-95 ${aspectRatio === ratio ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* БЛОК: ТЕКСТ И ТИПОГРАФИКА */}
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 backdrop-blur-sm space-y-4">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest border-b border-zinc-800 pb-2 italic flex items-center gap-2">
                <div className="w-1 h-1 bg-sky-500 rounded-full"></div>
                Типографика
              </h3>
              <input 
                type="text" 
                placeholder="Текст на фото (напр. PRO PHOTO)"
                value={textConfig.text}
                onChange={(e) => setTextConfig({...textConfig, text: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:border-emerald-500 outline-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5">
                {TEXT_STYLES.map(style => (
                  <button 
                    key={style}
                    onClick={() => setTextConfig({...textConfig, style})}
                    className={`text-[9px] px-3 py-2 rounded-lg border transition-all active:scale-95 ${textConfig.style === style ? 'border-sky-500 text-sky-400 bg-sky-500/10' : 'border-zinc-800 text-zinc-600'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* БЛОК: ЦВЕТОВОЙ ОВЕРЛЕЙ */}
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800 backdrop-blur-sm">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-widest border-b border-zinc-800 pb-2 italic flex items-center gap-2">
                <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                Цветовая схема
              </h3>
              <textarea 
                value={styleOverride}
                onChange={(e) => setStyleOverride(e.target.value)}
                placeholder="Пример: Схема из фильма 'Матрица'..."
                className="w-full bg-zinc-950 text-zinc-300 text-xs p-3 rounded-xl border border-zinc-800 focus:border-amber-500 outline-none h-20 resize-none transition-all"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <button 
                onClick={handleAssemblePrompt} 
                disabled={isAssembling}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl disabled:opacity-50 active:scale-95 transition-all"
              >
                {isAssembling ? 'Processing...' : 'Собрать Промпт'}
              </button>
              <button 
                onClick={saveToLibrary}
                className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all shadow-xl"
              >
                Сохранить пресет
              </button>
            </div>

            {finalPrompt && (
              <div className="bg-emerald-950/20 p-6 rounded-2xl border border-emerald-500/30 animate-in zoom-in-95 duration-500">
                <p className="text-zinc-200 text-xs leading-relaxed italic font-mono mb-6 selection:bg-emerald-500/50">
                  {finalPrompt}
                </p>
                <button 
                  onClick={() => copyToClipboard(finalPrompt)} 
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest transition-all"
                >
                  Копировать промпт
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 space-y-6 order-2 lg:order-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight">Параметры Анализа</h2>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Active Engine</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {preset.blocks.map(block => (
                <BlockEditor key={block.id} block={block} onUpdate={updateBlock} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
