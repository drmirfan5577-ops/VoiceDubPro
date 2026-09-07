// Powered by OnSpace.AI — Real-time Frequency / Amplitude / Pitch / Quality / Sync Visualizer
import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface FrequencyVisualizerProps {
  isActive: boolean;
  meteringLevel?: number;   // 0-1 live level
  mode?: 'spectrum' | 'oscilloscope' | 'waveform';
  height?: number;
  showPitch?: boolean;
  showAmplitude?: boolean;
  showSync?: boolean;
}

const FREQ_BANDS = [
  { label: '32',   color: '#E74C3C', desc: 'Sub' },
  { label: '64',   color: '#E67E22', desc: 'Bass' },
  { label: '125',  color: '#F39C12', desc: 'Low' },
  { label: '250',  color: '#D4A017', desc: 'Low-M' },
  { label: '500',  color: '#F0C040', desc: 'Mid' },
  { label: '1k',   color: '#2ECC71', desc: 'High-M' },
  { label: '2k',   color: '#27AE60', desc: 'Pres' },
  { label: '4k',   color: '#3498DB', desc: 'Air' },
  { label: '8k',   color: '#2980B9', desc: 'Treble' },
  { label: '16k',  color: '#9B59B6', desc: 'Ultra' },
  { label: '20k',  color: '#8E44AD', desc: 'Ext' },
];

// Simulate frequency-aware response per band
function generateBandLevel(band: number, master: number, time: number): number {
  const shape = [0.85, 0.80, 0.72, 0.65, 0.58, 0.50, 0.45, 0.38, 0.30, 0.20, 0.12][band] ?? 0.3;
  const wave1 = Math.sin(time * 0.004 + band * 1.1) * 0.18;
  const wave2 = Math.sin(time * 0.007 + band * 0.5) * 0.10;
  const burst = (Math.random() > 0.97) ? 0.15 : 0;
  return Math.max(0.04, Math.min(1, (shape + wave1 + wave2 + burst) * master));
}

// Estimate pitch from frequency peak simulation
function estimatePitch(bandLevels: number[]): { note: string; hz: number; quality: number } {
  const peak = bandLevels.reduce((maxI, v, i, arr) => v > arr[maxI] ? i : maxI, 0);
  const baseHz = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000][peak];
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteIdx = Math.floor(Math.log2(baseHz / 16.35) * 12) % 12;
  const octave = Math.floor(Math.log2(baseHz / 16.35));
  return {
    note: `${notes[Math.abs(noteIdx) % 12]}${Math.min(octave, 8)}`,
    hz: baseHz,
    quality: Math.round(bandLevels.reduce((a, b) => a + b, 0) / bandLevels.length * 100),
  };
}

