import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import type { AcademicProfile, RiskAssessment } from './risk.js';

const fallbackAiMessage =
  'The rule-based model detected the main academic stressors. To improve outcomes, the student should increase attendance, address weak coursework, and maintain a consistent study schedule.';

function extractText(response: unknown): string {
  if (!response || typeof response !== 'object') return fallbackAiMessage;

  const maybeText = (response as { text?: string }).text;
  if (typeof maybeText === 'string' && maybeText.trim()) return maybeText;

  const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  if (Array.isArray(candidates)) {
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts ?? [];
      for (const part of parts) {
        if (typeof part?.text === 'string' && part.text.trim()) {
          return part.text.trim();
        }
      }
    }
  }

  return fallbackAiMessage;
}

export async function generateAiExplanation(
  profile: AcademicProfile,
  risk: RiskAssessment,
): Promise<{ explanation: string; enabled: boolean }> {
  if (!config.geminiApiKey) {
    return {
      explanation: `${fallbackAiMessage} A fallback rule-based model was used because GEMINI_API_KEY is not configured.`,
      enabled: false,
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    const prompt = [
      'You are an academic advisor using the Google Gemma 4 model through Gemini API.',
      'Return concise, supportive guidance in plain English.',
      `Student profile: ${JSON.stringify(profile)}`,
      `Risk score: ${risk.score}. Risk level: ${risk.level}.`,
      'Explain the likely causes, how to prioritize intervention, and suggest a practical improvement plan for the student.',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: prompt,
    });

    const explanation = extractText(response);
    return { explanation, enabled: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    return {
      explanation: `${fallbackAiMessage} The Gemini API request failed (${message}), so the application used the safe fallback assessment logic.`,
      enabled: false,
    };
  }
}
