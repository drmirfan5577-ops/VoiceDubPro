// Powered by OnSpace.AI
import React, { createContext, useState, useCallback, ReactNode } from 'react';

export interface AudioTrack {
  id: string;
  name: string;
  language: string;
  duration: number;
  volume: number;
  isMuted: boolean;
  isPrimary: boolean;
  waveformData: number[];
  effectPreset: EffectPreset;
  audioUri?: string;
}

export interface SavedVoice {
  id: string;
  name: string;
  uri: string;
  duration: number;
  language: string;
  createdAt: number;
  type: 'audio' | 'video';
  thumbnail?: string;
}

export interface EffectPreset {
  reverb: number;
  eq_bass: number;
  eq_mid: number;
  eq_treble: number;
  pitch: number;
  compress: number;
  noise_gate: number;
  vocal_enhance: number;
  spatial: number;
  volume: number;
}

export interface DubProject {
  id: string;
  name: string;
  videoUri: string | null;
  videoDuration: number;
  videoThumbnail: string | null;
  tracks: AudioTrack[];
  createdAt: number;
  exportQuality: ExportQuality;
  mode: StudioMode;
}

export type StudioMode = 'studio' | 'concert' | 'cinema';
export type ExportQuality = '1080p' | '4K' | 'UltraHD' | '8K';
export type BufferSize = 64 | 128 | 256 | 512;

const DEFAULT_EFFECTS: EffectPreset = {
  reverb: 20, eq_bass: 0, eq_mid: 0, eq_treble: 0,
  pitch: 0, compress: 30, noise_gate: 15,
  vocal_enhance: 40, spatial: 20, volume: 80,
};

const CONCERT_EFFECTS: EffectPreset = {
  reverb: 65, eq_bass: 4, eq_mid: 2, eq_treble: 3,
  pitch: 0, compress: 50, noise_gate: 10,
  vocal_enhance: 60, spatial: 75, volume: 90,
};

const CINEMA_EFFECTS: EffectPreset = {
  reverb: 35, eq_bass: 2, eq_mid: 0, eq_treble: 1,
  pitch: 0, compress: 60, noise_gate: 25,
  vocal_enhance: 70, spatial: 45, volume: 85,
};

export const EFFECT_PRESETS: Record<StudioMode, EffectPreset> = {
  studio: DEFAULT_EFFECTS,
  concert: CONCERT_EFFECTS,
  cinema: CINEMA_EFFECTS,
};

function generateWaveform(length = 60): number[] {
  return Array.from({ length }, () => Math.random() * 0.8 + 0.1);
}

function createMockProjects(): DubProject[] {
  return [
    {
      id: '1',
      name: 'Arabic Drama S01E03',
      videoUri: null,
      videoDuration: 2640,
      videoThumbnail: null,
      tracks: [
        {
          id: 't1', name: 'English Dub', language: 'en',
          duration: 2640, volume: 0.85, isMuted: false, isPrimary: true,
          waveformData: generateWaveform(), effectPreset: { ...CONCERT_EFFECTS },
        },
        {
          id: 't2', name: 'Urdu Dub', language: 'ur',
          duration: 2640, volume: 0.80, isMuted: false, isPrimary: false,
          waveformData: generateWaveform(), effectPreset: { ...DEFAULT_EFFECTS },
        },
      ],
      createdAt: Date.now() - 86400000 * 2,
      exportQuality: '4K',
      mode: 'cinema',
    },
    {
      id: '2',
      name: 'Bollywood Hit 2026',
      videoUri: null,
      videoDuration: 9480,
      videoThumbnail: null,
      tracks: [
        {
          id: 't3', name: 'Hindi Master', language: 'hi',
          duration: 9480, volume: 0.90, isMuted: false, isPrimary: true,
          waveformData: generateWaveform(), effectPreset: { ...CINEMA_EFFECTS },
        },
      ],
      createdAt: Date.now() - 86400000 * 5,
      exportQuality: 'UltraHD',
      mode: 'concert',
    },
  ];
}

interface StudioContextType {
  projects: DubProject[];
  activeProject: DubProject | null;
  savedVoices: SavedVoice[];
  isRecording: boolean;
  isPlaying: boolean;
  bufferSize: BufferSize;
  bufferLevel: number;
  playbackPosition: number;
  masterVolume: number;
  playbackSpeed: number;
  isCloudSynced: boolean;
  setActiveProject: (project: DubProject | null) => void;
  createProject: (name: string) => DubProject;
  deleteProject: (id: string) => void;
  startRecording: (trackId: string) => void;
  stopRecording: () => void;
  togglePlay: () => void;
  setBufferSize: (size: BufferSize) => void;
  setMasterVolume: (vol: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  updateTrackVolume: (projectId: string, trackId: string, vol: number) => void;
  toggleTrackMute: (projectId: string, trackId: string) => void;
  updateTrackEffects: (projectId: string, trackId: string, effects: Partial<EffectPreset>) => void;
  addTrack: (projectId: string, language: string) => void;
  deleteTrack: (projectId: string, trackId: string) => void;
  setProjectMode: (projectId: string, mode: StudioMode) => void;
  setExportQuality: (projectId: string, quality: ExportQuality) => void;
  saveVoice: (voice: Omit<SavedVoice, 'id' | 'createdAt'>) => void;
  deleteSavedVoice: (id: string) => void;
  setCloudSynced: (val: boolean) => void;
}

export const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<DubProject[]>(createMockProjects());
  const [activeProject, setActiveProjectState] = useState<DubProject | null>(null);
  const [savedVoices, setSavedVoices] = useState<SavedVoice[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bufferSize, setBufferSizeState] = useState<BufferSize>(256);
  const [bufferLevel, setBufferLevel] = useState(0.72);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [playbackSpeed, setPlaybackSpeedState] = useState(1.0);
  const [isCloudSynced, setCloudSynced] = useState(false);

