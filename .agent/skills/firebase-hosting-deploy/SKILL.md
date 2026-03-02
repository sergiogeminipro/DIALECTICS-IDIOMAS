---
name: firebase-hosting-deploy
description: Configurar y publicar de forma rápida una aplicación web frontend (como React o Vite) directamente a Firebase Hosting, gestionando el build y los alias de proyecto correspondientes.
---

# Despliegue en Firebase Hosting (Vite / React)

Esta habilidad documenta todo el flujo estándar y optimizado que debes seguir cuando un usuario solicite "publicar" o "subir a producción" un proyecto frontend sobre Firebase Hosting.

## Prerrequisitos
Asegúrate de que el proyecto ya compila de forma exitosa localmente (ejecuta `npm run build` y verifica que no existan errores de TS/React). 

## Flujo de Trabajo (Comandos)

1. **Definir el proyecto objetivo (Si aplica):**
   Si la consola Firebase CLI no tiene configurado el entorno correcto, debes apuntarla al proyecto en cuestión.
   ```bash
   npx firebase-tools use <ID_DEL_PROYECTO>
   ```
   *Ejemplo: `npx firebase-tools use dialectics-idiomas`*

2. **Compilar la aplicación para Producción:**
   Para proyectos Vite:
   ```bash
   npm run build
   ```
   *Asegúrate de esperar a que termine la compilación y que la carpeta `dist/` se haya generado correctamente.*

3. **Ejecutar el despliegue al Hosting:**
   Usamos la directiva `--only hosting` para que no afecte reglas de Firestore o Storage de forma accidental.
   ```bash
   npx firebase-tools deploy --only hosting
   ```

## Configuración y Archivos de Contexto que deben Existir
Para que el paso anterior funcione sin pedir interactividad (es decir, en modo headless para el agente), el repositorio debe tener pre-configurado lo siguiente. Consúltalos o genéralos con `npx firebase-tools init hosting` si es la primera vez que tocas el repositorio:

- **`.firebaserc`**: Diccionario que amarra el alias (ej. "default") con el ID de proyecto en Firebase.
- **`firebase.json`**:
  Ejemplo para Vite (Single Page Application):
  ```json
  {
    "hosting": {
      "public": "dist",
      "ignore": [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  }
  ```

## Manejo de Posibles Errores

1. **`The term 'firebase' is not recognized`**:
   No uses la instalación global de Firebase (ej. `firebase deploy`). Siempre usa el prefijo `npx firebase-tools` para forzar su uso seguro dentro de un entorno aislado.

2. **Página en blanco después de desplegar (Vite):**
   Verifica que los imports de módulos y assets usen las rutas base o absolutas. A veces, las rutas relativas muy anidadas pueden fallar.
