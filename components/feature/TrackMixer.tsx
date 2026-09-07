// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { AudioTrack } from '@/contexts/StudioContext';
import { WaveformBar } from '@/components/ui/WaveformBar';
import { useLanguage } from '@/hooks/useLanguage';
import { LANGUAGES } from '@/constants/languages';

interface TrackMixerProps {
  tracks: AudioTrack[];
  isPlaying: boolean;
  isRecording: boolean;
  activeTrackId: string | null;
  playbackPosition: number;
  onVolumeChange: (trackId: string, vol: number) => void;
  onMuteToggle: (trackId: string) => void;
  onRecord: (trackId: string) => void;
  onDelete: (trackId: string) => void;
  onSelectTrack: (trackId: string) => void;
}

export const TrackMixer = memo(({
  tracks, isPlaying, isRecording, activeTrackId, playbackPosition,
  onVolumeChange, onMuteToggle, onRecord, onDelete, onSelectTrack,
}: TrackMixerProps) => {
  const { t, isRTL } = useLanguage();

  if (tracks.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialIcons name="queue-music" size={36} color={Colors.textMuted} />
        <Text style={styles.emptyText}>{t.add_track}</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
      {tracks.map((track, index) => {
        const langConfig = LANGUAGES.find(l => l.code === (track.language as any));
        const isActive = activeTrackId === track.id;
        const isCurrentRecording = isRecording && isActive;
        return (
          <Pressable
            key={track.id}
            onPress={() => onSelectTrack(track.id)}
            style={[styles.track, isActive && styles.trackActive]}
          >
            {/* Track header */}
            <View style={[styles.trackHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.trackNum, track.isPrimary && styles.trackNumPrimary]}>
                <Text style={styles.trackNumText}>{index + 1}</Text>
              </View>
              <View style={[styles.trackInfo, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
                <Text style={styles.trackLang}>
                  {langConfig?.flag} {langConfig?.name ?? track.language}
                </Text>
              </View>
              <View style={[styles.trackControls, isRTL && { flexDirection: 'row-reverse' }]}>
                {/* Mute */}
                <Pressable
                  onPress={() => onMuteToggle(track.id)}
                  hitSlop={8}
                  style={[styles.ctrlBtn, track.isMuted && styles.ctrlBtnActive]}
                >
                  <MaterialIcons
                    name={track.isMuted ? 'volume-off' : 'volume-up'}
                    size={16}
                    color={track.isMuted ? Colors.error : Colors.textSecondary}
                  />
                </Pressable>
                {/* Record */}
                <Pressable
                  onPress={() => onRecord(track.id)}
                  hitSlop={8}
                  style={[styles.ctrlBtn, isCurrentRecording && styles.recordingBtn]}
                >
                  <MaterialIcons
                    name="fiber-manual-record"
                    size={16}
                    color={isCurrentRecording ? Colors.recording : Colors.textSecondary}
                  />
                </Pressable>
                {/* Delete */}
                <Pressable
                  onPress={() => onDelete(track.id)}
                  hitSlop={8}
                  style={styles.ctrlBtn}
                >
                  <MaterialIcons name="close" size={14} color={Colors.textMuted} />
                </Pressable>
              </View>
            </View>

            {/* Waveform */}
            <View style={styles.waveformContainer}>
              <WaveformBar
                data={track.waveformData}
                isPlaying={isPlaying && !track.isMuted}
                isRecording={isCurrentRecording}
                height={44}
                activeColor={isCurrentRecording ? Colors.recording : Colors.primary}
                progress={isPlaying ? playbackPosition : 0}
              />
            </View>

            {/* Volume slider */}
            <View style={[styles.volRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <MaterialIcons name="volume-down" size={14} color={Colors.textMuted} />
              <Slider
                style={styles.slider}
                value={track.volume}
                minimumValue={0}
                maximumValue={1}
                onValueChange={v => onVolumeChange(track.id, v)}
                minimumTrackTintColor={track.isMuted ? Colors.textMuted : Colors.primary}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.primaryLight}
              />
              <Text style={styles.volText}>{Math.round(track.volume * 100)}%</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  list: { flex: 1 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    textAlign: 'center',
  },
  track: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  trackActive: {
    borderColor: Colors.primary,
    ...Shadow.gold,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  trackNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackNumPrimary: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primary,
  },
  trackNumText: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.bold },
  trackInfo: { flex: 1, gap: 2 },
  trackName: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
  trackLang: { color: Colors.textMuted, fontSize: Typography.xs },
  trackControls: { flexDirection: 'row', gap: 4 },
  ctrlBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  ctrlBtnActive: { backgroundColor: Colors.error + '22', borderColor: Colors.error },
  recordingBtn: { backgroundColor: Colors.recordingGlow, borderColor: Colors.recording },
  waveformContainer: {
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  slider: { flex: 1, height: 32 },
  volText: { color: Colors.textMuted, fontSize: Typography.xs, minWidth: 32, textAlign: 'right' },
});
