import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with the Vite environment variable
const apiKey = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);


export class GeminiService {
  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks if present
    return text.replace(/```json\n?/, "").replace(/```\n?$/, "").trim();
  }

  private emitStatus(status: 'idle' | 'loading' | 'success' | 'error') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-status', { detail: { status } }));
    }
  }

  private setStatusSuccess() {
    this.emitStatus('success');
    setTimeout(() => this.emitStatus('idle'), 2000);
  }

  private setStatusError() {
    this.emitStatus('error');
    setTimeout(() => this.emitStatus('idle'), 3000);
  }


  /**
   * Generates a structured grammar drill with 5 forms based on a specific lesson and vocabulary.
   */
  async generateGrammarDrill(lesson: string, vocab: string[], level: string = ""): Promise<any> {
    if (!apiKey) {
      console.error("VITE_GEMINI_API_KEY is missing!");
      return null;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // 2.5 flash is highly capable and fast
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    try {
      this.emitStatus('loading');
      const prompt = `Eres un experto profesor de inglés nativo. 
        Genera un ejercicio de entrenamiento gramatical para la lección: "${lesson}".
        NIVEL DEL ESTUDIANTE: ${level}
        VOCABULARIO SUGERIDO: [${vocab.slice(0, 15).join(", ")}].
        Responde estrictamente en formato JSON con la siguiente estructura:
        {
          "formulaParts": ["string"],
          "masterExample": {
            "affirmative": { "text": "string", "translation": "string", "parts": [{"label": "string", "text": "string"}] },
            "negative": { "text": "string", "translation": "string" },
            "interrogative": { "text": "string", "translation": "string" },
            "shortAnswer": { "text": "string", "translation": "string" },
            "longAnswer": { "text": "string", "translation": "string" }
          },
          "drills": [
            { "baseSentence": "string", "affirmative": "string", "negative": "string", "interrogative": "string", "shortAnswer": "string", "longAnswer": "string" }
          ]
        }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      this.setStatusSuccess();
      return JSON.parse(this.cleanJsonResponse(response.text()));
    } catch (e) {
      this.setStatusError();
      console.error("Error generating drill:", e);
      return null;
    }
  }

  async evaluateTransformation(userAnswer: string, correctAnswer: string, lessonTitle: string): Promise<any> {
    if (!apiKey) return { isCorrect: false, feedback: "API Key missing", correction: correctAnswer };
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    try {
      this.emitStatus('loading');
      const prompt = `Evalúa la transformación gramatical:
        ESPERADA: "${correctAnswer}"
        ESTUDIANTE: "${userAnswer}"
        Responde en JSON: { "isCorrect": boolean, "feedback": "string", "correction": "string" }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      this.setStatusSuccess();
      return JSON.parse(this.cleanJsonResponse(response.text()));
    } catch (e) {
      this.setStatusError();
      return { isCorrect: false, feedback: "Error en la evaluación.", correction: correctAnswer };
    }
  }

  async getTutorChatResponse(message: string, context: string): Promise<string> {
    if (!apiKey) return "Error: API Key no configurada.";
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    try {
      this.emitStatus('loading');
      const prompt = `Eres un Tutor de Inglés Experto.
        CONTEXTO: ${context}.
        USUARIO: "${message}".
        Usa fonética para hispanohablantes (ej: "ander-stánd") y NO use IPA.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      this.setStatusSuccess();
      return response.text() || "Lo siento, hubo un error.";
    } catch (e) {
      this.setStatusError();
      return "Error de conexión con el tutor.";
    }
  }

  async generateStory(words: string[], theme: string = "general"): Promise<any> {
    if (!apiKey) return null;
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    try {
      this.emitStatus('loading');
      const prompt = `Escribe una historia corta sobre "${theme}" usando estas palabras: ${words.join(", ")}.
        Responde en JSON: { "title": "string", "text": "string", "translation": "string", "pronunciation": "string" }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      this.setStatusSuccess();
      return JSON.parse(this.cleanJsonResponse(response.text()));
    } catch (e) {
      this.setStatusError();
      return null;
    }
  }

  async generateVocabList(source: { type: 'theme' | 'file' | 'url', value: string, mimeType?: string }): Promise<any> {
    if (!apiKey) return null;
    const model = genAI.getGenerativeModel({
      model: source.type === 'url' ? 'gemini-1.5-pro' : 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });
    let promptText = "";
    if (source.type === 'theme') promptText = `Genera 10 palabras sobre el tema: ${source.value}`;
    else promptText = `Extrae 10 palabras de este contenido: ${source.value}`;

    try {
      this.emitStatus('loading');
      const prompt = `${promptText}. Responde en JSON: { "words": [{"en": "string", "es": "string", "pron": "string", "img": "string"}] }`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      this.setStatusSuccess();
      return JSON.parse(this.cleanJsonResponse(response.text()));
    } catch (e) {
      this.setStatusError();
      return null;
    }
  }

  async generateListeningExercise(theme: string, vocab: string[], type: string, grammarTopic: string): Promise<any> {
    if (!apiKey) return null;
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    try {
      this.emitStatus('loading');
      const prompt = `Genera un ejercicio de escucha tipo ${type} sobre ${theme} para practicar ${grammarTopic}. Vocabulario: ${vocab.join(", ")}.
        Responde en JSON con campos: title, audioScript, keywords (array), lines (array de speaker/text), quiz (array de question/options/correctIdx).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      this.setStatusSuccess();
      return JSON.parse(this.cleanJsonResponse(response.text()));
    } catch (e) {
      this.setStatusError();
      return null;
    }
  }

  // Multi-speaker results
  async generateMultiSpeakerAudio(script: string): Promise<string | null> {
    return null; // Local speech synthesis is used in the frontend
  }

  async textToSpeech(text: string): Promise<string | null> {
    return null; // Local speech synthesis is used in the frontend
  }

  async generateCardImage(word: string, description: string): Promise<string | null> {
    return null; // Placeholder for DALL-E or Imagen integration
  }
}
