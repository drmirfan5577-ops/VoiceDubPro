// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { DubProject } from '@/contexts/StudioContext';
import { useLanguage } from '@/hooks/useLanguage';

interface ProjectCardProps {
  project: DubProject;
  onPress: () => void;
  onDelete?: () => void;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return 'Just now';
}

const MODE_ICONS: Record<string, string> = {
  studio: 'mic', concert: 'queue-music', cinema: 'movie',
};
const QUALITY_COLOR: Record<string, string> = {
  '1080p': Colors.info, '4K': Colors.primary, 'UltraHD': Colors.primaryLight, '8K': '#FF6B35',
};

export const ProjectCard = memo(({ project, onPress, onDelete }: ProjectCardProps) => {
  const { isRTL } = useLanguage();
  const iconName = (MODE_ICONS[project.mode] || 'mic') as any;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {/* Thumbnail placeholder */}
      <View style={styles.thumb}>
        <MaterialIcons name="movie" size={28} color={Colors.textMuted} />
        <View style={[styles.qualityBadge, { backgroundColor: QUALITY_COLOR[project.exportQuality] }]}>
          <Text style={styles.qualityText}>{project.exportQuality}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={[styles.info, isRTL && styles.infoRTL]}>
        <Text style={[styles.name, isRTL && styles.rtl]} numberOfLines={1}>{project.name}</Text>
        <View style={[styles.meta, isRTL && { flexDirection: 'row-reverse' }]}>
          <MaterialIcons name={iconName} size={12} color={Colors.primary} />
          <Text style={styles.metaText}>{project.mode}</Text>
          <Text style={styles.dot}>·</Text>
          <MaterialIcons name="layers" size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>{project.tracks.length} tracks</Text>
          {project.videoDuration > 0 ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.metaText}>{formatDuration(project.videoDuration)}</Text>
            </>
          ) : null}
        </View>
        <Text style={styles.time}>{timeAgo(project.createdAt)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialIcons name="delete-outline" size={18} color={Colors.textMuted} />
        </Pressable>
        <MaterialIcons name="chevron-right" size={22} color={Colors.primary} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  thumb: {
    width: 72,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qualityBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  qualityText: {
    color: '#000',
    fontSize: 8,
    fontWeight: Typography.bold,
  },
  info: { flex: 1, padding: Spacing.md, gap: 4 },
  infoRTL: { alignItems: 'flex-end' },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  rtl: { textAlign: 'right' },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaText: { color: Colors.textMuted, fontSize: Typography.xs },
  dot: { color: Colors.textMuted, fontSize: Typography.xs },
  time: { color: Colors.textMuted, fontSize: Typography.xs },
  actions: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  deleteBtn: { padding: 4 },
});
