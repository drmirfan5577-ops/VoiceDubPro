// Powered by OnSpace.AI — Waveform Trim Editor
import React, { useState, useRef, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, Pressable, PanResponder,
  Animated, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { GoldButton } from '@/components/ui/GoldButton';

const { width: SCREEN_W } = Dimensions.get('window');
const EDITOR_WIDTH = SCREEN_W - Spacing.md * 2 - 32;
const HANDLE_SIZE = 24;

interface TrimRegion {
  start: number; // 0-1
  end: number;   // 0-1
}

interface WaveformTrimEditorProps {
  waveformData: number[];
  durationSeconds: number;
  onTrimChange?: (start: number, end: number) => void;
  onApply?: (start: number, end: number) => void;
  onClose?: () => void;
  height?: number;
}

export const WaveformTrimEditor = memo(({
  waveformData,
  durationSeconds,
  onTrimChange,
  onApply,
  onClose,
  height = 100,
}: WaveformTrimEditorProps) => {
  const [region, setRegion] = useState<TrimRegion>({ start: 0.1, end: 0.9 });
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null);
  const regionRef = useRef(region);
  regionRef.current = region;

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const makePanResponder = useCallback((handle: 'start' | 'end') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setActiveHandle(handle),
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx / EDITOR_WIDTH;
        const current = regionRef.current;
        if (handle === 'start') {
          const newStart = clamp(current.start + dx, 0, current.end - 0.05);
          const updated = { ...current, start: newStart };
          setRegion(updated);
          onTrimChange?.(updated.start, updated.end);
        } else {
          const newEnd = clamp(current.end + dx, current.start + 0.05, 1);
          const updated = { ...current, end: newEnd };
          setRegion(updated);
          onTrimChange?.(updated.start, updated.end);
        }
      },
      onPanResponderRelease: () => setActiveHandle(null),
    }), [onTrimChange]);

  const startPan = makePanResponder('start');
  const endPan = makePanResponder('end');

  const startPx = region.start * EDITOR_WIDTH;
  const endPx = region.end * EDITOR_WIDTH;
  const selectionW = Math.max(0, endPx - startPx);

  const trimStart = region.start * durationSeconds;
  const trimEnd = region.end * durationSeconds;
  const trimDuration = trimEnd - trimStart;

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${String(sec).padStart(2, '0')}.${ms}`;
  };

  return (
    <View style={styles.container}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <MaterialIcons name="content-cut" size={18} color={Colors.primary} />
        <Text style={styles.title}>Waveform Trim Editor</Text>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Waveform + trim handles */}
      <View style={[styles.waveContainer, { height }]}>
        {/* Waveform bars */}
        <View style={styles.barsRow}>
          {(waveformData.length ? waveformData : Array.from({ length: 80 }, () => 0.3 + Math.random() * 0.5)).map((amp, i) => {
            const xPos = (i / Math.max(1, waveformData.length - 1));
            const inSelection = xPos >= region.start && xPos <= region.end;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: Math.max(3, amp * (height - 12)),
                    backgroundColor: inSelection ? Colors.primary : Colors.border,
                    opacity: inSelection ? 1 : 0.35,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Selection overlay */}
        <View style={[
          styles.selection,
          { left: startPx, width: selectionW },
        ]} />

        {/* Dimmed regions */}
        <View style={[styles.dimLeft, { width: startPx }]} />
        <View style={[styles.dimRight, { right: 0, width: EDITOR_WIDTH - endPx }]} />

        {/* Start handle */}
        <View
          {...startPan.panHandlers}
          style={[styles.handle, styles.handleStart, { left: startPx - HANDLE_SIZE / 2 }]}
        >
          <View style={[styles.handleBar, { backgroundColor: Colors.success }]} />
          <View style={[styles.handleKnob, { backgroundColor: Colors.success }]}>
            <MaterialIcons name="chevron-left" size={12} color="#fff" />
          </View>
        </View>

        {/* End handle */}
        <View
          {...endPan.panHandlers}
          style={[styles.handle, styles.handleEnd, { left: endPx - HANDLE_SIZE / 2 }]}
        >
          <View style={[styles.handleBar, { backgroundColor: Colors.error }]} />
          <View style={[styles.handleKnob, { backgroundColor: Colors.error }]}>
            <MaterialIcons name="chevron-right" size={12} color="#fff" />
          </View>
        </View>

        {/* Center line */}
        <View style={styles.centerLine} />
      </View>

      {/* Time labels */}
      <View style={styles.timeLabels}>
        <View style={styles.timeTag}>
          <MaterialIcons name="skip-previous" size={12} color={Colors.success} />
          <Text style={[styles.timeText, { color: Colors.success }]}>{fmtTime(trimStart)}</Text>
        </View>
        <View style={styles.timeCenter}>
          <Text style={styles.durationText}>{fmtTime(trimDuration)}</Text>
          <Text style={styles.durationLabel}>selected duration</Text>
        </View>
        <View style={styles.timeTag}>
          <Text style={[styles.timeText, { color: Colors.error }]}>{fmtTime(trimEnd)}</Text>
          <MaterialIcons name="skip-next" size={12} color={Colors.error} />
        </View>
      </View>

      {/* Loop points info */}
      <View style={styles.loopRow}>
        <View style={styles.loopChip}>
          <MaterialIcons name="content-cut" size={12} color={Colors.textMuted} />
          <Text style={styles.loopText}>Trim: {(region.start * 100).toFixed(0)}% – {(region.end * 100).toFixed(0)}%</Text>
        </View>
        <Pressable
          onPress={() => { setRegion({ start: 0, end: 1 }); onTrimChange?.(0, 1); }}
          style={styles.resetBtn}
        >
          <MaterialIcons name="refresh" size={12} color={Colors.primary} />
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>

      {/* Preset trim points */}
      <View style={styles.presetsRow}>
        <Text style={styles.presetsLabel}>Quick Trim:</Text>
        {[
          { label: 'Remove Silence', start: 0.05, end: 0.95 },
          { label: 'First Half', start: 0, end: 0.5 },
          { label: 'Second Half', start: 0.5, end: 1 },
          { label: 'Middle 50%', start: 0.25, end: 0.75 },
        ].map(p => (
          <Pressable
            key={p.label}
            onPress={() => { setRegion({ start: p.start, end: p.end }); onTrimChange?.(p.start, p.end); }}
            style={styles.presetChip}
          >
            <Text style={styles.presetText}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {onClose ? (
          <GoldButton label="Cancel" onPress={onClose} variant="ghost" size="md" />
        ) : null}
        <GoldButton
          label="✂ Apply Trim"
          onPress={() => onApply?.(region.start, region.end)}
          size="md"
          fullWidth={!onClose}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: 4,
  },
  title: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  waveContainer: {
    width: EDITOR_WIDTH,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 2,
  },
  bar: { flex: 1, marginHorizontal: 0.5, borderRadius: 1 },
  selection: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary + '22',
    borderWidth: 1,
    borderColor: Colors.primary + '66',
  },
  dimLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: Colors.background + 'AA' },
  dimRight: { position: 'absolute', top: 0, bottom: 0, backgroundColor: Colors.background + 'AA' },
  handle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: HANDLE_SIZE,
    alignItems: 'center',
    zIndex: 10,
  },
  handleStart: {},
  handleEnd: {},
  handleBar: { width: 2, flex: 1, opacity: 0.8 },
  handleKnob: {
    position: 'absolute',
    top: '50%',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -HANDLE_SIZE / 2,
    ...Shadow.sm,
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
    opacity: 0.4,
  },
  timeLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: Typography.xs, fontWeight: Typography.semibold, fontVariant: ['tabular-nums'] },
  timeCenter: { alignItems: 'center' },
  durationText: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.bold, fontVariant: ['tabular-nums'] },
  durationLabel: { color: Colors.textMuted, fontSize: 9 },
  loopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loopChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  loopText: { color: Colors.textMuted, fontSize: Typography.xs },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetText: { color: Colors.primary, fontSize: Typography.xs },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  presetsLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  presetChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  presetText: { color: Colors.textSecondary, fontSize: 10 },
  actions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
});
