// Powered by OnSpace.AI — Voice Recording Mixer
// Multi-layer takes: record multiple takes, blend/crossfade, export composite
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { GoldButton } from '@/components/ui/GoldButton';

export interface RecordingTake {
  id: string;
  name: string;
  durationMs: number;
  uri?: string;
  volume: number;      // 0-1
  fadeIn: number;      // 0-1 (portion of duration)
  fadeOut: number;     // 0-1
  isMuted: boolean;
  isSelected: boolean; // selected for export
  waveform: number[];  // 0-1 amplitude data
  color: string;
}

const TAKE_COLORS = [
  Colors.primary,     // gold
  '#3498DB',          // blue
  '#2ECC71',          // green
  '#E91E63',          // pink
  '#9B59B6',          // purple
  '#E67E22',          // orange
];

interface RecordingMixerProps {
  takes: RecordingTake[];
  isRecording: boolean;
  onAddTake: () => void;
  onDeleteTake: (id: string) => void;
  onUpdateVolume: (id: string, vol: number) => void;
  onToggleMute: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onUpdateFade: (id: string, fadeIn: number, fadeOut: number) => void;
  onExportMix: (selectedIds: string[]) => void;
  onPreviewTake: (id: string) => void;
}

function WaveformMini({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const bars = data.length > 0 ? data : Array.from({ length: 40 }, () => Math.random() * 0.6 + 0.1);
  return (
    <View style={{ flexDirection: 'row', height, alignItems: 'center', gap: 1, flex: 1 }}>
      {bars.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max(2, v * height),
            backgroundColor: color,
            borderRadius: 1,
            opacity: 0.8,
          }}
        />
      ))}
    </View>
  );
}

