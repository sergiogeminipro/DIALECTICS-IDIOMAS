
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Icon } from '../constants';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
}

const SettingsView: React.FC<Props> = ({ settings, onSave, onBack }) => {
  const [local, setLocal] = useState<AppSettings>(settings);

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 p-1"><Icon name="arrow-left" /></button>
        <h2 className="text-xl font-black text-slate-800">Configuración</h2>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Icon name="clock" /> Intervalos de Repaso (Tarjetas)
        </h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
          <IntervalInput label="Difícil" value={local.intervals.hard} onChange={v => setLocal({...local, intervals: {...local.intervals, hard: parseInt(v)}})} desc="Repetir cada X cartas" />
          <IntervalInput label="Bien" value={local.intervals.medium} onChange={v => setLocal({...local, intervals: {...local.intervals, medium: parseInt(v)}})} desc="Repetir cada X cartas" />
          <IntervalInput label="Fácil" value={local.intervals.easy} onChange={v => setLocal({...local, intervals: {...local.intervals, easy: parseInt(v)}})} desc="Repetir cada X cartas" />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Icon name="sliders" /> Preferencias
        </h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Modo de Tarjeta</span>
              <button 
                onClick={() => setLocal({...local, cardMode: local.cardMode === 'en_to_es' ? 'es_to_en' : 'en_to_es'})}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black"
              >
                {local.cardMode === 'en_to_es' ? 'Inglés → Español' : 'Español → Inglés'}
              </button>
           </div>
           <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-sm font-bold text-slate-700">Reproducción Automática</span>
              <button 
                onClick={() => setLocal({...local, autoPlayAudio: !local.autoPlayAudio})}
                className={`w-12 h-7 rounded-full transition-all relative ${local.autoPlayAudio ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow-sm transition-all ${local.autoPlayAudio ? 'left-6' : 'left-1'}`} />
              </button>
           </div>
        </div>
      </section>

      <button onClick={() => onSave(local)} className="w-full py-5 ai-gradient text-white rounded-3xl font-black shadow-xl ai-glow">
        Guardar Cambios
      </button>
    </div>
  );
};

const IntervalInput = ({ label, value, onChange, desc }: any) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1">
      <span className="block text-sm font-bold text-slate-800 leading-none">{label}</span>
      <span className="text-[10px] text-slate-400 font-medium">{desc}</span>
    </div>
    <input 
      type="number" 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-16 bg-slate-50 border-none rounded-xl p-2 text-center text-sm font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

export default SettingsView;
