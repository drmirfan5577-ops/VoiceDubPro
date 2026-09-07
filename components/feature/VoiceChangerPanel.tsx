// Powered by OnSpace.AI — World-Class Voice Changer Panel
// Multiple variations, buffer system, studio-quality cinematic effects
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { GoldButton } from '@/components/ui/GoldButton';

// ── Voice Presets ──────────────────────────────────────────────────
export interface VoicePreset {
  id: string;
  label: string;
  icon: string;
  color: string;
  pitch: number;        // semitones (-12 to +12)
  rate: number;         // 0.5 to 2.0
  formant: number;      // formant shift (-6 to +6)
  reverb: number;       // 0-100
  distort: number;      // 0-100 (robot/megaphone)
  chorus: number;       // 0-100
  category: 'human' | 'character' | 'effect' | 'sacred';
  description: string;
}

const VOICE_PRESETS: VoicePreset[] = [
  // Human voices
  { id: 'natural',    label: 'Natural',       icon: 'person',           color: Colors.textSecondary, pitch: 0,    rate: 1.0,  formant: 0,   reverb: 5,   distort: 0,   chorus: 0,   category: 'human',     description: 'Original clean voice' },
  { id: 'male_deep',  label: 'Deep Male',     icon: 'record-voice-over',color: '#E67E22',            pitch: -4,   rate: 0.88, formant: -3,  reverb: 10,  distort: 0,   chorus: 5,   category: 'human',     description: 'Rich, warm bass voice' },
  { id: 'female',     label: 'Lady',          icon: 'person',           color: '#E91E63',            pitch: 5,    rate: 1.05, formant: 4,   reverb: 8,   distort: 0,   chorus: 8,   category: 'human',     description: 'Feminine vocal character' },
  { id: 'young',      label: 'Young Adult',   icon: 'face',             color: '#2ECC71',            pitch: 2,    rate: 1.1,  formant: 2,   reverb: 6,   distort: 0,   chorus: 3,   category: 'human',     description: 'Fresh energetic tone' },
  { id: 'elder',      label: 'Elder',         icon: 'elderly',          color: '#95A5A6',            pitch: -5,   rate: 0.82, formant: -2,  reverb: 12,  distort: 5,   chorus: 0,   category: 'human',     description: 'Wise, seasoned tone' },
  { id: 'child',      label: 'Child',         icon: 'child-care',       color: '#3498DB',            pitch: 8,    rate: 1.3,  formant: 6,   reverb: 4,   distort: 0,   chorus: 5,   category: 'human',     description: 'High-pitched, playful' },

  // Character voices
  { id: 'robot',      label: 'Robot',         icon: 'smart-toy',        color: Colors.primary,       pitch: 0,    rate: 0.95, formant: 0,   reverb: 20,  distort: 70,  chorus: 30,  category: 'character', description: 'Metallic robotic voice' },
  { id: 'cartoon',    label: 'Cartoon',       icon: 'emoji-emotions',   color: '#F1C40F',            pitch: 10,   rate: 1.4,  formant: 5,   reverb: 5,   distort: 20,  chorus: 40,  category: 'character', description: 'Animated, exaggerated' },
  { id: 'giant',      label: 'Giant',         icon: 'height',           color: '#7F8C8D',            pitch: -10,  rate: 0.7,  formant: -5,  reverb: 35,  distort: 10,  chorus: 15,  category: 'character', description: 'Massive, booming voice' },
  { id: 'alien',      label: 'Alien',         icon: 'blur-on',          color: '#9B59B6',            pitch: 3,    rate: 1.15, formant: 3,   reverb: 40,  distort: 45,  chorus: 60,  category: 'character', description: 'Extraterrestrial vibrato' },
  { id: 'ghost',      label: 'Ghost',         icon: 'wb-iridescent',    color: '#BDC3C7',            pitch: 0,    rate: 0.9,  formant: 0,   reverb: 75,  distort: 15,  chorus: 50,  category: 'character', description: 'Ethereal, haunting' },
  { id: 'villain',    label: 'Villain',       icon: 'warning',          color: '#E74C3C',            pitch: -6,   rate: 0.85, formant: -3,  reverb: 30,  distort: 25,  chorus: 20,  category: 'character', description: 'Dark, menacing tone' },

  // Effects
  { id: 'radio',      label: 'Radio',         icon: 'radio',            color: '#F39C12',            pitch: 0,    rate: 1.0,  formant: 0,   reverb: 5,   distort: 60,  chorus: 10,  category: 'effect',    description: 'AM/FM bandpass filter' },
  { id: 'telephone',  label: 'Telephone',     icon: 'phone',            color: '#27AE60',            pitch: 0,    rate: 1.0,  formant: 0,   reverb: 2,   distort: 50,  chorus: 0,   category: 'effect',    description: 'Phone call quality' },
  { id: 'megaphone',  label: 'Megaphone',     icon: 'campaign',         color: '#E74C3C',            pitch: -1,   rate: 0.97, formant: -1,  reverb: 15,  distort: 40,  chorus: 5,   category: 'effect',    description: 'Loud outdoor speaker' },
  { id: 'underwater', label: 'Underwater',    icon: 'water',            color: '#2980B9',            pitch: -2,   rate: 0.85, formant: -2,  reverb: 80,  distort: 30,  chorus: 70,  category: 'effect',    description: 'Submerged, bubbly' },
  { id: 'stadium',    label: 'Stadium',       icon: 'stadium',          color: '#8E44AD',            pitch: 0,    rate: 1.0,  formant: 0,   reverb: 90,  distort: 0,   chorus: 25,  category: 'effect',    description: 'Large arena reverb' },
  { id: 'chorus_fx',  label: 'Choir',         icon: 'people',           color: '#16A085',            pitch: 0,    rate: 1.0,  formant: 0,   reverb: 45,  distort: 0,   chorus: 90,  category: 'effect',    description: 'Multi-voice harmony' },

  // Sacred
  { id: 'quran_rec',  label: 'Quran Recit.',  icon: 'mosque',           color: '#D4A017',            pitch: 0,    rate: 0.92, formant: 0,   reverb: 20,  distort: 0,   chorus: 5,   category: 'sacred',    description: 'Pure 192kHz, tajweed' },
  { id: 'naat_mode',  label: 'Naat Mode',     icon: 'music-note',       color: '#27AE60',            pitch: 1,    rate: 0.96, formant: 0,   reverb: 18,  distort: 0,   chorus: 12,  category: 'sacred',    description: 'Devotional vocal mode' },
  { id: 'speech',     label: 'Speech',        icon: 'record-voice-over',color: '#2980B9',            pitch: 0,    rate: 1.0,  formant: 0,   reverb: 8,   distort: 0,   chorus: 0,   category: 'sacred',    description: 'Crystal clear speech' },
];

