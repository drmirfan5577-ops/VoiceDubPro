// Powered by OnSpace.AI — Effects + AI BG Music Generator
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useAlert } from '@/template';
import { AppHeader } from '@/components/layout/AppHeader';
import { EffectsPanel } from '@/components/feature/EffectsPanel';
import { GoldButton } from '@/components/ui/GoldButton';
import { useStudio } from '@/hooks/useStudio';
import { EFFECT_PRESETS, EffectPreset } from '@/contexts/StudioContext';
import { BG_MUSIC_LIBRARY, BG_CATEGORIES, BgTrack, BgCategory } from '@/services/bgMusicService';
import { AiBgMusicGenerator } from '@/components/feature/AiBgMusicGenerator';
import { router } from 'expo-router';

type EffectsTab = 'eq' | 'bgmusic' | 'ai_music';

export default function EffectsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { showAlert } = useAlert();
  const { activeProject, updateTrackEffects, setProjectMode } = useStudio();
  const [tab, setTab] = useState<EffectsTab>('eq');
  const [bgCategory, setBgCategory] = useState<BgCategory>('cinematic');
  const [playingBgId, setPlayingBgId] = useState<string | null>(null);
  const [bgVolume, setBgVolume] = useState(0.3);

  const project = activeProject;
  const primaryTrack = project?.tracks.find(t => t.isPrimary) ?? project?.tracks[0];

  const handleEffectChange = (key: keyof EffectPreset, value: number) => {
    if (!project || !primaryTrack) return;
    updateTrackEffects(project.id, primaryTrack.id, { [key]: value });
  };

  const handleModeChange = (mode: typeof project.mode) => {
    if (!project || !primaryTrack) return;
    setProjectMode(project.id, mode!);
    updateTrackEffects(project.id, primaryTrack.id, EFFECT_PRESETS[mode!]);
  };

  const handleReset = () => {
    if (!project || !primaryTrack) return;
    updateTrackEffects(project.id, primaryTrack.id, EFFECT_PRESETS.studio);
  };

  const filteredBgTracks = BG_MUSIC_LIBRARY.filter(t => t.category === bgCategory);

  const handlePlayBg = (track: BgTrack) => {
    if (playingBgId === track.id) {
      setPlayingBgId(null);
    } else {
      setPlayingBgId(track.id);
      showAlert('Now Playing', `${track.icon} ${track.title} · ${track.mood} · Vol ${Math.round(bgVolume * 100)}%`);
    }
  };

  const TABS = [
    { id: 'eq' as EffectsTab,       label: 'EQ & Effects',    icon: 'equalizer' },
    { id: 'bgmusic' as EffectsTab,  label: 'BG Library',       icon: 'queue-music' },
    { id: 'ai_music' as EffectsTab, label: 'AI Music Gen',     icon: 'auto-awesome' },
  ];

  if (!project || !primaryTrack) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <AppHeader title={t.effects} />
        <View style={styles.noProjectContent}>
          <MaterialIcons name="equalizer" size={56} color={Colors.textMuted} />
          <Text style={styles.noProjectTitle}>No Active Project</Text>
          <Text style={styles.noProjectSub}>Open a project in Studio to use Effects</Text>
          <GoldButton label={t.studio} onPress={() => router.push('/(tabs)/studio')} size="lg" fullWidth style={{ marginTop: Spacing.lg }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      <AppHeader title={t.effects} />

      {/* Active track */}
      <View style={styles.activeTrack}>
        <MaterialIcons name="layers" size={16} color={Colors.primary} />
        <Text style={styles.activeTrackText}>{project.name} · {primaryTrack.name}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{project.mode.toUpperCase()}</Text></View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tabItem => (
          <Pressable
            key={tabItem.id}
            onPress={() => setTab(tabItem.id)}
            style={[styles.tab, tab === tabItem.id && styles.tabActive]}
          >
            <MaterialIcons name={tabItem.icon as any} size={15} color={tab === tabItem.id ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.tabText, tab === tabItem.id && styles.tabTextActive]}>{tabItem.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* ── EQ Panel ── */}
      {tab === 'eq' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.padded}>
          <EffectsPanel
            effects={primaryTrack.effectPreset}
            mode={project.mode}
            onEffectChange={handleEffectChange}
            onModeChange={handleModeChange}
            onReset={handleReset}
          />
        </ScrollView>
      ) : null}

      {/* ── BG Music Library ── */}
      {tab === 'bgmusic' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.padded}>
          {/* Volume */}
          <View style={styles.bgVolRow}>
            <MaterialIcons name="volume-down" size={16} color={Colors.textMuted} />
            <View style={styles.bgVolTrack}>
              <View style={[styles.bgVolFill, { width: `${bgVolume * 100}%` }]} />
            </View>
            <MaterialIcons name="volume-up" size={16} color={Colors.primary} />
            <Text style={styles.bgVolText}>{Math.round(bgVolume * 100)}%</Text>
          </View>
          <View style={styles.bgVolBtns}>
            {[0.1, 0.2, 0.3, 0.5, 0.7, 1.0].map(v => (
              <Pressable key={v} onPress={() => setBgVolume(v)} style={[styles.bgVolChip, bgVolume === v && styles.bgVolChipActive]}>
                <Text style={[styles.bgVolChipText, bgVolume === v && { color: Colors.primary }]}>{Math.round(v * 100)}%</Text>
              </Pressable>
            ))}
          </View>

          {/* Category */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {BG_CATEGORIES.map(cat => (
              <Pressable key={cat.id} onPress={() => setBgCategory(cat.id)} style={[styles.catChip, bgCategory === cat.id && styles.catChipActive]}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catLabel, bgCategory === cat.id && { color: Colors.primary }]}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.catTitle}>
            {BG_CATEGORIES.find(c => c.id === bgCategory)?.icon} {BG_CATEGORIES.find(c => c.id === bgCategory)?.label} · {filteredBgTracks.length} tracks
          </Text>

          {filteredBgTracks.map(track => {
            const isPlaying = playingBgId === track.id;
            return (
              <Pressable key={track.id} onPress={() => handlePlayBg(track)} style={[styles.bgTrackRow, isPlaying && styles.bgTrackRowActive]}>
                <View style={[styles.bgTrackPlay, isPlaying && styles.bgTrackPlayActive]}>
                  <MaterialIcons name={isPlaying ? 'stop' : 'play-arrow'} size={20} color={isPlaying ? Colors.textInverse : Colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.bgTrackTitle, isPlaying && { color: Colors.primary }]}>{track.title}</Text>
                  <View style={styles.bgTrackMeta}>
                    <View style={[styles.moodTag, { backgroundColor: isPlaying ? Colors.primary + '22' : Colors.surfaceElevated }]}>
                      <Text style={[styles.moodText, isPlaying && { color: Colors.primary }]}>{track.mood}</Text>
                    </View>
                    {track.bpm ? <Text style={styles.bpmText}>{track.bpm} BPM</Text> : null}
                  </View>
                </View>
                <Text style={styles.bgTrackDur}>{track.duration}</Text>
                {isPlaying ? <View style={styles.nowDot} /> : null}
              </Pressable>
            );
          })}

          {playingBgId ? (
            <View style={styles.nowPlayingBar}>
              <MaterialIcons name="queue-music" size={14} color={Colors.primary} />
              <Text style={styles.nowPlayingText} numberOfLines={1}>
                {BG_MUSIC_LIBRARY.find(t => t.id === playingBgId)?.title} · BG {Math.round(bgVolume * 100)}%
              </Text>
              <Pressable onPress={() => setPlayingBgId(null)} hitSlop={8}>
                <MaterialIcons name="stop" size={16} color={Colors.error} />
              </Pressable>
            </View>
          ) : null}

          <View style={styles.royaltyCard}>
            <MaterialIcons name="check-circle" size={12} color={Colors.success} />
            <Text style={styles.royaltyText}>All tracks are royalty-free. Commercial use included.</Text>
          </View>
        </ScrollView>
      ) : null}

      {/* ── AI Music Generator ── */}
      {tab === 'ai_music' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.padded}>
          <AiBgMusicGenerator
            currentLanguage={language}
            onSelectTrack={(suggestion) => {
              showAlert('Track Selected', `"${suggestion.title}" added as background music suggestion. Adjust volume in BG Library tab.`);
            }}
          />
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  noProjectContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  noProjectTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.semibold, textAlign: 'center' },
  noProjectSub: { color: Colors.textMuted, fontSize: Typography.base, textAlign: 'center' },
  activeTrack: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceCard, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  activeTrackText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.sm },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: Colors.primary + '44', backgroundColor: Colors.primaryGlow },
  badgeText: { color: Colors.primary, fontSize: 9, fontWeight: Typography.bold },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
  tabTextActive: { color: Colors.primary },
  padded: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  bgVolRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  bgVolTrack: { flex: 1, height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  bgVolFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  bgVolText: { color: Colors.textSecondary, fontSize: Typography.xs, width: 32 },
  bgVolBtns: { flexDirection: 'row', gap: 6, marginBottom: Spacing.md, flexWrap: 'wrap' },
  bgVolChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  bgVolChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  bgVolChipText: { color: Colors.textMuted, fontSize: 10 },
  catScroll: { gap: Spacing.sm, paddingRight: Spacing.md, marginBottom: Spacing.md },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  catIcon: { fontSize: 15 },
  catLabel: { color: Colors.textMuted, fontSize: Typography.sm, fontWeight: Typography.medium },
  catTitle: { color: Colors.textSecondary, fontSize: Typography.xs, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md, fontWeight: Typography.semibold },
  bgTrackRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceCard, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  bgTrackRowActive: { borderColor: Colors.primary + '55', backgroundColor: Colors.primaryGlow },
  bgTrackPlay: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.primary + '66' },
  bgTrackPlayActive: { backgroundColor: Colors.primary },
  bgTrackTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
  bgTrackMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  moodTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  moodText: { color: Colors.textMuted, fontSize: 10 },
  bpmText: { color: Colors.textMuted, fontSize: 10 },
  bgTrackDur: { color: Colors.textMuted, fontSize: Typography.xs },
  nowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  nowPlayingBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '44', marginTop: Spacing.md },
  nowPlayingText: { flex: 1, color: Colors.primary, fontSize: Typography.sm },
  royaltyCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.success + '11', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.success + '33', marginTop: Spacing.md },
  royaltyText: { color: Colors.success, fontSize: Typography.xs, flex: 1 },
});
