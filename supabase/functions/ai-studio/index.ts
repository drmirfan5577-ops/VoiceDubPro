// Powered by OnSpace.AI — AI Studio Edge Function
// Handles: AI Subtitle Generation, Multi-Engine Translation, BG Music Generation suggestions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ONSPACE_API_KEY = Deno.env.get('ONSPACE_AI_API_KEY') ?? '';
const ONSPACE_BASE_URL = Deno.env.get('ONSPACE_AI_BASE_URL') ?? '';
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';

async function callOnSpaceAI(messages: { role: string; content: string }[], model = DEFAULT_MODEL): Promise<string> {
  const resp = await fetch(`${ONSPACE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ONSPACE_API_KEY}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!resp.ok) throw new Error(`OnSpace AI error: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Subtitle SRT generator ────────────────────────────────────────
async function generateSubtitles(
  text: string,
  targetLanguages: string[],
  style: string,
  format: string
): Promise<Record<string, string>> {
  const LANG_NAMES: Record<string, string> = {
    en: 'English', ur: 'Urdu', ar: 'Arabic', fa: 'Persian', tr: 'Turkish',
    hi: 'Hindi', ru: 'Russian', bn: 'Bengali', zh: 'Chinese', ps: 'Pashto',
    sd: 'Sindhi', bal: 'Balochi',
  };

  const systemPrompt = `You are a professional subtitle generator for a voice dubbing studio. 
Generate accurate, natural-sounding subtitles. For RTL languages (Urdu, Arabic, Persian, Sindhi, Balochi, Pashto), use proper RTL text.
Style: ${style}. Output format: ${format}.
Return ONLY the subtitle content, no explanations.`;

  const results: Record<string, string> = {};
  const lines = text.split('\n').filter(l => l.trim());

  const formatTimecode = (index: number, linesCount: number): { start: string; end: string } => {
    const avgDuration = 4.5;
    const start = index * avgDuration;
    const end = Math.min(start + avgDuration - 0.2, (linesCount) * avgDuration);
    const fmt = (sec: number) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.round((sec % 1) * 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };
    return { start: fmt(start), end: fmt(end) };
  };

  for (const lang of targetLanguages) {
    const langName = LANG_NAMES[lang] ?? lang;
    try {
      const prompt = lang === 'en'
        ? `Convert this text to properly timed ${format} subtitles in English. Split into natural subtitle segments of 1-2 lines each:\n\n${text}`
        : `Translate this text to ${langName} and format as ${format} subtitles. Keep translations natural and culturally appropriate. Text:\n\n${text}`;

      const aiContent = await callOnSpaceAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ]);

      // If AI returned structured content, use it; otherwise, build SRT from lines
      if (aiContent.includes('-->') || aiContent.includes('WEBVTT')) {
        results[lang] = aiContent;
      } else {
        // Build SRT from AI translation output
        const translatedLines = aiContent.split('\n').filter(l => l.trim()).slice(0, lines.length);
        if (format === 'SRT') {
          results[lang] = translatedLines.map((line, i) => {
            const { start, end } = formatTimecode(i, translatedLines.length);
            return `${i + 1}\n${start} --> ${end}\n${line.trim()}\n`;
          }).join('\n');
        } else if (format === 'VTT') {
          const vttLines = translatedLines.map((line, i) => {
            const { start, end } = formatTimecode(i, translatedLines.length);
            const vttStart = start.replace(',', '.');
            const vttEnd = end.replace(',', '.');
            return `${vttStart} --> ${vttEnd}\n${line.trim()}\n`;
          }).join('\n');
          results[lang] = `WEBVTT\n\n${vttLines}`;
        } else {
          results[lang] = translatedLines.join('\n');
        }
      }
    } catch (e) {
      console.error(`Subtitle generation error for ${lang}:`, e);
      // Fallback to template
      results[lang] = lines.map((line, i) => {
        const { start, end } = formatTimecode(i, lines.length);
        return `${i + 1}\n${start} --> ${end}\n${line.trim()}\n`;
      }).join('\n');
    }
  }
  return results;
}

