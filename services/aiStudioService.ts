// Powered by OnSpace.AI — AI Studio Service
// AI Subtitles, Multi-Engine Translation, BG Music Generation

import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

const supabase = getSupabaseClient();

export type TranslationEngine = 'onspace' | 'gemini' | 'gemini-pro' | 'openai' | 'openai-pro' | 'google';

export interface TranslationEngineConfig {
  id: TranslationEngine;
  label: string;
  model: string;
  badge?: string;
  color: string;
  description: string;
}

export const TRANSLATION_ENGINES: TranslationEngineConfig[] = [
  {
    id: 'onspace',     label: 'OnSpace AI',   model: 'Gemini 3 Flash',  badge: 'Default',
    color: '#D4A017',  description: 'Fastest · Best for dubbing scripts',
  },
  {
    id: 'gemini',      label: 'Gemini Flash', model: 'Gemini 3 Flash',
    color: '#4285F4',  description: 'Google Gemini 3 Flash · Multilingual',
  },
  {
    id: 'gemini-pro',  label: 'Gemini Pro',   model: 'Gemini 3 Pro',    badge: 'Pro',
    color: '#34A853',  description: 'Highest accuracy · Best for literary text',
  },
  {
    id: 'openai',      label: 'GPT-5 Mini',   model: 'GPT-5 Mini',
    color: '#10A37F',  description: 'OpenAI GPT-5 Mini · Fast & reliable',
  },
  {
    id: 'openai-pro',  label: 'GPT-5.1',      model: 'GPT-5.1',         badge: 'Flagship',
    color: '#1A1A2E',  description: 'Most powerful · Best reasoning',
  },
  {
    id: 'google',      label: 'Gemini Lite',  model: 'Gemini 2.5 Lite',
    color: '#EA4335',  description: 'Fastest & lightest · Quick drafts',
  },
];

// ── Helper to call edge function ──────────────────────────────────
async function callAiStudio(payload: object): Promise<any> {
  const { data, error } = await supabase.functions.invoke('ai-studio', { body: payload });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) {
      try {
        const code = error.context?.status ?? 500;
        const text = await error.context?.text();
        msg = `[${code}] ${text || error.message}`;
      } catch {}
    }
    throw new Error(msg);
  }
  if (!data?.success) throw new Error(data?.error ?? 'Unknown error');
  return data.data;
}

// ── AI Subtitle Generation ────────────────────────────────────────
export async function generateAISubtitles(
  text: string,
  languages: string[],
  style = 'standard',
  format = 'SRT'
): Promise<Record<string, string>> {
  return callAiStudio({ action: 'generate_subtitles', text, languages, style, format });
}

// ── Multi-Engine Translation ──────────────────────────────────────
export async function translateWithEngine(
  text: string,
  sourceLang: string,
  targetLangs: string[],
  engine: TranslationEngine = 'onspace'
): Promise<Record<string, string>> {
  return callAiStudio({ action: 'translate', text, sourceLang, targetLangs, engine });
}

// ── AI Background Music Suggestions ──────────────────────────────
export async function getAiBgMusicSuggestions(
  context: string,
  mood: string,
  language: string
): Promise<{ title: string; bpm: number; mood: string; description: string; tags: string[] }[]> {
  return callAiStudio({ action: 'bg_music_suggestions', context, mood, language });
}
