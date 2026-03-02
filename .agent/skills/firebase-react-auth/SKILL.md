---
name: firebase-react-auth
description: Instalar y configurar un módulo completo de registro e inicio de sesión con Firebase (Email/Contraseña y Google) en React+Tailwind, incluyendo diseño UI y manejo de estado.
---

# Módulo de Autenticación Firebase (React)

Esta habilidad (skill) proporciona una estructura probada, estéticamente agradable y totalmente funcional para integrar un flujo de inicio de sesión y registro en un proyecto React usando Firebase.

## Archivos de Plantilla (Templates)
En la subcarpeta `templates/` de esta habilidad encontrarás el código base extraído de un entorno funcional:

1. **`authService.ts`**: Contiene la lógica pura de llamadas a la API de Firebase (`signInWithEmailAndPassword`, `signInWithPopup`, etc).
2. **`AuthContext.tsx`**: Provee el estado global de autenticación (`user`, `loading`, `error`) y funciones de manejo de errores traducidas para el usuario final.
3. **`AuthScreen.tsx`**: Componente visual (UI) con diseño premium en Tailwind CSS que incluye modo "Login", "Registro" y botón unificado de Google.

## Instrucciones de Implementación

Cuando necesites integrar esto en un proyecto futuro, sigue estos pasos:

1. **Dependencias:** Asegúrate de que el proyecto tenga instalados `firebase`, `react`, `lucide-react` y esté configurado con **Tailwind CSS**.
2. **Configuración:** Genera u obtén el archivo de configuración de Firebase (`firebaseConfig.ts`).
3. **Copiar Archivos:**
   - Transporta `authService.ts` a la carpeta de servicios (`src/services/`).
   - Transporta `AuthContext.tsx` a la carpeta de contextos (`src/contexts/`).
   - Transporta `AuthScreen.tsx` a la carpeta de componentes (`src/components/`).
4. **Integración Global:** Envuelve el árbol principal de componentes de la aplicación con el `<AuthProvider>` del contexto.

### Ejemplo de Integración en `App.tsx`:
```tsx
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  // Si no hay usuario, mostrar siempre la pantalla de inicio de sesión
  if (!user) {
    return <AuthScreen />;
  }

  // Plataforma principal para usuarios autenticados
  return (
    <div className="p-4">
      <h1>¡Bienvenido a la plataforma!</h1>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
```