export function RecordingMixer({
  takes,
  isRecording,
  onAddTake,
  onDeleteTake,
  onUpdateVolume,
  onToggleMute,
  onToggleSelect,
  onUpdateFade,
  onExportMix,
  onPreviewTake,
}: RecordingMixerProps) {
  const [showFadeEditor, setShowFadeEditor] = useState<string | null>(null);
  const selectedTakes = takes.filter(t => t.isSelected);

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="layers" size={16} color={Colors.primary} />
          <Text style={styles.headerTitle}>Recording Mixer</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{takes.length} takes</Text>
          </View>
        </View>
        <Pressable
          onPress={onAddTake}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.75 }]}
        >
          <MaterialIcons name="fiber-manual-record" size={14} color={Colors.recording} />
          <Text style={styles.addBtnText}>New Take</Text>
        </Pressable>
      </View>

      {takes.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="mic-none" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No takes yet. Record your first voice take.</Text>
        </View>
      ) : (
        <>
          {/* Takes list */}
          {takes.map((take, index) => (
            <View
              key={take.id}
              style={[styles.takeRow, take.isSelected && { borderColor: take.color + '88', backgroundColor: take.color + '0A' }]}
            >
              {/* Color indicator */}
              <View style={[styles.colorBar, { backgroundColor: take.color }]} />

              {/* Select */}
              <Pressable onPress={() => onToggleSelect(take.id)} style={[styles.selectBtn, take.isSelected && { backgroundColor: take.color }]}>
                {take.isSelected ? <MaterialIcons name="check" size={12} color="#000" /> : null}
              </Pressable>

              {/* Waveform + info */}
              <View style={styles.takeMain}>
                <View style={styles.takeHeader}>
                  <Text style={[styles.takeName, { color: take.color }]}>{take.name}</Text>
                  <Text style={styles.takeDuration}>{formatDuration(take.durationMs)}</Text>
                </View>
                <WaveformMini data={take.waveform} color={take.isMuted ? Colors.textMuted : take.color} />
                {/* Volume row */}
                <View style={styles.volRow}>
                  <MaterialIcons name="volume-up" size={12} color={Colors.textMuted} />
                  <View style={styles.volTrack}>
                    <View style={[styles.volFill, { width: `${take.volume * 100}%`, backgroundColor: take.color }]} />
                  </View>
                  {/* Quick vol buttons */}
                  {[0.25, 0.5, 0.75, 1.0].map(v => (
                    <Pressable
                      key={v}
                      onPress={() => onUpdateVolume(take.id, v)}
                      style={[styles.volBtn, take.volume === v && { backgroundColor: take.color + '33' }]}
                    >
                      <Text style={[styles.volBtnText, take.volume === v && { color: take.color }]}>
                        {Math.round(v * 100)}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.takeActions}>
                <Pressable onPress={() => onPreviewTake(take.id)} hitSlop={6} style={styles.actionBtn}>
                  <MaterialIcons name="play-arrow" size={16} color={take.color} />
                </Pressable>
                <Pressable onPress={() => onToggleMute(take.id)} hitSlop={6} style={styles.actionBtn}>
                  <MaterialIcons
                    name={take.isMuted ? 'volume-off' : 'volume-up'}
                    size={16}
                    color={take.isMuted ? Colors.error : Colors.textMuted}
                  />
                </Pressable>
                <Pressable onPress={() => setShowFadeEditor(showFadeEditor === take.id ? null : take.id)} hitSlop={6} style={styles.actionBtn}>
                  <MaterialIcons name="tune" size={16} color={Colors.textMuted} />
                </Pressable>
                <Pressable onPress={() => onDeleteTake(take.id)} hitSlop={6} style={styles.actionBtn}>
                  <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
                </Pressable>
              </View>
            </View>
          ))}

          {/* Fade editor */}
          {showFadeEditor ? (
            (() => {
              const take = takes.find(t => t.id === showFadeEditor);
              if (!take) return null;
              return (
                <View style={styles.fadeEditor}>
                  <Text style={[styles.fadeTitle, { color: take.color }]}>Fade Editor: {take.name}</Text>
                  <View style={styles.fadeRow}>
                    <Text style={styles.fadeLabel}>Fade In</Text>
                    {[0, 0.1, 0.2, 0.3, 0.5].map(v => (
                      <Pressable
                        key={v}
                        onPress={() => onUpdateFade(take.id, v, take.fadeOut)}
                        style={[styles.fadeChip, take.fadeIn === v && { borderColor: take.color, backgroundColor: take.color + '22' }]}
                      >
                        <Text style={[styles.fadeChipText, take.fadeIn === v && { color: take.color }]}>
                          {v === 0 ? 'None' : `${Math.round(v * 100)}%`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.fadeRow}>
                    <Text style={styles.fadeLabel}>Fade Out</Text>
                    {[0, 0.1, 0.2, 0.3, 0.5].map(v => (
                      <Pressable
                        key={v}
                        onPress={() => onUpdateFade(take.id, take.fadeIn, v)}
                        style={[styles.fadeChip, take.fadeOut === v && { borderColor: take.color, backgroundColor: take.color + '22' }]}
                      >
                        <Text style={[styles.fadeChipText, take.fadeOut === v && { color: take.color }]}>
                          {v === 0 ? 'None' : `${Math.round(v * 100)}%`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })()
          ) : null}

          {/* Mix summary */}
          {takes.length > 1 ? (
            <View style={styles.mixSummary}>
              <View style={styles.mixVisual}>
                {takes.map((take, i) => (
                  <View
                    key={take.id}
                    style={[
                      styles.mixLayer,
                      {
                        height: 8,
                        backgroundColor: take.isMuted ? Colors.border : take.color,
                        opacity: take.isMuted ? 0.3 : take.volume,
                        marginBottom: 2,
                      }
                    ]}
                  />
                ))}
                <View style={styles.mixMasterBar} />
              </View>
              <Text style={styles.mixLabel}>
                {selectedTakes.length} of {takes.length} selected · Mixed output
              </Text>
            </View>
          ) : null}

          {/* Export mix */}
          <GoldButton
            label={`🎚 Export Mix (${selectedTakes.length} takes)`}
            onPress={() => onExportMix(selectedTakes.map(t => t.id))}
            size="md"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  badge: { backgroundColor: Colors.primaryGlow, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.xs, borderWidth: 1, borderColor: Colors.primary + '44' },
  badgeText: { color: Colors.primary, fontSize: 9, fontWeight: Typography.bold },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.recordingGlow, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderWidth: 1, borderColor: Colors.recording + '55' },
  addBtnText: { color: Colors.recording, fontSize: Typography.xs, fontWeight: Typography.semibold },
  empty: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center' },
  takeRow: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  colorBar: { width: 4 },
  selectBtn: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginHorizontal: 6 },
  takeMain: { flex: 1, padding: Spacing.sm, gap: 4 },
  takeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  takeName: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  takeDuration: { color: Colors.textMuted, fontSize: Typography.xs, fontVariant: ['tabular-nums'] },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  volTrack: { flex: 1, height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  volFill: { height: '100%', borderRadius: 2 },
  volBtn: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3, borderWidth: 1, borderColor: Colors.border },
  volBtnText: { color: Colors.textMuted, fontSize: 8 },
  takeActions: { flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 4, paddingVertical: 4, gap: 2 },
  actionBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fadeEditor: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '33', gap: Spacing.sm },
  fadeTitle: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  fadeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  fadeLabel: { color: Colors.textMuted, fontSize: Typography.xs, width: 52 },
  fadeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.xs, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  fadeChipText: { color: Colors.textMuted, fontSize: Typography.xs },
  mixSummary: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  mixVisual: { gap: 1 },
  mixLayer: { borderRadius: 2, width: '100%' },
  mixMasterBar: { height: 2, backgroundColor: Colors.primary, borderRadius: 1, marginTop: 4 },
  mixLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 4 },
});
