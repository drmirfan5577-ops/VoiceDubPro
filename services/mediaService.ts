// Powered by OnSpace.AI — Media Service (Upload, Player, TTS)
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import { Audio, AVPlaybackStatus } from 'expo-av';

export interface MediaFile {
  uri: string;
  name: string;
  type: 'audio' | 'video' | 'unknown';
  size?: number;
  duration?: number;
  mimeType?: string;
}

// ─── Upload ───────────────────────────────────────────────────────
export async function pickVideoFromGallery(): Promise<MediaFile | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `video_${Date.now()}.mp4`,
    type: 'video',
    duration: asset.duration ?? 0,
    mimeType: asset.mimeType ?? 'video/mp4',
  };
}

export async function pickAudioFromStorage(): Promise<MediaFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['audio/*', 'video/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const isAudio = asset.mimeType?.startsWith('audio/') ?? false;
  const isVideo = asset.mimeType?.startsWith('video/') ?? false;

  return {
    uri: asset.uri,
    name: asset.name,
    type: isAudio ? 'audio' : isVideo ? 'video' : 'unknown',
    size: asset.size,
    mimeType: asset.mimeType ?? 'audio/mpeg',
  };
}

export async function pickAnyFile(): Promise<MediaFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  const isAudio = asset.mimeType?.startsWith('audio/') ?? false;
  const isVideo = asset.mimeType?.startsWith('video/') ?? false;

  return {
    uri: asset.uri,
    name: asset.name,
    type: isAudio ? 'audio' : isVideo ? 'video' : 'unknown',
    size: asset.size,
    mimeType: asset.mimeType,
  };
}

// ─── TTS ──────────────────────────────────────────────────────────
const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-US', ur: 'ur-PK', ar: 'ar-SA', fa: 'fa-IR',
  tr: 'tr-TR', hi: 'hi-IN', ru: 'ru-RU', bn: 'bn-BD',
  zh: 'zh-CN', ps: 'ps-AF', sd: 'sd-IN', bal: 'ur-PK',
};

export function speakText(text: string, lang: string, rate = 0.9, pitch = 1.0): void {
  Speech.stop();
  Speech.speak(text, {
    language: SPEECH_LANG_MAP[lang] ?? 'en-US',
    rate,
    pitch,
    onError: (e) => console.error('TTS error:', e),
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export function isSpeaking(): Promise<boolean> {
  return Speech.isSpeakingAsync();
}

// ─── Audio Player ─────────────────────────────────────────────────
let soundObject: Audio.Sound | null = null;

export async function playAudioFile(
  uri: string,
  onStatus?: (status: AVPlaybackStatus) => void
): Promise<void> {
  try {
    if (soundObject) {
      await soundObject.unloadAsync();
      soundObject = null;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, progressUpdateIntervalMillis: 100 },
      onStatus
    );
    soundObject = sound;
  } catch (e) {
    console.error('playAudioFile error:', e);
  }
}

export async function stopAudioPlayback(): Promise<void> {
  try {
    if (soundObject) {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
    }
  } catch {}
}

// ─── File Info ────────────────────────────────────────────────────
export async function getFileInfo(uri: string) {
  try {
    return await FileSystem.getInfoAsync(uri, { size: true });
  } catch {
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
