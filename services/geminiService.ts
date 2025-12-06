import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, TranslationMode } from "../types";

// Helper to decode base64 audio
export const decodeAudioData = async (
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await audioContext.decodeAudioData(bytes.buffer);
};

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  async analyzeText(text: string, mode: TranslationMode): Promise<AnalysisResult> {
    const modelId = "gemini-2.5-flash";
    
    let promptContext = "";
    switch (mode) {
      case TranslationMode.CantoneseToOthers:
        promptContext = "The input is in Cantonese.";
        break;
      case TranslationMode.EnglishToCantonese:
        promptContext = "The input is in English. First translate it naturally to Cantonese, then analyze the Cantonese translation.";
        break;
      case TranslationMode.KoreanToCantonese:
        promptContext = "The input is in Korean. First translate it naturally to Cantonese, then analyze the Cantonese translation.";
        break;
    }

    const prompt = `
      ${promptContext}
      Input Text: "${text}"

      Task: 
      1. Identify the primary Cantonese sentence (if input is not Cantonese, use the translation you generated).
      2. Provide the Jyutping romanization for the Cantonese sentence.
      3. Provide a natural English translation.
      4. Provide a natural Korean translation.
      5. Break down the Cantonese sentence word by word (or compound word by compound word).
      6. For each word, provide:
         - The word characters.
         - Jyutping.
         - Part of speech.
         - English meaning.
         - Korean meaning.
         - A *new* example sentence using this word in a different context (Cantonese, Jyutping, English, Korean).
    `;

    const response = await this.ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cantoneseText: { type: Type.STRING, description: "The Cantonese sentence (translated if source was not Cantonese)" },
            jyutping: { type: Type.STRING, description: "Full sentence Jyutping" },
            englishTranslation: { type: Type.STRING, description: "Full English translation" },
            koreanTranslation: { type: Type.STRING, description: "Full Korean translation" },
            breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  jyutping: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  englishMeaning: { type: Type.STRING },
                  koreanMeaning: { type: Type.STRING },
                  exampleSentenceCantonese: { type: Type.STRING },
                  exampleSentenceJyutping: { type: Type.STRING },
                  exampleSentenceEnglish: { type: Type.STRING },
                  exampleSentenceKorean: { type: Type.STRING },
                },
                required: ["word", "jyutping", "partOfSpeech", "englishMeaning", "koreanMeaning", "exampleSentenceCantonese", "exampleSentenceJyutping", "exampleSentenceEnglish", "exampleSentenceKorean"]
              }
            }
          },
          required: ["cantoneseText", "jyutping", "englishTranslation", "koreanTranslation", "breakdown"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(response.text);
    return {
      originalText: text,
      ...data
    };
  }

  async generateSpeech(text: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say this in Cantonese: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore tends to have a neutral tone suitable for broader TTS
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Failed to generate audio");
    }
    return base64Audio;
  }
}

export const geminiService = new GeminiService();