// ── Multi-Engine Translation ──────────────────────────────────────
async function translateText(
  text: string,
  sourceLang: string,
  targetLangs: string[],
  engine: string
): Promise<Record<string, string>> {
  const LANG_NAMES: Record<string, string> = {
    en: 'English', ur: 'Urdu', ar: 'Arabic', fa: 'Persian', tr: 'Turkish',
    hi: 'Hindi', ru: 'Russian', bn: 'Bengali', zh: 'Simplified Chinese', ps: 'Pashto',
    sd: 'Sindhi', bal: 'Balochi',
  };

  const modelMap: Record<string, string> = {
    'onspace': 'google/gemini-3-flash-preview',
    'gemini': 'google/gemini-3-flash-preview',
    'gemini-pro': 'google/gemini-3-pro-preview',
    'openai': 'openai/gpt-5-mini',
    'openai-pro': 'openai/gpt-5.1',
    'google': 'google/gemini-2.5-flash-lite',
  };

  const model = modelMap[engine] ?? DEFAULT_MODEL;
  const srcName = LANG_NAMES[sourceLang] ?? sourceLang;
  const results: Record<string, string> = {};

  for (const lang of targetLangs) {
    const targetName = LANG_NAMES[lang] ?? lang;
    try {
      const content = await callOnSpaceAI([
        {
          role: 'system',
          content: `You are a professional linguist and translator specializing in voice dubbing scripts. 
Translate naturally, preserving tone, emotion, and cultural nuance. 
For ${targetName}: use proper script, RTL if applicable, culturally appropriate expressions.
Return ONLY the translated text, no explanations or labels.`,
        },
        {
          role: 'user',
          content: `Translate from ${srcName} to ${targetName}:\n\n${text}`,
        },
      ], model);
      results[lang] = content.trim();
    } catch (e) {
      console.error(`Translation error for ${lang}:`, e);
      results[lang] = `[Translation error for ${targetName}]`;
    }
  }
  return results;
}

// ── BG Music Suggestions ─────────────────────────────────────────
async function generateBgMusicSuggestions(
  videoContext: string,
  mood: string,
  language: string
): Promise<{ title: string; bpm: number; mood: string; description: string; tags: string[] }[]> {
  try {
    const content = await callOnSpaceAI([
      {
        role: 'system',
        content: 'You are a professional music supervisor for films and dubbing studios. Suggest background music based on scene context. Return as JSON array.',
      },
      {
        role: 'user',
        content: `Suggest 5 background music tracks for a ${language} dubbing project. Context: ${videoContext}. Target mood: ${mood}.
Return JSON array with objects: { "title": string, "bpm": number, "mood": string, "description": string, "tags": string[] }
Only return the JSON array, no other text.`,
      },
    ]);
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('BG music suggestions error:', e);
    return [
      { title: 'Cinematic Ambient', bpm: 80, mood: 'Dramatic', description: 'Orchestral background for dramatic scenes', tags: ['cinematic', 'dramatic'] },
      { title: 'Gentle Piano', bpm: 70, mood: 'Emotional', description: 'Soft piano for emotional dialogue', tags: ['piano', 'soft'] },
    ];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, ...params } = body;

    let result: any;

    switch (action) {
      case 'generate_subtitles':
        result = await generateSubtitles(
          params.text,
          params.languages,
          params.style ?? 'standard',
          params.format ?? 'SRT'
        );
        break;

      case 'translate':
        result = await translateText(
          params.text,
          params.sourceLang ?? 'en',
          params.targetLangs,
          params.engine ?? 'onspace'
        );
        break;

      case 'bg_music_suggestions':
        result = await generateBgMusicSuggestions(
          params.context ?? 'general',
          params.mood ?? 'neutral',
          params.language ?? 'en'
        );
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('ai-studio error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
