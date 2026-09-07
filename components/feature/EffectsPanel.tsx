// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { EffectPreset, StudioMode, EFFECT_PRESETS } from '@/contexts/StudioContext';
import { EffectKnob } from '@/components/ui/EffectKnob';
import { useLanguage } from '@/hooks/useLanguage';

interface EffectsPanelProps {
  effects: EffectPreset;
  mode: StudioMode;
  onEffectChange: (key: keyof EffectPreset, value: number) => void;
  onModeChange: (mode: StudioMode) => void;
  onReset: () => void;
}

const KNOB_CONFIG: Array<{
  key: keyof EffectPreset;
  labelKey: string;
  min: number; max: number;
  unit: string;
  color: string;
}> = [
  { key: 'reverb',         labelKey: 'reverb',         min: 0,   max: 100, unit: '%',   color: '#7C5CBF' },
  { key: 'eq_bass',        labelKey: 'bass',           min: -12, max: 12,  unit: 'dB',  color: Colors.primary },
  { key: 'eq_mid',         labelKey: 'Mid',            min: -12, max: 12,  unit: 'dB',  color: Colors.primaryLight },
  { key: 'eq_treble',      labelKey: 'treble',         min: -12, max: 12,  unit: 'dB',  color: Colors.info },
  { key: 'pitch',          labelKey: 'pitch',          min: -12, max: 12,  unit: 'st',  color: '#E74C3C' },
  { key: 'compress',       labelKey: 'compress',       min: 0,   max: 100, unit: '%',   color: '#27AE60' },
  { key: 'noise_gate',     labelKey: 'noise_gate',     min: 0,   max: 100, unit: '%',   color: '#E67E22' },
  { key: 'vocal_enhance',  labelKey: 'vocal_enhance',  min: 0,   max: 100, unit: '%',   color: '#3498DB' },
  { key: 'spatial',        labelKey: 'spatial',        min: 0,   max: 100, unit: '%',   color: '#9B59B6' },
  { key: 'volume',         labelKey: 'volume',         min: 0,   max: 100, unit: '%',   color: Colors.success },
];

const MODES: StudioMode[] = ['studio', 'concert', 'cinema'];
const MODE_ICONS: Record<StudioMode, string> = {
  studio: 'mic', concert: 'queue-music', cinema: 'movie',
};

export const EffectsPanel = memo(({
  effects, mode, onEffectChange, onModeChange, onReset,
}: EffectsPanelProps) => {
  const { t } = useLanguage();

  const handleStep = (key: keyof EffectPreset, cfg: typeof KNOB_CONFIG[0], dir: 1 | -1) => {
    const step = (cfg.max - cfg.min) <= 24 ? 1 : 5;
    const newVal = Math.max(cfg.min, Math.min(cfg.max, effects[key] + dir * step));
    onEffectChange(key, newVal);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Mode selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preset Mode</Text>
        <View style={styles.modeRow}>
          {MODES.map(m => (
            <Pressable
              key={m}
              onPress={() => onModeChange(m)}
              style={[styles.modeBtn, m === mode && styles.modeBtnActive]}
            >
              <MaterialIcons
                name={(MODE_ICONS[m] as any)}
                size={18}
                color={m === mode ? Colors.textInverse : Colors.textSecondary}
              />
              <Text style={[styles.modeBtnText, m === mode && styles.modeBtnTextActive]}>
                {t[`${m}_mode` as 'concert_mode' | 'studio_mode' | 'cinema_mode']}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* EQ Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.eq} • {t.spatial}</Text>
          <Pressable onPress={onReset} style={styles.resetBtn}>
            <MaterialIcons name="refresh" size={14} color={Colors.primary} />
            <Text style={styles.resetText}>{t.reset}</Text>
          </Pressable>
        </View>
        <View style={styles.knobGrid}>
          {KNOB_CONFIG.map(cfg => {
            const labelText = (t as any)[cfg.labelKey] ?? cfg.labelKey;
            return (
              <EffectKnob
                key={cfg.key}
                label={labelText}
                value={effects[cfg.key]}
                min={cfg.min}
                max={cfg.max}
                unit={cfg.unit}
                color={cfg.color}
                onIncrease={() => handleStep(cfg.key, cfg, 1)}
                onDecrease={() => handleStep(cfg.key, cfg, -1)}
              />
            );
          })}
        </View>
      </View>

      {/* Concert specs */}
      <View style={styles.specCard}>
        <MaterialIcons name="equalizer" size={16} color={Colors.primary} />
        <View style={styles.specContent}>
          <Text style={styles.specTitle}>Ultra HD+ Audio Engine</Text>
          <Text style={styles.specDetail}>96kHz / 32-bit Float • Dolby Atmos Spatial</Text>
          <Text style={styles.specDetail}>Concert Hall IR Reverb • 6-Band Parametric EQ</Text>
          <Text style={styles.specDetail}>AI Vocal Enhancer • Dynamic Range: 144dB</Text>
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { paddingBottom: Spacing.xl },
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeBtnText: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.medium },
  modeBtnTextActive: { color: Colors.textInverse },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  resetText: { color: Colors.primary, fontSize: Typography.xs },
  knobGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  specCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  specContent: { flex: 1, gap: 3 },
  specTitle: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  specDetail: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 16 },
});
