// Powered by OnSpace.AI — Voice Preview Card (Record / Save / Delete / Revoice / Export)
import React, { useState, memo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { SavedVoice } from '@/contexts/StudioContext';
import { LANGUAGES } from '@/constants/languages';
import { formatFileSize } from '@/services/mediaService';

interface VoicePreviewCardProps {
  voice: SavedVoice;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDelete: () => void;
  onRevoice: () => void;
  onExport: () => void;
  onUseDub: () => void;
}

export const VoicePreviewCard = memo(({
  voice,
  isPlaying,
  onPlay,
  onStop,
  onDelete,
  onRevoice,
  onExport,
  onUseDub,
}: VoicePreviewCardProps) => {
  const lang = LANGUAGES.find(l => l.code === voice.language);
  const date = new Date(voice.createdAt).toLocaleDateString();

  const formatDur = (s: number) => {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <View style={styles.card}>
      {/* Type badge */}
      <View style={[styles.typeBadge, { backgroundColor: voice.type === 'video' ? Colors.info + '22' : Colors.primaryGlow }]}>
        <MaterialIcons
          name={voice.type === 'video' ? 'movie' : 'audiotrack'}
          size={12}
          color={voice.type === 'video' ? Colors.info : Colors.primary}
        />
        <Text style={[styles.typeText, { color: voice.type === 'video' ? Colors.info : Colors.primary }]}>
          {voice.type === 'video' ? 'VIDEO' : 'AUDIO'}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{voice.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.flag}>{lang?.flag ?? '🌐'}</Text>
          <Text style={styles.meta}>{lang?.englishName ?? voice.language}</Text>
          <Text style={styles.metaDot}>·</Text>
          <MaterialIcons name="schedule" size={11} color={Colors.textMuted} />
          <Text style={styles.meta}>{formatDur(voice.duration)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.meta}>{date}</Text>
        </View>
      </View>

      {/* Waveform preview */}
      <View style={styles.miniWave}>
        {Array.from({ length: 30 }, (_, i) => (
          <View
            key={i}
            style={[
              styles.miniBar,
              {
                height: Math.max(2, Math.sin(i * 0.4 + 1) * 12 + 14 + Math.random() * 4),
                backgroundColor: isPlaying && i % 2 === 0 ? Colors.primary : Colors.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {/* Play / Stop */}
        <Pressable
          onPress={isPlaying ? onStop : onPlay}
          style={({ pressed }) => [styles.mainBtn, isPlaying && styles.mainBtnActive, pressed && { opacity: 0.8 }]}
        >
          <MaterialIcons
            name={isPlaying ? 'stop' : 'play-arrow'}
            size={20}
            color={isPlaying ? Colors.textInverse : Colors.textPrimary}
          />
          <Text style={[styles.mainBtnText, isPlaying && { color: Colors.textInverse }]}>
            {isPlaying ? 'Stop' : 'Preview'}
          </Text>
        </Pressable>

        {/* Use for Dub */}
        <Pressable onPress={onUseDub} style={({ pressed }) => [styles.actionBtn, styles.dubBtn, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="mic" size={14} color={Colors.primary} />
          <Text style={styles.dubBtnText}>Use Dub</Text>
        </Pressable>

        {/* Re-voice */}
        <Pressable onPress={onRevoice} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="refresh" size={16} color={Colors.textSecondary} />
        </Pressable>

        {/* Export */}
        <Pressable onPress={onExport} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="file-download" size={16} color={Colors.textSecondary} />
        </Pressable>

        {/* Delete */}
        <Pressable onPress={onDelete} style={({ pressed }) => [styles.iconBtn, styles.deleteBtn, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  typeText: { fontSize: 9, fontWeight: Typography.bold, letterSpacing: 0.5 },
  info: { gap: 3 },
  name: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flag: { fontSize: 13 },
  meta: { color: Colors.textMuted, fontSize: Typography.xs },
  metaDot: { color: Colors.border, fontSize: Typography.xs },
  miniWave: { flexDirection: 'row', alignItems: 'center', height: 28, gap: 1 },
  miniBar: { flex: 1, borderRadius: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  mainBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
    flex: 1,
  },
  mainBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mainBtnText: { color: Colors.textPrimary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
  },
  dubBtn: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary + '44' },
  dubBtnText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  deleteBtn: { borderColor: Colors.error + '44', backgroundColor: Colors.error + '11' },
});
