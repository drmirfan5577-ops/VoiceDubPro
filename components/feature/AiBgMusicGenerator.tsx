// Powered by OnSpace.AI — AI Background Music Generator Component
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { GoldButton } from '@/components/ui/GoldButton';
import { getAiBgMusicSuggestions } from '@/services/aiStudioService';
import { useAlert } from '@/template';

const MOODS = ['Dramatic', 'Emotional', 'Suspense', 'Comedy', 'Romantic', 'Action', 'Peaceful', 'Epic', 'Horror', 'Inspirational'];
const CONTEXTS = [
  'Drama series', 'Action movie', 'Documentary', 'Comedy show',
  'Religious content', 'News', 'Advertisement', 'Music video',
];

interface AiSuggestion {
  title: string;
  bpm: number;
  mood: string;
  description: string;
  tags: string[];
}

interface AiBgMusicGeneratorProps {
  currentLanguage: string;
  onSelectTrack?: (suggestion: AiSuggestion) => void;
}

export function AiBgMusicGenerator({ currentLanguage, onSelectTrack }: AiBgMusicGeneratorProps) {
  const { showAlert } = useAlert();
  const [selectedMood, setSelectedMood] = useState('Dramatic');
  const [selectedContext, setSelectedContext] = useState('Drama series');
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await getAiBgMusicSuggestions(selectedContext, selectedMood, currentLanguage);
      setSuggestions(result);
    } catch (e: any) {
      showAlert('Error', e.message ?? 'Could not generate suggestions');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="auto-awesome" size={16} color={Colors.primary} />
        <Text style={styles.headerTitle}>AI Background Music Generator</Text>
      </View>
      <Text style={styles.headerSub}>
        OnSpace AI suggests tracks based on your project mood and context
      </Text>

      {/* Mood selector */}
      <Text style={styles.label}>Target Mood</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 16 }}>
        {MOODS.map(mood => (
          <Pressable
            key={mood}
            onPress={() => setSelectedMood(mood)}
            style={[styles.moodChip, selectedMood === mood && styles.moodChipActive]}
          >
            <Text style={[styles.moodText, selectedMood === mood && { color: Colors.primary }]}>{mood}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Context selector */}
      <Text style={[styles.label, { marginTop: Spacing.sm }]}>Content Type</Text>
      <View style={styles.contextGrid}>
        {CONTEXTS.map(ctx => (
          <Pressable
            key={ctx}
            onPress={() => setSelectedContext(ctx)}
            style={[styles.contextChip, selectedContext === ctx && styles.contextChipActive]}
          >
            <Text style={[styles.contextText, selectedContext === ctx && { color: Colors.primary }]}>{ctx}</Text>
          </Pressable>
        ))}
      </View>

      {isGenerating ? (
        <View style={styles.generatingRow}>
          <ActivityIndicator color={Colors.primary} size="small" />
          <Text style={styles.generatingText}>AI analyzing your project...</Text>
        </View>
      ) : (
        <GoldButton
          label="🤖 Generate AI Music Suggestions"
          onPress={handleGenerate}
          size="md"
          fullWidth
        />
      )}

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>
            ✅ {suggestions.length} AI-Suggested Tracks
          </Text>
          {suggestions.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => {
                setPlayingId(playingId === `${i}` ? null : `${i}`);
                onSelectTrack?.(s);
              }}
              style={[styles.suggestionCard, playingId === `${i}` && styles.suggestionCardActive]}
            >
              <View style={styles.suggestionPlay}>
                <MaterialIcons
                  name={playingId === `${i}` ? 'stop' : 'play-arrow'}
                  size={18}
                  color={playingId === `${i}` ? Colors.textInverse : Colors.primary}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.suggestionTitle, playingId === `${i}` && { color: Colors.primary }]}>{s.title}</Text>
                <Text style={styles.suggestionDesc} numberOfLines={2}>{s.description}</Text>
                <View style={styles.suggestionMeta}>
                  <View style={styles.moodTag}><Text style={styles.moodTagText}>{s.mood}</Text></View>
                  <Text style={styles.bpmText}>{s.bpm} BPM</Text>
                  <View style={styles.tagRow}>
                    {s.tags.slice(0, 2).map(tag => (
                      <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                    ))}
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semibold, flex: 1 },
  headerSub: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 16 },
  label: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  moodChip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  moodChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  moodText: { color: Colors.textMuted, fontSize: Typography.xs },
  contextGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  contextChip: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  contextChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  contextText: { color: Colors.textMuted, fontSize: Typography.xs },
  generatingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  generatingText: { color: Colors.primary, fontSize: Typography.sm },
  suggestions: { gap: Spacing.sm },
  suggestionsTitle: { color: Colors.success, fontSize: Typography.xs, fontWeight: Typography.semibold },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: 10, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  suggestionCardActive: { borderColor: Colors.primary + '55', backgroundColor: Colors.primaryGlow },
  suggestionPlay: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.primary + '55' },
  suggestionTitle: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
  suggestionDesc: { color: Colors.textMuted, fontSize: Typography.xs, lineHeight: 15 },
  suggestionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  moodTag: { backgroundColor: Colors.primary + '22', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  moodTagText: { color: Colors.primary, fontSize: 9 },
  bpmText: { color: Colors.textMuted, fontSize: 9 },
  tagRow: { flexDirection: 'row', gap: 3 },
  tag: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 },
  tagText: { color: Colors.textMuted, fontSize: 8 },
});
