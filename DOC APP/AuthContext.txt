import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthChange, loginWithEmail, loginWithGoogle, registerWithEmail, logout as firebaseLogout, User } from '../services/authService';
import { saveUserProfile, migrateLocalStorageToFirestore } from '../services/firestoreService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    googleLogin: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
    return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Save profile & try migration on every login
                await saveUserProfile(firebaseUser.uid, {
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || undefined
                });
                await migrateLocalStorageToFirestore(firebaseUser.uid);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const translateError = (code: string): string => {
        const map: Record<string, string> = {
            'auth/email-already-in-use': 'Este email ya está registrado',
            'auth/invalid-email': 'Email inválido',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/user-not-found': 'No existe una cuenta con este email',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/invalid-credential': 'Credenciales inválidas. Verifica tu email y contraseña',
            'auth/too-many-requests': 'Demasiados intentos. Espera un momento',
            'auth/popup-closed-by-user': 'Se cerró la ventana de inicio de sesión',
            'auth/network-request-failed': 'Error de conexión. Revisa tu internet',
        };
        return map[code] || 'Error de autenticación. Intenta de nuevo';
    };

    const login = async (email: string, password: string) => {
        try {
            setError(null);
            await loginWithEmail(email, password);
        } catch (e: any) {
            console.error("Firebase Login Error:", e);
            setError(translateError(e.code));
            throw e;
        }
    };

    const register = async (email: string, password: string, name?: string) => {
        try {
            setError(null);
            await registerWithEmail(email, password, name);
        } catch (e: any) {
            setError(translateError(e.code));
            throw e;
        }
    };

    const googleLogin = async () => {
        try {
            setError(null);
            await loginWithGoogle();
        } catch (e: any) {
            setError(translateError(e.code));
            throw e;
        }
    };

    const logoutUser = async () => {
        try {
            await firebaseLogout();
        } catch (e: any) {
            setError(translateError(e.code));
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            login,
            register,
            googleLogin,
            logout: logoutUser,
            clearError: () => setError(null)
        }}>
            {children}
        </AuthContext.Provider>
    );
};
