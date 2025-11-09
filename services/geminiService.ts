
import { GoogleGenAI } from "@google/genai";
import { Persona, CodeFile } from '../types';
import { PERSONA_PROMPTS } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. Please provide a valid API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "placeholder_api_key" });

function fileToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
}

export async function* analyzeCodeAndScreen(
  persona: Persona,
  codeFiles: CodeFile[],
  screenCapture: string | null
) {
  const model = ai.models;
  const systemInstruction = PERSONA_PROMPTS[persona];
  const codePrompt = codeFiles.map(file => `
--- CODE FILE: ${file.name} ---
\`\`\`
${file.content}
\`\`\`
`).join('\n');
  
  const textPart = { text: `Here is the code to analyze:\n${codePrompt}\n\nAnd here is a screenshot of the UI. Please begin your analysis based on your persona.`};
  const parts: any[] = [textPart];

  if (screenCapture) {
    const imagePart = fileToGenerativePart(screenCapture.split(',')[1], 'image/jpeg');
    parts.push(imagePart);
  }

  const result = await model.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: {
          parts,
      },
      config: {
          systemInstruction,
      }
  });

  for await (const chunk of result) {
    yield chunk.text;
  }
}
