// Powered by OnSpace.AI — Real Recording Hook
import { useState, useRef, useCallback, useEffect } from 'react';
import { recordingService, RecordingResult } from '@/services/recordingService';

export interface RecordingState {
  isRecording: boolean;
  durationMs: number;
  meteringLevel: number;
  meteringHistory: number[];
  lastRecording: RecordingResult | null;
  error: string | null;
}

export function useRecorder() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    durationMs: 0,
    meteringLevel: 0,
    meteringHistory: [],
    lastRecording: null,
    error: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    setState(s => ({ ...s, error: null, meteringHistory: [], durationMs: 0, meteringLevel: 0 }));

    const ok = await recordingService.startRecording((level) => {
      setState(s => ({
        ...s,
        meteringLevel: level,
        meteringHistory: [...s.meteringHistory.slice(-80), level],
      }));
    });

    if (!ok) {
      setState(s => ({ ...s, error: 'Microphone permission denied or unavailable' }));
      return false;
    }

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setState(s => ({ ...s, durationMs: Date.now() - startTimeRef.current }));
    }, 100);

    setState(s => ({ ...s, isRecording: true }));
    return true;
  }, []);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const result = await recordingService.stopRecording();
    setState(s => ({
      ...s,
      isRecording: false,
      meteringLevel: 0,
      lastRecording: result,
    }));
    return result;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatDuration = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const ms3 = Math.floor((ms % 1000) / 10);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms3).padStart(2, '0')}`;
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    formatDuration,
    formattedDuration: formatDuration(state.durationMs),
  };
}