export const FrequencyVisualizer = memo(({
  isActive,
  meteringLevel = 0,
  mode = 'spectrum',
  height = 160,
  showPitch = true,
  showAmplitude = true,
  showSync = false,
}: FrequencyVisualizerProps) => {
  const bandAnims = useRef(FREQ_BANDS.map(() => new Animated.Value(0.04))).current;
  const timeRef = useRef(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [liveData, setLiveData] = useState({
    pitch: { note: 'A4', hz: 440, quality: 0 },
    amplitude: 0,
    rms: 0,
    dbfs: -60,
    syncStatus: 'idle' as 'idle' | 'good' | 'warning' | 'clip',
    bandLevels: FREQ_BANDS.map(() => 0.04),
  });

  useEffect(() => {
    if (isActive) {
      animRef.current = setInterval(() => {
        timeRef.current += 60;
        const master = Math.max(0.2, meteringLevel * 2.5);
        const newLevels = FREQ_BANDS.map((_, i) => generateBandLevel(i, master, timeRef.current));

        bandAnims.forEach((anim, i) => {
          Animated.spring(anim, {
            toValue: newLevels[i],
            useNativeDriver: false,
            speed: 28,
            bounciness: 1,
          }).start();
        });

        const amplitude = meteringLevel;
        const rms = Math.sqrt(newLevels.reduce((a, b) => a + b * b, 0) / newLevels.length);
        const dbfs = amplitude > 0 ? Math.round(20 * Math.log10(amplitude)) : -60;

        setLiveData({
          pitch: estimatePitch(newLevels),
          amplitude,
          rms,
          dbfs,
          syncStatus: amplitude > 0.95 ? 'clip' : amplitude > 0.75 ? 'warning' : amplitude > 0.1 ? 'good' : 'idle',
          bandLevels: newLevels,
        });
      }, 80);
    } else {
      if (animRef.current) clearInterval(animRef.current);
      bandAnims.forEach(anim => {
        Animated.spring(anim, { toValue: 0.04, useNativeDriver: false, speed: 6, bounciness: 0 }).start();
      });
      setLiveData(d => ({ ...d, amplitude: 0, rms: 0, dbfs: -60, syncStatus: 'idle' }));
    }
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [isActive, meteringLevel]);

  const maxBarH = height - (showPitch ? 100 : 60);
  const syncColor = { idle: Colors.textMuted, good: Colors.success, warning: Colors.warning, clip: Colors.error }[liveData.syncStatus];
  const syncLabel = { idle: 'IDLE', good: 'SYNC', warning: 'HOT', clip: 'CLIP' }[liveData.syncStatus];

  return (
    <View style={[styles.container, { height }]}>
      {/* ── Top metrics row ── */}
      <View style={styles.metricsRow}>
        {/* VU + dBFS */}
        <View style={styles.vuBlock}>
          <Text style={styles.metricLabel}>VU · dBFS</Text>
          <View style={styles.vuTrack}>
            <View style={[
              styles.vuFill,
              {
                width: `${Math.min(liveData.amplitude * 100, 100)}%`,
                backgroundColor: liveData.syncStatus === 'clip' ? Colors.error :
                  liveData.syncStatus === 'warning' ? Colors.warning : Colors.primary,
              }
            ]} />
          </View>
          <Text style={styles.vuDb}>{liveData.dbfs > -60 ? `${liveData.dbfs}dB` : '-∞'}</Text>
        </View>

        {/* RMS */}
        {showAmplitude ? (
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>RMS</Text>
            <Text style={[styles.metricValue, { color: Colors.info }]}>
              {Math.round(liveData.rms * 100)}%
            </Text>
          </View>
        ) : null}

        {/* Pitch / Note */}
        {showPitch ? (
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Pitch</Text>
            <Text style={[styles.metricValue, { color: Colors.primary }]}>
              {isActive ? liveData.pitch.note : '—'}
            </Text>
          </View>
        ) : null}

        {/* Hz */}
        {showPitch ? (
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Hz</Text>
            <Text style={[styles.metricValue, { color: Colors.primaryLight, fontSize: Typography.xs }]}>
              {isActive ? `${liveData.pitch.hz}` : '—'}
            </Text>
          </View>
        ) : null}

        {/* Quality */}
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>Quality</Text>
          <Text style={[styles.metricValue, {
            color: liveData.pitch.quality > 70 ? Colors.success :
              liveData.pitch.quality > 40 ? Colors.warning : Colors.textMuted
          }]}>
            {isActive ? `${liveData.pitch.quality}%` : '—'}
          </Text>
        </View>

        {/* Sync indicator */}
        <View style={styles.syncBlock}>
          <View style={[styles.syncDot, { backgroundColor: syncColor }]} />
          <Text style={[styles.syncLabel, { color: syncColor }]}>{syncLabel}</Text>
        </View>
      </View>

      {/* ── Spectrum bars ── */}
      <View style={[styles.spectrum, { height: maxBarH }]}>
        {FREQ_BANDS.map((band, i) => (
          <View key={band.label} style={styles.bandCol}>
            {/* Peak hold line */}
            <Animated.View
              style={[
                styles.peakLine,
                {
                  bottom: bandAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, maxBarH - 4],
                  }),
                  backgroundColor: band.color,
                },
              ]}
            />
            {/* Main bar */}
            <Animated.View
              style={[
                styles.bandBar,
                {
                  height: bandAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, maxBarH],
                  }),
                  backgroundColor: band.color,
                  opacity: isActive ? 1 : 0.3,
                },
              ]}
            />
            <Text style={styles.bandLabel}>{band.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Amplitude bar at bottom ── */}
      {showAmplitude ? (
        <View style={styles.ampRow}>
          <Text style={styles.ampLabel}>AMP</Text>
          <View style={styles.ampTrack}>
            {/* Green safe zone */}
            <View style={[styles.ampZone, { left: 0, width: '75%', backgroundColor: Colors.success + '22' }]} />
            {/* Yellow warning zone */}
            <View style={[styles.ampZone, { left: '75%', width: '15%', backgroundColor: Colors.warning + '22' }]} />
            {/* Red clip zone */}
            <View style={[styles.ampZone, { left: '90%', width: '10%', backgroundColor: Colors.error + '33' }]} />
            <View style={[
              styles.ampFill,
              {
                width: `${Math.min(liveData.amplitude * 100, 100)}%`,
                backgroundColor: liveData.syncStatus === 'clip' ? Colors.error :
                  liveData.syncStatus === 'warning' ? Colors.warning : Colors.success,
              }
            ]} />
          </View>
          <Text style={styles.ampValue}>{Math.round(liveData.amplitude * 100)}%</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    gap: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  vuBlock: { flex: 2, gap: 2 },
  vuTrack: { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' },
  vuFill: { height: '100%', borderRadius: 3 },
  vuDb: { color: Colors.textMuted, fontSize: 8, textAlign: 'right', fontVariant: ['tabular-nums'] },
  metricBlock: { alignItems: 'center', minWidth: 28 },
  metricLabel: { color: Colors.textMuted, fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { color: Colors.primary, fontSize: 10, fontWeight: '700', fontVariant: ['tabular-nums'] },
  syncBlock: { alignItems: 'center', gap: 2 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncLabel: { fontSize: 7, fontWeight: '700' },
  spectrum: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  bandCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  bandBar: { width: '78%', minWidth: 3, borderRadius: 2, marginBottom: 2 },
  peakLine: { position: 'absolute', height: 1.5, width: '90%', borderRadius: 1, opacity: 0.7 },
  bandLabel: { color: Colors.textMuted, fontSize: 6, marginTop: 1 },
  ampRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 2, marginTop: 2 },
  ampLabel: { color: Colors.textMuted, fontSize: 7, fontWeight: '700', width: 22 },
  ampTrack: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', position: 'relative' },
  ampZone: { position: 'absolute', top: 0, bottom: 0 },
  ampFill: { height: '100%', borderRadius: 3 },
  ampValue: { color: Colors.textMuted, fontSize: 8, width: 26, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
