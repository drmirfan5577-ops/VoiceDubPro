// Powered by OnSpace.AI — Media Player Hook
import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

export interface PlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  positionMs: number;
  durationMs: number;
  volume: number;
  rate: number;
  isMuted: boolean;
  isLooping: boolean;
  error: string | null;
}

export function useMediaPlayer() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [state, setState] = useState<PlayerState>({
    isLoaded: false, isPlaying: false, isPaused: false,
    positionMs: 0, durationMs: 0, volume: 1.0,
    rate: 1.0, isMuted: false, isLooping: false, error: null,
  });

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setState(s => ({ ...s, isLoaded: false, error: status.error ?? null }));
      return;
    }
    const s = status as AVPlaybackStatusSuccess;
    setState(prev => ({
      ...prev,
      isLoaded: true,
      isPlaying: s.isPlaying,
      isPaused: !s.isPlaying && s.positionMillis > 0,
      positionMs: s.positionMillis,
      durationMs: s.durationMillis ?? 0,
      error: null,
    }));
    if (s.didJustFinish) {
      setState(prev => ({ ...prev, isPlaying: false, positionMs: 0 }));
    }
  }, []);

  const load = useCallback(async (uri: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { progressUpdateIntervalMillis: 100 },
        onPlaybackStatus
      );
      soundRef.current = sound;
      setState(s => ({ ...s, isLoaded: true, error: null }));
    } catch (e: any) {
      setState(s => ({ ...s, error: e?.message ?? 'Load failed' }));
    }
  }, [onPlaybackStatus]);

  const play = useCallback(async () => {
    try { await soundRef.current?.playAsync(); } catch {}
  }, []);

  const pause = useCallback(async () => {
    try { await soundRef.current?.pauseAsync(); } catch {}
  }, []);

  const stop = useCallback(async () => {
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.setPositionAsync(0);
    } catch {}
  }, []);

  const seekTo = useCallback(async (ms: number) => {
    try { await soundRef.current?.setPositionAsync(ms); } catch {}
  }, []);

  const setVolume = useCallback(async (vol: number) => {
    setState(s => ({ ...s, volume: vol }));
    try { await soundRef.current?.setVolumeAsync(vol); } catch {}
  }, []);

  const setRate = useCallback(async (rate: number) => {
    setState(s => ({ ...s, rate }));
    try { await soundRef.current?.setRateAsync(rate, true); } catch {}
  }, []);

  const toggleMute = useCallback(async () => {
    const next = !state.isMuted;
    setState(s => ({ ...s, isMuted: next }));
    try { await soundRef.current?.setIsMutedAsync(next); } catch {}
  }, [state.isMuted]);

  const toggleLoop = useCallback(async () => {
    const next = !state.isLooping;
    setState(s => ({ ...s, isLooping: next }));
    try { await soundRef.current?.setIsLoopingAsync(next); } catch {}
  }, [state.isLooping]);

  const unload = useCallback(async () => {
    try {
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setState(s => ({ ...s, isLoaded: false, isPlaying: false, positionMs: 0, durationMs: 0 }));
    } catch {}
  }, []);

  useEffect(() => { return () => { soundRef.current?.unloadAsync(); }; }, []);

  const progress = state.durationMs > 0 ? state.positionMs / state.durationMs : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return {
    ...state,
    progress,
    load, play, pause, stop, seekTo,
    setVolume, setRate, toggleMute, toggleLoop, unload,
    formatTime,
    positionFormatted: formatTime(state.positionMs),
    durationFormatted: formatTime(state.durationMs),
  };
}
