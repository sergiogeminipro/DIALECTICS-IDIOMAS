
import React, { useState, useRef, useEffect } from 'react';
import { Word, Story } from '../types';
import { GeminiService } from '../services/geminiService';
import { Icon, COMMON_EMOJIS } from '../constants';

interface Props {
  words: Word[];
  stories: Story[];
  onSave: (word: Word) => void;
  onSaveStory: (story: Story) => void;
  onBulkSave: (words: Word[]) => void;
  onBulkSaveStories: (stories: Story[]) => void;
  onDeleteWord: (id: string) => void;
  onDeleteStory: (id: string) => void;
  onBack: () => void;
  gemini: GeminiService;
}

type EditorMode = 'list' | 'edit_word' | 'edit_story' | 'import' | 'ai_generator';

const EditorView: React.FC<Props> = ({ 
  words, stories, onSave, onSaveStory, onBulkSave, onBulkSaveStories, 
  onDeleteWord, onDeleteStory, onBack, gemini 
}) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'stories'>('vocab');
  const [mode, setMode] = useState<EditorMode>('list');
  const [editingWord, setEditingWord] = useState<Partial<Word>>({ en: '', es: '', pron: '', img: '📊' });
  const [editingStory, setEditingStory] = useState<Partial<Story>>({ title: '', text: '', pronunciation: '', translation: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOptions, setAiOptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [aiGenType, setAiGenType] = useState<'theme' | 'file' | 'url'>('theme');
  const [aiGenValue, setAiGenValue] = useState('');
  const [aiGenFile, setAiGenFile] = useState<{data: string, name: string, type: string} | null>(null);
  const [aiGenResults, setAiGenResults] = useState<Word[]>([]);

  const [importText, setImportText] = useState('');
  const [wordPreview, setWordPreview] = useState<Word[]>([]);
  const [storyPreview, setStoryPreview] = useState<Story[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const wordImageFileRef = useRef<HTMLInputElement>(null);

  const filteredWords = words.filter(w => w.en.toLowerCase().includes(searchTerm.toLowerCase()) || w.es.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredStories = stories.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenAIPanel = () => {
    setAiPrompt(`minimalistic 3d icon for "${editingWord.en || 'object'}", flat colors, educational style`);
    setAiOptions([]);
    setShowAIPanel(true);
  };

  const handleGenerateOptions = async () => {
    if (!editingWord.en && !aiPrompt) return;
    setIsGenerating(true);
    try {
      const options = await gemini.generateImageOptions(editingWord.en || 'icon', aiPrompt);
      setAiOptions(options);
    } catch (e) {
      alert("Error al conectar con la IA de imágenes.");
    } finally {
      setIsGenerating(false);
    }
  };


  const handleSelectAIOption = (url: string) => {
    setEditingWord(prev => ({ ...prev, img: url }));
    setShowAIPanel(false);
  };

  const handleVocabGeneration = async () => {
    setIsGenerating(true);
    try {
      let result;
      if (aiGenType === 'file' && aiGenFile) {
        result = await gemini.generateVocabList({ type: 'file', value: aiGenFile.data.split(',')[1], mimeType: aiGenFile.type });
      } else {
        result = await gemini.generateVocabList({ type: aiGenType, value: aiGenValue });
      }
      if (result && result.words) {
        const processed = result.words.map((w: any) => ({ ...w, id: `ai_${Date.now()}_${Math.random()}` }));
        setAiGenResults(processed);
      }
    } catch (e) {
      alert("Error en el generador IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportData = (format: 'csv' | 'excel') => {
    let content = "";
    let fileName = "";
    let mimeType = "text/csv";
    const bom = "\uFEFF";

    if (activeTab === 'vocab') {
      fileName = format === 'csv' ? "vocabulario.csv" : "vocabulario.xls";
      if (format === 'csv') {
        content = bom + "English|Spanish|Pronunciation|Image\n" + words.map(w => `${w.en}|${w.es}|${w.pron}|${w.img}`).join('\n');
      } else {
        mimeType = "application/vnd.ms-excel";
        content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table><tr><th>English</th><th>Spanish</th><th>Pronunciation</th><th>Icon/Image</th></tr>${words.map(w => `<tr><td>${w.en}</td><td>${w.es}</td><td>${w.pron}</td><td>${w.img}</td></tr>`).join('')}</table></body></html>`;
      }
    } else {
      fileName = format === 'csv' ? "historias.csv" : "historias.xls";
      if (format === 'csv') {
        content = bom + "Title|Text|Pronunciation|Translation\n" + stories.map(s => `${s.title}|${s.text}|${s.pronunciation || ''}|${s.translation || ''}`).join('\n');
      } else {
        mimeType = "application/vnd.ms-excel";
        content = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table><tr><th>Title</th><th>Text</th><th>Pronunciation</th><th>Translation</th></tr>${stories.map(s => `<tr><td>${s.title}</td><td>${s.text}</td><td>${s.pronunciation || ''}</td><td>${s.translation || ''}</td></tr>`).join('')}</table></body></html>`;
      }
    }

    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processImport = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (activeTab === 'vocab') {
      const parsed = lines.map(line => {
        let parts = [];
        if (line.includes('|')) parts = line.split('|');
        else if (line.includes('\t')) parts = line.split('\t');
        else parts = line.split(',');
        
        return {
          id: `imp_${Date.now()}_${Math.random()}`,
          en: parts[0]?.trim() || '',
          es: parts[1]?.trim() || '',
          pron: parts[2]?.trim() || '',
          img: parts[3]?.trim() || '📄'
        };
      }).filter(w => w.en && w.es);
      setWordPreview(parsed);
    } else {
      const parsed = lines.map(line => {
        let parts = [];
        if (line.includes('|')) parts = line.split('|');
        else if (line.includes('\t')) parts = line.split('\t');
        else parts = line.split(',');
        return {
          id: `simp_${Date.now()}_${Math.random()}`,
          title: parts[0]?.trim() || 'Sin título',
          text: parts[1]?.trim() || '',
          pronunciation: parts[2]?.trim() || '',
          translation: parts[3]?.trim() || ''
        };
      }).filter(s => s.text);
      setStoryPreview(parsed);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
      processImport(content);
    };
    reader.readAsText(file);
  };

  const confirmDeleteWord = (word: Partial<Word>) => {
    if (!word.id) return;
    if (window.confirm(`¿Estás seguro de que quieres eliminar la palabra "${word.en}"?`)) {
      onDeleteWord(word.id);
      setMode('list');
    }
  };

  const confirmDeleteStory = (story: Partial<Story>) => {
    if (!story.id) return;
    if (window.confirm(`¿Estás seguro de que quieres eliminar la historia "${story.title}"?`)) {
      onDeleteStory(story.id);
      setMode('list');
    }
  };

  if (mode === 'import') {
    const isVocab = activeTab === 'vocab';
    const preview = isVocab ? wordPreview : storyPreview;
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-bottom duration-500 overflow-hidden">
         <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-slate-800">Importar {isVocab ? 'Vocabulario' : 'Historias'}</h2>
               <button onClick={() => { setMode('list'); setWordPreview([]); setStoryPreview([]); setImportText(''); }} className="text-slate-400 p-2"><Icon name="xmark" className="text-xl" /></button>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
               <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pega texto o sube archivo</label>
                  <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full"><Icon name="file-arrow-up" /> Cargar Archivo</button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt,.xls" onChange={handleFileUpload} />
               </div>
               <textarea value={importText} onChange={(e) => { setImportText(e.target.value); processImport(e.target.value); }} placeholder={isVocab ? "English | Spanish | Pronunciación | Icono" : "Título | Texto | Pronunciación | Traducción"} className="w-full h-40 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition-all" />
            </div>
            {preview.length > 0 && (
              <div className="mt-6 flex-1 flex flex-col min-h-0">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vista Previa ({preview.length} filas)</h4>
                 <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-xs text-left">
                       <thead className="bg-slate-50 sticky top-0">
                          <tr>
                             {isVocab ? (<><th className="p-3">EN</th><th className="p-3">ES</th><th className="p-3">ICON</th></>) : (<><th className="p-3">TÍTULO</th><th className="p-3">TEXTO</th></>)}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {preview.map((item: any, i) => (
                             <tr key={i}>
                                {isVocab ? (<><td className="p-3 font-bold">{item.en}</td><td className="p-3 text-indigo-500">{item.es}</td><td className="p-3">{item.img}</td></>) : (<><td className="p-3 font-bold truncate max-w-[80px]">{item.title}</td><td className="p-3 truncate max-w-[150px]">{item.text}</td></>)}
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
                 <div className="mt-4 pt-4 border-t flex gap-3">
                    <button onClick={() => { setWordPreview([]); setStoryPreview([]); setImportText(''); }} className="flex-1 py-3 text-slate-400 font-black text-xs">Limpiar</button>
                    <button onClick={() => { if(isVocab) onBulkSave(wordPreview); else onBulkSaveStories(storyPreview); setMode('list'); setWordPreview([]); setStoryPreview([]); setImportText(''); }} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg">Importar Todo</button>
                 </div>
              </div>
            )}
         </div>
      </div>
    );
  }

  if (mode === 'edit_word') {
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 relative">
        <div className="p-4 flex items-center gap-3 border-b h-14 shrink-0">
           <button onClick={() => setMode('list')} className="text-slate-400 p-2"><Icon name="arrow-left" /></button>
           <h2 className="text-lg font-black text-slate-800">Editor de Palabra</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
           <EditorInput label="Inglés" value={editingWord.en} onChange={v => setEditingWord({...editingWord, en: v})} />
           <EditorInput label="Español" value={editingWord.es} onChange={v => setEditingWord({...editingWord, es: v})} />
           <EditorInput label="Pronunciación (Leída en Español)" value={editingWord.pron} onChange={v => setEditingWord({...editingWord, pron: v})} placeholder="Ej: jáus" />
           
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Imagen / Icono</label>
              <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-5">
                 <div className="flex items-center gap-5 mb-6">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center justify-center text-4xl overflow-hidden shrink-0">
                       {editingWord.img?.includes('http') || editingWord.img?.includes('data:') ? (<img src={editingWord.img} className="w-full h-full object-cover" alt="preview" />) : (<span className="drop-shadow-sm">{editingWord.img}</span>)}
                    </div>
                    <div className="flex-1 space-y-2">
                       <button onClick={() => wordImageFileRef.current?.click()} className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"><Icon name="upload" /> Local</button>
                       <input type="file" ref={wordImageFileRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { const r = new FileReader(); r.onload=(ev)=>setEditingWord({...editingWord, img: ev.target?.result as string}); r.readAsDataURL(f); } }} />
                       <button onClick={() => { const word = editingWord.en || 'object'; window.open(`https://www.google.com/search?q=${encodeURIComponent(word)}+icon+3d+transparent&tbm=isch`, '_blank'); const url = window.prompt(`URL de imagen para "${word}":`); if(url) setEditingWord({...editingWord, img: url}); }} className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"><Icon name="link" /> Buscar URL</button>
                    </div>
                 </div>
                 <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto mb-6 p-1 bg-white/40 rounded-xl border border-slate-200">
                    {COMMON_EMOJIS.map(e => (<button key={e} onClick={() => setEditingWord({...editingWord, img: e})} className={`text-xl p-2 hover:bg-white rounded-xl transition-all ${editingWord.img === e ? 'bg-white shadow-md ring-2 ring-indigo-400' : 'opacity-60'}`}>{e}</button>))}
                 </div>
                 <button onClick={handleOpenAIPanel} className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] text-xs font-black flex items-center justify-center gap-2 shadow-xl ai-glow active:scale-95 transition-all"><Icon name="wand-sparkles" /> Generar Imagen con IA</button>
              </div>
           </div>
        </div>

        {showAIPanel && (
          <div className="absolute inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
             <div className="bg-white w-full rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-slate-800">Generador Visual IA</h3>
                   <button onClick={() => setShowAIPanel(false)} className="text-slate-400"><Icon name="xmark" className="text-xl" /></button>
                </div>
                <div className="space-y-4">
                   <EditorInput label="Prompt para la IA" value={aiPrompt} onChange={setAiPrompt} />
                   <button onClick={handleGenerateOptions} disabled={isGenerating} className="w-full py-5 ai-gradient text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                     <Icon name={isGenerating ? "spinner" : "bolt"} className={isGenerating ? "animate-spin" : ""} />
                     {isGenerating ? 'Generando...' : 'Generar Opciones'}
                   </button>
                   {aiOptions.length > 0 && (
                     <div className="grid grid-cols-2 gap-3 pt-4">
                        {aiOptions.map((opt, i) => (<button key={i} onClick={() => handleSelectAIOption(opt)} className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all shadow-md relative group"><img src={opt} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Icon name="check" className="text-white text-2xl" /></div></button>))}
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        <div className="p-6 flex gap-3 bg-white border-t sticky bottom-0 z-10 shrink-0">
           <button onClick={() => { onSave(editingWord as Word); setMode('list'); }} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg text-sm active:scale-95 transition-all">Guardar Palabra</button>
           {editingWord.id && (
             <button 
               type="button"
               onClick={() => confirmDeleteWord(editingWord)} 
               className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm border border-rose-100 hover:bg-rose-500 hover:text-white transition-colors"
             >
               <Icon name="trash-can" className="text-xl" />
             </button>
           )}
        </div>
      </div>
    );
  }

  if (mode === 'edit_story') {
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
        <div className="p-4 flex items-center gap-3 border-b h-14 shrink-0">
           <button onClick={() => setMode('list')} className="text-slate-400 p-2"><Icon name="arrow-left" /></button>
           <h2 className="text-lg font-black text-slate-800">Editar Historia</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <EditorInput label="Título" value={editingStory.title} onChange={v => setEditingStory({...editingStory, title: v})} />
           <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-48 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingStory.text} onChange={e => setEditingStory({...editingStory, text: e.target.value})} placeholder="Contenido en inglés..." />
           <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-24 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" value={editingStory.translation} onChange={e => setEditingStory({...editingStory, translation: e.target.value})} placeholder="Traducción..." />
        </div>
        <div className="p-6 flex gap-3 border-t">
           <button onClick={() => { onSaveStory(editingStory as Story); setMode('list'); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all">Guardar Historia</button>
           {editingStory.id && (
             <button 
               type="button"
               onClick={() => confirmDeleteStory(editingStory)} 
               className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
             >
               <Icon name="trash-can" className="text-xl" />
             </button>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-in fade-in duration-500">
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-4 p-4 h-14">
           <button onClick={onBack} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"><Icon name="arrow-left" /></button>
           <h2 className="text-lg font-black text-slate-800 flex-1">Editor</h2>
           <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('vocab')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${activeTab === 'vocab' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Vocab</button>
              <button onClick={() => setActiveTab('stories')} className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${activeTab === 'stories' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Historias</button>
           </div>
        </div>
        <div className="px-4 flex flex-col gap-3 pb-4">
           <div className="flex gap-2">
              <div className="relative flex-1">
                 <Icon name="magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]" />
                 <input className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-100" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-1 shrink-0">
                 <button onClick={() => handleExportData('csv')} className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-colors" title="Exportar CSV"><Icon name="file-csv" /></button>
                 <button onClick={() => handleExportData('excel')} className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm hover:bg-emerald-100 transition-colors" title="Exportar Excel"><Icon name="file-excel" /></button>
                 <button onClick={() => setMode('import')} className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm hover:bg-slate-100 transition-colors" title="Importar Contenido"><Icon name="file-import" /></button>
                 <button onClick={() => { if(activeTab === 'vocab') { setEditingWord({ en: '', es: '', pron: '', img: '📄' }); setMode('edit_word'); } else { setEditingStory({ title: '', text: '', pronunciation: '', translation: '' }); setMode('edit_story'); } }} className="w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-all"><Icon name="plus" /></button>
              </div>
           </div>
           {activeTab === 'vocab' && (
              <button onClick={() => setMode('ai_generator')} className="w-full py-4 bg-indigo-600 text-white rounded-[1.2rem] flex items-center justify-center gap-3 font-black text-xs shadow-xl ai-glow">
                 <Icon name="wand-magic-sparkles" /> Generador de Vocabulario con IA
              </button>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24">
         {activeTab === 'vocab' ? filteredWords.map(w => (
           <div key={w.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
              <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden shadow-inner">
                {w.img.includes('http') || w.img.includes('data:') ? <img src={w.img} className="w-full h-full object-cover" alt={w.en} /> : w.img}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 text-sm truncate">{w.en}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{w.es}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingWord(w); setMode('edit_word'); }} className="p-2 text-slate-300 hover:text-indigo-400 transition-colors" title="Editar"><Icon name="pen" className="text-sm" /></button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); confirmDeleteWord(w); }} 
                  className="p-2 text-slate-300 hover:text-rose-400 transition-colors"
                  title="Eliminar"
                >
                  <Icon name="trash-can" className="text-sm" />
                </button>
              </div>
           </div>
         )) : filteredStories.map((s, i) => (
           <div key={s.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><Icon name="book" className="text-sm" /></div>
              <div className="flex-1 min-w-0"><h4 className="font-bold text-slate-800 text-sm truncate">{s.title}</h4></div>
              <div className="flex gap-1">
                <button onClick={() => { setEditingStory(s); setMode('edit_story'); }} className="p-2 text-slate-300 hover:text-indigo-400 transition-colors" title="Editar"><Icon name="pen" className="text-sm" /></button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); confirmDeleteStory(s); }} 
                  className="p-2 text-slate-300 hover:text-rose-400 transition-colors"
                  title="Eliminar"
                >
                  <Icon name="trash-can" className="text-sm" />
                </button>
              </div>
           </div>
         ))}
      </div>
      
      {mode === 'ai_generator' && (
        <div className="absolute inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
           <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-slate-800">Generador de Vocabulario IA</h2>
                 <button onClick={() => { setMode('list'); setAiGenResults([]); }} className="text-slate-400 p-2"><Icon name="xmark" className="text-xl" /></button>
              </div>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['theme', 'file', 'url'] as const).map((t) => (
                      <button key={t} onClick={() => setAiGenType(t)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${aiGenType === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                        {t === 'theme' ? 'Temática' : t === 'file' ? 'Documento' : 'Enlace'}
                      </button>
                    ))}
                 </div>
                 <div className="space-y-4">
                    {aiGenType === 'theme' && (<EditorInput label="Escribe un tema" value={aiGenValue} onChange={setAiGenValue} placeholder="Ej: Viajes espaciales..." />)}
                    {aiGenType === 'url' && (<EditorInput label="Enlace Web" value={aiGenValue} onChange={setAiGenValue} placeholder="https://..." />)}
                    {aiGenType === 'file' && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subir PDF o Texto</label>
                         <div onClick={() => aiFileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-indigo-100 rounded-2xl flex flex-col items-center justify-center gap-2 bg-indigo-50/30 hover:bg-indigo-50 transition-all cursor-pointer">
                            <Icon name="cloud-arrow-up" className={`text-2xl ${aiGenFile ? 'text-indigo-600' : 'text-indigo-300'}`} />
                            <span className="text-xs font-bold text-slate-600">{aiGenFile ? aiGenFile.name : 'Seleccionar Archivo'}</span>
                            <input type="file" ref={aiFileInputRef} className="hidden" accept=".pdf,.txt" onChange={(e) => { const f=e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=(ev)=>setAiGenFile({data: ev.target?.result as string, name: f.name, type: f.type}); r.readAsDataURL(f); } }} />
                         </div>
                      </div>
                    )}
                    <button onClick={handleVocabGeneration} disabled={isGenerating || (aiGenType !== 'file' && !aiGenValue) || (aiGenType === 'file' && !aiGenFile)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl ai-glow flex items-center justify-center gap-3 disabled:opacity-50">
                      <Icon name={isGenerating ? "spinner" : "wand-sparkles"} className={isGenerating ? "animate-spin" : ""} />
                      {isGenerating ? 'Generando...' : 'Generar 10 Palabras'}
                    </button>
                 </div>
              </div>
              {aiGenResults.length > 0 && (
                <div className="mt-6 flex-1 flex flex-col min-h-0">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Resultados (Fonética Hispana)</h4>
                   <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {aiGenResults.map((w, i) => (
                        <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center gap-3 animate-in fade-in">
                           <span className="text-2xl">{w.img}</span>
                           <div className="flex-1">
                              <h5 className="font-black text-slate-800 text-sm">{w.en}</h5>
                              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">{w.pron} • {w.es}</p>
                           </div>
                           <button onClick={() => setAiGenResults(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-200 hover:text-rose-500"><Icon name="xmark" /></button>
                        </div>
                      ))}
                   </div>
                   <div className="mt-4 pt-4 border-t flex gap-3">
                      <button onClick={() => setAiGenResults([])} className="flex-1 py-3 text-slate-400 font-black text-xs">Descartar</button>
                      <button onClick={() => { onBulkSave(aiGenResults); setMode('list'); setAiGenResults([]); }} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-lg">Añadir al Módulo</button>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

const EditorInput = ({ label, value, onChange, placeholder }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" />
  </div>
);

export default EditorView;
