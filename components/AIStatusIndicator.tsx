import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

type AIStatus = 'idle' | 'loading' | 'success' | 'error';

const AIStatusIndicator: React.FC = () => {
    const [status, setStatus] = useState<AIStatus>('idle');
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleStatusUpdate = (e: Event) => {
            const customEvent = e as CustomEvent;
            if (customEvent.detail && customEvent.detail.status) {
                setStatus(customEvent.detail.status);
            }
        };

        window.addEventListener('ai-status', handleStatusUpdate);
        return () => window.removeEventListener('ai-status', handleStatusUpdate);
    }, []);

    let colorClass = 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]';
    let iconColor = 'text-cyan-500';
    let text = 'IA Lista';
    let animation = '';

    switch (status) {
        case 'loading':
            colorClass = 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]';
            iconColor = 'text-amber-500';
            text = 'Generando...';
            animation = 'animate-pulse';
            break;
        case 'success':
            colorClass = 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]';
            iconColor = 'text-emerald-500';
            text = 'Completado';
            break;
        case 'error':
            colorClass = 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]';
            iconColor = 'text-red-500';
            text = 'Error de conexión';
            break;
    }

    return (
        <div
            className="fixed top-4 right-4 z-[100] cursor-default flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-200/50 transition-all duration-300"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative flex items-center justify-center px-1">
                <Sparkles size={16} className={`${iconColor} ${animation}`} />
                <span className={`absolute -top-1 -right-0.5 flex h-2 w-2`}>
                    {status === 'loading' && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colorClass}`}></span>}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClass} ${status === 'loading' ? 'opacity-90' : 'opacity-100'}`}></span>
                </span>
            </div>

            {/* Sutil expansión de texto al hacer hover o cuando está generando/error */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center ${isHovered || status === 'loading' || status === 'error' || status === 'success' ? 'max-w-[120px] opacity-100 ml-1' : 'max-w-0 opacity-0'
                    }`}
            >
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap pr-1">
                    {text}
                </span>
            </div>
        </div>
    );
};

export default AIStatusIndicator;
