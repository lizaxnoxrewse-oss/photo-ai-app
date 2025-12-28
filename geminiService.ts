
import { GoogleGenAI, Type } from "@google/genai";
import { BlockId, CustomTextConfig } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeImage = async (base64Image: string) => {
  const model = "gemini-3-flash-preview";
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      blocks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["id", "title", "content"]
        }
      }
    },
    required: ["blocks"]
  };

  const prompt = `Ты — профессиональный фотограф и арт-директор. 
  Проанализируй изображение и разложи его на 10 технических блоков пресета на РУССКОМ ЯЗЫКЕ:
  1. ОБЪЕКТ И КОНТЕКСТ (ID: ${BlockId.SUBJECT})
  2. СТИЛЬ И ВИЗУАЛЬНЫЙ ЯЗЫК (ID: ${BlockId.STYLE})
  3. СВЕТОВАЯ СХЕМА (ID: ${BlockId.LIGHTING})
  4. КОМПОЗИЦИЯ И КАДРИРОВАНИЕ (ID: ${BlockId.COMPOSITION})
  5. КАМЕРА И ОПТИКА (ID: ${BlockId.CAMERA})
  6. ЦВЕТ И ТОНАЛЬНОСТЬ (ID: ${BlockId.COLOR})
  7. ДЕТАЛИ И ТЕКСТУРЫ (ID: ${BlockId.DETAILS})
  8. НАСТРОЕНИЕ И ЭМОЦИИ (ID: ${BlockId.MOOD})
  9. ЛОГИКА ПОСТОБРАБОТКИ (ID: ${BlockId.POST})
  10. НЕГАТИВНЫЕ ПАРАМЕТРЫ (ID: ${BlockId.NEGATIVE})

  Используй профессиональную терминологию. Ответ должен быть строго в формате JSON.`;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image.split(",")[1]
    }
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const data = JSON.parse(result.text || "{}");
    return data.blocks;
  } catch (error) {
    console.error("Ошибка Gemini API:", error);
    throw error;
  }
};

export const assembleFinalPrompt = async (
  blocks: { title: string; content: string }[], 
  styleOverride?: string, 
  aspectRatio?: string,
  textConfig?: CustomTextConfig
) => {
  const model = "gemini-3-pro-preview";
  const blocksText = blocks.map(b => `${b.title}: ${b.content}`).join("\n");
  
  const prompt = `Преврати эти параметры в профессиональный промпт на АНГЛИЙСКОМ языке.
  
  ${aspectRatio ? `ФОРМАТ/РАЗМЕР: ${aspectRatio}` : ''}
  ${styleOverride ? `СТИЛЬ: ${styleOverride}` : ''}
  ${textConfig?.text ? `ТИПОГРАФИКА: Add text "${textConfig.text}" in ${textConfig.style} style integrated into the visual.` : ''}
  
  ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ:
  ${blocksText}
  
  Результат на английском, без вступлений. Добавь в конец промпта параметр соотношения сторон (например --ar 16:9), если он указан.`;

  const result = await ai.models.generateContent({
    model,
    contents: prompt
  });

  return result.text;
};
