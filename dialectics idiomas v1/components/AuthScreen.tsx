import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen: React.FC = () => {
    const { login, register, googleLogin, error, clearError, loading: authLoading } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        try {
            if (isRegister) {
                await register(email, password, displayName || undefined);
            } else {
                await login(email, password);
            }
        } catch {
            // error already handled in context
        }
        setLoading(false);
    };

    const handleGoogle = async () => {
        setLoading(true);
        try {
            await googleLogin();
        } catch {
            // error already handled in context
        }
        setLoading(false);
    };

    const toggleMode = () => {
        clearError();
        setIsRegister(!isRegister);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12 font-sans">
            {/* Logo / Branding */}
            <div className="text-center mb-10 animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-200 border-b-4 border-indigo-800/20">
                    <span className="text-3xl">🎓</span>
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dialectics Idiomas</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Tu plataforma de inglés con IA</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/80 p-8 border border-slate-100 animate-in zoom-in duration-500">

                {/* Tab Toggle */}
                <div className="flex bg-slate-100 rounded-2xl p-1 mb-8">
                    <button
                        onClick={() => { clearError(); setIsRegister(false); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isRegister ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => { clearError(); setIsRegister(true); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isRegister ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}
                    >
                        Registrarse
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div className="animate-in slide-in-from-top duration-300">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Nombre</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Tu nombre"
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white transition-all placeholder:text-slate-300"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white transition-all placeholder:text-slate-300"
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-300 focus:bg-white transition-all placeholder:text-slate-300"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 animate-in fade-in duration-200">
                            <p className="text-rose-600 text-xs font-bold text-center">{error}</p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Cargando...
                            </span>
                        ) : isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-slate-100"></div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">o continúa con</span>
                    <div className="flex-1 h-px bg-slate-100"></div>
                </div>

                {/* Google Login */}
                <button
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-600 flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-200 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </button>

                {/* Toggle link */}
                <p className="text-center mt-6 text-xs text-slate-400 font-medium">
                    {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                    <button onClick={toggleMode} className="text-indigo-600 font-black hover:underline">
                        {isRegister ? 'Inicia sesión' : 'Regístrate'}
                    </button>
                </p>
            </div>

            {/* Footer */}
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] mt-8">
                Powered by Firebase & Gemini AI
            </p>
        </div>
    );
};

export default AuthScreen;