  const setActiveProject = useCallback((project: DubProject | null) => {
    setActiveProjectState(project);
    setIsPlaying(false);
    setPlaybackPosition(0);
  }, []);

  const createProject = useCallback((name: string): DubProject => {
    const project: DubProject = {
      id: Date.now().toString(),
      name,
      videoUri: null,
      videoDuration: 0,
      videoThumbnail: null,
      tracks: [],
      createdAt: Date.now(),
      exportQuality: 'UltraHD',
      mode: 'studio',
    };
    setProjects(prev => [project, ...prev]);
    return project;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setActiveProjectState(prev => prev?.id === id ? null : prev);
  }, []);

  const startRecording = useCallback((_trackId: string) => {
    setIsRecording(true);
    setIsPlaying(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const setBufferSize = useCallback((size: BufferSize) => {
    setBufferSizeState(size);
    setBufferLevel(size === 64 ? 0.4 : size === 128 ? 0.55 : size === 256 ? 0.72 : 0.88);
  }, []);

  const setMasterVolume = useCallback((vol: number) => setMasterVolumeState(vol), []);
  const setPlaybackSpeed = useCallback((speed: number) => setPlaybackSpeedState(speed), []);

  const updateTrackVolume = useCallback((projectId: string, trackId: string, vol: number) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : {
        ...p,
        tracks: p.tracks.map(t => t.id === trackId ? { ...t, volume: vol } : t),
      }
    ));
  }, []);

  const toggleTrackMute = useCallback((projectId: string, trackId: string) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : {
        ...p,
        tracks: p.tracks.map(t => t.id === trackId ? { ...t, isMuted: !t.isMuted } : t),
      }
    ));
  }, []);

  const updateTrackEffects = useCallback((projectId: string, trackId: string, effects: Partial<EffectPreset>) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : {
        ...p,
        tracks: p.tracks.map(t =>
          t.id === trackId ? { ...t, effectPreset: { ...t.effectPreset, ...effects } } : t
        ),
      }
    ));
  }, []);

  const addTrack = useCallback((projectId: string, language: string) => {
    const track: AudioTrack = {
      id: Date.now().toString(),
      name: `Track ${Date.now()}`,
      language,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      isPrimary: false,
      waveformData: Array.from({ length: 60 }, () => Math.random() * 0.3 + 0.05),
      effectPreset: { ...DEFAULT_EFFECTS },
    };
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : { ...p, tracks: [...p.tracks, track] }
    ));
  }, []);

  const deleteTrack = useCallback((projectId: string, trackId: string) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
    ));
  }, []);

  const setProjectMode = useCallback((projectId: string, mode: StudioMode) => {
    setProjects(prev => prev.map(p => p.id !== projectId ? p : { ...p, mode }));
  }, []);

  const setExportQuality = useCallback((projectId: string, quality: ExportQuality) => {
    setProjects(prev => prev.map(p => p.id !== projectId ? p : { ...p, exportQuality: quality }));
  }, []);

  const saveVoice = useCallback((voice: Omit<SavedVoice, 'id' | 'createdAt'>) => {
    setSavedVoices(prev => {
      // max 5 saved voices
      const newVoice: SavedVoice = { ...voice, id: Date.now().toString(), createdAt: Date.now() };
      const updated = [newVoice, ...prev];
      return updated.slice(0, 5);
    });
  }, []);

  const deleteSavedVoice = useCallback((id: string) => {
    setSavedVoices(prev => prev.filter(v => v.id !== id));
  }, []);

  return (
    <StudioContext.Provider value={{
      projects, activeProject, savedVoices,
      isRecording, isPlaying,
      bufferSize, bufferLevel, playbackPosition, masterVolume, playbackSpeed,
      isCloudSynced,
      setActiveProject, createProject, deleteProject,
      startRecording, stopRecording, togglePlay,
      setBufferSize, setMasterVolume, setPlaybackSpeed,
      updateTrackVolume, toggleTrackMute, updateTrackEffects,
      addTrack, deleteTrack, setProjectMode, setExportQuality,
      saveVoice, deleteSavedVoice, setCloudSynced,
    }}>
      {children}
    </StudioContext.Provider>
  );
}
