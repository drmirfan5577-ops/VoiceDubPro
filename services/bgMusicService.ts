// Powered by OnSpace.AI — Background Music Library Service
import { Audio, AVPlaybackStatus } from 'expo-av';

export interface BgTrack {
  id: string;
  title: string;
  category: BgCategory;
  duration: string;
  icon: string;
  // Simulated — in production these would be real audio URIs
  uri?: string;
  bpm?: number;
  mood: string;
}

export type BgCategory = 'cinematic' | 'quran' | 'podcast' | 'news' | 'upbeat' | 'ambient' | 'naat' | 'classical';

export const BG_MUSIC_LIBRARY: BgTrack[] = [
  // Cinematic
  { id: 'c1', title: 'Epic Orchestral Rise',  category: 'cinematic', duration: '3:24', icon: '🎬', mood: 'Dramatic', bpm: 90 },
  { id: 'c2', title: 'Dark Cinematic Tension', category: 'cinematic', duration: '2:55', icon: '🎬', mood: 'Suspense', bpm: 75 },
  { id: 'c3', title: 'Heroic Score',           category: 'cinematic', duration: '4:10', icon: '🎬', mood: 'Heroic',   bpm: 110 },
  // Quran / Religious
  { id: 'q1', title: 'Peaceful Quran BG',      category: 'quran',    duration: '5:00', icon: '🕌', mood: 'Peaceful', bpm: 60 },
  { id: 'q2', title: 'Hamd Nasheed Loop',       category: 'quran',    duration: '3:30', icon: '🕌', mood: 'Spiritual', bpm: 65 },
  { id: 'q3', title: 'Islamic Atmosphere',      category: 'quran',    duration: '4:20', icon: '🕌', mood: 'Meditative', bpm: 55 },
  // Naat
  { id: 'n1', title: 'Naat Background Soft',    category: 'naat',     duration: '3:15', icon: '✨', mood: 'Devotional', bpm: 70 },
  { id: 'n2', title: 'Qawwali Tabla Loop',       category: 'naat',     duration: '4:00', icon: '✨', mood: 'Spiritual',  bpm: 88 },
  // Podcast
  { id: 'p1', title: 'Calm Podcast BG',         category: 'podcast',  duration: '4:45', icon: '🎙', mood: 'Focus',    bpm: 80 },
  { id: 'p2', title: 'Corporate Lo-Fi',          category: 'podcast',  duration: '3:50', icon: '🎙', mood: 'Neutral',  bpm: 85 },
  { id: 'p3', title: 'Warm Acoustic Loop',       category: 'podcast',  duration: '3:20', icon: '🎙', mood: 'Warm',     bpm: 78 },
  // Breaking News
  { id: 'bk1', title: 'News Intro Sting',        category: 'news',     duration: '0:08', icon: '📰', mood: 'Urgent',   bpm: 120 },
  { id: 'bk2', title: 'Breaking Alert Loop',     category: 'news',     duration: '1:30', icon: '📰', mood: 'Alert',    bpm: 115 },
  { id: 'bk3', title: 'News Broadcast BG',       category: 'news',     duration: '2:00', icon: '📰', mood: 'Serious',  bpm: 100 },
  // Upbeat
  { id: 'u1', title: 'Energetic Pop Loop',       category: 'upbeat',   duration: '2:45', icon: '🎵', mood: 'Happy',    bpm: 128 },
  { id: 'u2', title: 'Bhangra Rhythm',           category: 'upbeat',   duration: '3:00', icon: '🎵', mood: 'Festive',  bpm: 135 },
  { id: 'u3', title: 'Dance Mix BG',             category: 'upbeat',   duration: '3:30', icon: '🎵', mood: 'Party',    bpm: 140 },
  // Ambient
  { id: 'a1', title: 'Nature Soundscape',        category: 'ambient',  duration: '6:00', icon: '🌿', mood: 'Calm',     bpm: 0 },
  { id: 'a2', title: 'Rain & Thunder Loop',      category: 'ambient',  duration: '5:30', icon: '🌿', mood: 'Relaxing', bpm: 0 },
  { id: 'a3', title: 'Deep Space Ambient',        category: 'ambient',  duration: '7:00', icon: '🌿', mood: 'Ethereal', bpm: 0 },
  // Classical
  { id: 'cl1', title: 'Classical Strings Loop',  category: 'classical', duration: '3:45', icon: '🎻', mood: 'Elegant',  bpm: 72 },
  { id: 'cl2', title: 'Piano Nocturne BG',        category: 'classical', duration: '4:15', icon: '🎻', mood: 'Romantic', bpm: 68 },
];

export const BG_CATEGORIES: Array<{ id: BgCategory; label: string; icon: string }> = [
  { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { id: 'quran',     label: 'Quran',     icon: '🕌' },
  { id: 'naat',      label: 'Naat',      icon: '✨' },
  { id: 'podcast',   label: 'Podcast',   icon: '🎙' },
  { id: 'news',      label: 'News',      icon: '📰' },
  { id: 'upbeat',    label: 'Upbeat',    icon: '🎵' },
  { id: 'ambient',   label: 'Ambient',   icon: '🌿' },
  { id: 'classical', label: 'Classical', icon: '🎻' },
];

// Simple BG music player state manager
let bgSound: Audio.Sound | null = null;
let currentBgId: string | null = null;

export async function playBgTrack(track: BgTrack, volume = 0.3): Promise<void> {
  try {
    if (bgSound) {
      await bgSound.unloadAsync();
      bgSound = null;
    }
    currentBgId = track.id;
    // In production, load track.uri. Here we just mark it as "playing"
    // bgSound would be created with a real URI
  } catch {}
}

export async function stopBgTrack(): Promise<void> {
  try {
    if (bgSound) {
      await bgSound.stopAsync();
      await bgSound.unloadAsync();
      bgSound = null;
    }
    currentBgId = null;
  } catch {}
}

export async function setBgVolume(vol: number): Promise<void> {
  try {
    await bgSound?.setVolumeAsync(vol);
  } catch {}
}

export function getCurrentBgId(): string | null {
  return currentBgId;
}