const CATEGORIES = [
  { id: 'all',       label: 'All',        icon: 'apps' },
  { id: 'human',     label: 'Human',      icon: 'person' },
  { id: 'character', label: 'Character',  icon: 'emoji-emotions' },
  { id: 'effect',    label: 'Effect',     icon: 'tune' },
  { id: 'sacred',    label: 'Sacred',     icon: 'mosque' },
];

// ── Fine-tune controls ─────────────────────────────────────────────
interface FineTuneState {
  pitchOffset: number;    // -4 to +4 override
  rateOffset: number;     // -0.2 to +0.2
  reverbWet: number;      // 0-100
  boostDb: number;        // 0-12
  noiseGate: boolean;
  stereoWidth: number;    // 0-100
  bufferSize: 64 | 128 | 256 | 512;
}

interface VoiceChangerPanelProps {
  selectedId: string;
  onSelect: (preset: VoicePreset) => void;
  onPreview?: (preset: VoicePreset) => void;
}

export function VoiceChangerPanel({ selectedId, onSelect, onPreview }: VoiceChangerPanelProps) {
  const [category, setCategory] = useState<string>('all');
  const [showFineTune, setShowFineTune] = useState(false);
  const [fineTune, setFineTune] = useState<FineTuneState>({
    pitchOffset: 0, rateOffset: 0, reverbWet: 0,
    boostDb: 0, noiseGate: true, stereoWidth: 50, bufferSize: 128,
  });
  const selectedPreset = VOICE_PRESETS.find(p => p.id === selectedId) ?? VOICE_PRESETS[0];
  const pulseRef = useRef(new Animated.Value(1)).current;

  const filtered = category === 'all'
    ? VOICE_PRESETS
    : VOICE_PRESETS.filter(p => p.category === category);

  const handleSelect = (preset: VoicePreset) => {
    onSelect(preset);
    Animated.sequence([
      Animated.spring(pulseRef, { toValue: 1.08, useNativeDriver: true, damping: 6 }),
      Animated.spring(pulseRef, { toValue: 1, useNativeDriver: true, damping: 10 }),
    ]).start();
  };

  const tuneLabel = (val: number, unit = '') =>
    (val > 0 ? '+' : '') + val.toFixed(val % 1 !== 0 ? 1 : 0) + unit;

  return (
    <View style={styles.container}>
      {/* Active preset header */}
      <Animated.View style={[styles.activeHeader, { transform: [{ scale: pulseRef }], borderColor: selectedPreset.color + '88' }]}>
        <LinearGradient
          colors={[selectedPreset.color + '22', 'transparent']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.activeIcon, { backgroundColor: selectedPreset.color + '33', borderColor: selectedPreset.color + '55' }]}>
          <MaterialIcons name={selectedPreset.icon as any} size={24} color={selectedPreset.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.activeName, { color: selectedPreset.color }]}>{selectedPreset.label}</Text>
          <Text style={styles.activeDesc}>{selectedPreset.description}</Text>
          <View style={styles.activeMeta}>
            <View style={styles.metaChip}><Text style={styles.metaText}>Pitch {tuneLabel(selectedPreset.pitch + fineTune.pitchOffset, 'st')}</Text></View>
            <View style={styles.metaChip}><Text style={styles.metaText}>Rate {(selectedPreset.rate + fineTune.rateOffset).toFixed(2)}x</Text></View>
            <View style={styles.metaChip}><Text style={styles.metaText}>Reverb {selectedPreset.reverb + fineTune.reverbWet}%</Text></View>
          </View>
        </View>
        {onPreview ? (
          <Pressable onPress={() => onPreview(selectedPreset)} style={[styles.previewBtn, { borderColor: selectedPreset.color }]}>
            <MaterialIcons name="play-arrow" size={18} color={selectedPreset.color} />
          </Pressable>
        ) : null}
      </Animated.View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat.id}
            onPress={() => setCategory(cat.id)}
            style={[styles.catChip, category === cat.id && styles.catChipActive]}
          >
            <MaterialIcons name={cat.icon as any} size={13} color={category === cat.id ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.catLabel, category === cat.id && { color: Colors.primary }]}>{cat.label}</Text>
            {category === cat.id ? (
              <View style={styles.catCount}>
                <Text style={styles.catCountText}>{filtered.length}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>

      {/* Presets grid */}
      <View style={styles.grid}>
        {filtered.map(preset => {
          const isActive = selectedId === preset.id;
          return (
            <Pressable
              key={preset.id}
              onPress={() => handleSelect(preset)}
              style={({ pressed }) => [
                styles.presetCard,
                isActive && { borderColor: preset.color, backgroundColor: preset.color + '18' },
                pressed && { opacity: 0.82, transform: [{ scale: 0.96 }] },
              ]}
            >
              {isActive ? (
                <LinearGradient
                  colors={[preset.color + '22', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
              ) : null}
              <MaterialIcons name={preset.icon as any} size={22} color={isActive ? preset.color : Colors.textMuted} />
              <Text style={[styles.presetLabel, isActive && { color: preset.color }]} numberOfLines={1}>{preset.label}</Text>
              <View style={styles.presetParams}>
                {preset.pitch !== 0 ? (
                  <Text style={styles.paramText}>{tuneLabel(preset.pitch, 'st')}</Text>
                ) : null}
                {preset.distort > 0 ? (
                  <Text style={[styles.paramText, { color: Colors.warning }]}>FX</Text>
                ) : null}
                {preset.category === 'sacred' ? (
                  <Text style={[styles.paramText, { color: Colors.primary }]}>★</Text>
                ) : null}
              </View>
              {isActive ? <MaterialIcons name="check-circle" size={12} color={preset.color} style={styles.checkMark} /> : null}
            </Pressable>
          );
        })}
      </View>

      {/* Fine-tune section */}
      <Pressable onPress={() => setShowFineTune(v => !v)} style={styles.fineTuneToggle}>
        <MaterialIcons name="tune" size={14} color={Colors.primary} />
        <Text style={styles.fineTuneToggleText}>Fine-Tune Controls</Text>
        <MaterialIcons name={showFineTune ? 'expand-less' : 'expand-more'} size={16} color={Colors.textMuted} />
      </Pressable>

      {showFineTune ? (
        <View style={styles.fineTunePanel}>
          {/* Pitch offset */}
          <View style={styles.tuneRow}>
            <Text style={styles.tuneLabel}>Pitch Offset</Text>
            <View style={styles.tuneChips}>
              {[-4, -2, -1, 0, 1, 2, 4].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setFineTune(s => ({ ...s, pitchOffset: v }))}
                  style={[styles.tuneChip, fineTune.pitchOffset === v && styles.tuneChipActive]}
                >
                  <Text style={[styles.tuneChipText, fineTune.pitchOffset === v && { color: Colors.primary }]}>
                    {tuneLabel(v, 'st')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Rate offset */}
          <View style={styles.tuneRow}>
            <Text style={styles.tuneLabel}>Speed Offset</Text>
            <View style={styles.tuneChips}>
              {[-0.2, -0.1, 0, 0.1, 0.2].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setFineTune(s => ({ ...s, rateOffset: v }))}
                  style={[styles.tuneChip, fineTune.rateOffset === v && styles.tuneChipActive]}
                >
                  <Text style={[styles.tuneChipText, fineTune.rateOffset === v && { color: Colors.primary }]}>
                    {tuneLabel(v, 'x')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reverb wet */}
          <View style={styles.tuneRow}>
            <Text style={styles.tuneLabel}>Extra Reverb</Text>
            <View style={styles.tuneChips}>
              {[0, 15, 30, 50, 75, 100].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setFineTune(s => ({ ...s, reverbWet: v }))}
                  style={[styles.tuneChip, fineTune.reverbWet === v && styles.tuneChipActive]}
                >
                  <Text style={[styles.tuneChipText, fineTune.reverbWet === v && { color: Colors.primary }]}>{v}%</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Voice boost */}
          <View style={styles.tuneRow}>
            <Text style={styles.tuneLabel}>Voice Boost</Text>
            <View style={styles.tuneChips}>
              {[0, 3, 6, 9, 12].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setFineTune(s => ({ ...s, boostDb: v }))}
                  style={[styles.tuneChip, fineTune.boostDb === v && styles.tuneChipActive]}
                >
                  <Text style={[styles.tuneChipText, fineTune.boostDb === v && { color: Colors.success }]}>+{v}dB</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Stereo width */}
          <View style={styles.tuneRow}>
            <Text style={styles.tuneLabel}>Stereo Width</Text>
            <View style={styles.tuneChips}>
              {[0, 25, 50, 75, 100].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setFineTune(s => ({ ...s, stereoWidth: v }))}
                  style={[styles.tuneChip, fineTune.stereoWidth === v && styles.tuneChipActive]}
                >
                  <Text style={[styles.tuneChipText, fineTune.stereoWidth === v && { color: Colors.info }]}>{v}%</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Buffer size */}
          <View style={styles.tuneRow}>
            <Text style={styles.tuneLabel}>Buffer Size</Text>
            <View style={styles.tuneChips}>
              {([64, 128, 256, 512] as const).map(v => (
                <Pressable
                  key={v}
                  onPress={() => setFineTune(s => ({ ...s, bufferSize: v }))}
                  style={[styles.tuneChip, fineTune.bufferSize === v && styles.tuneChipActive]}
                >
                  <Text style={[styles.tuneChipText, fineTune.bufferSize === v && { color: Colors.primary }]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Noise gate toggle */}
          <Pressable
            onPress={() => setFineTune(s => ({ ...s, noiseGate: !s.noiseGate }))}
            style={[styles.toggleRow, fineTune.noiseGate && styles.toggleRowActive]}
          >
            <MaterialIcons name="noise-aware" size={14} color={fineTune.noiseGate ? Colors.success : Colors.textMuted} />
            <Text style={[styles.toggleLabel, fineTune.noiseGate && { color: Colors.success }]}>
              Noise Gate {fineTune.noiseGate ? 'ON' : 'OFF'}
            </Text>
            <View style={[styles.toggleIndicator, fineTune.noiseGate && { backgroundColor: Colors.success }]} />
          </Pressable>

          {/* Buffer specs info */}
          <View style={styles.bufferInfo}>
            <MaterialIcons name="speed" size={12} color={Colors.primary} />
            <Text style={styles.bufferInfoText}>
              Buffer {fineTune.bufferSize} samples · {fineTune.bufferSize === 64 ? '1.5ms' : fineTune.bufferSize === 128 ? '3ms' : fineTune.bufferSize === 256 ? '6ms' : '12ms'} latency · Studio-grade pipeline
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Shadow.gold,
  },
  activeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  activeName: { fontSize: Typography.base, fontWeight: Typography.bold },
  activeDesc: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 16 },
  activeMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  metaChip: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaText: { color: Colors.textMuted, fontSize: 9, fontVariant: ['tabular-nums'] },
  previewBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRow: { gap: Spacing.sm, paddingRight: Spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  catLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
  catCount: {
    backgroundColor: Colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCountText: { color: '#000', fontSize: 8, fontWeight: Typography.bold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  presetCard: {
    width: '30%',
    padding: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  presetLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
  presetParams: { flexDirection: 'row', gap: 3, flexWrap: 'wrap', justifyContent: 'center' },
  paramText: { color: Colors.textMuted, fontSize: 9 },
  checkMark: { position: 'absolute', top: 4, right: 4 },
  fineTuneToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  fineTuneToggleText: { flex: 1, color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  fineTunePanel: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  tuneRow: { gap: 6 },
  tuneLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.6 },
  tuneChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tuneChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tuneChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  tuneChipText: { color: Colors.textMuted, fontSize: Typography.xs, fontVariant: ['tabular-nums'] },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleRowActive: { borderColor: Colors.success + '55', backgroundColor: Colors.success + '11' },
  toggleLabel: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.medium },
  toggleIndicator: { width: 24, height: 14, borderRadius: 7, backgroundColor: Colors.border },
  bufferInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  bufferInfoText: { color: Colors.primary, fontSize: Typography.xs, flex: 1 },
});
