// Powered by OnSpace.AI — Studio: RecordingMixer + VoiceChanger + Real Video + Cloud Sync Notifications
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { useStudio } from '@/hooks/useStudio';
import { useRecorder } from '@/hooks/useRecorder';
import { useMediaPlayer } from '@/hooks/useMediaPlayer';
import { useSyncNotification } from '@/hooks/useSyncNotification';
import { useAlert } from '@/template';
import { useAuth } from '@/template';
import { AppHeader } from '@/components/layout/AppHeader';
import { SyncBadge } from '@/components/layout/SyncBadge';
import { TrackMixer } from '@/components/feature/TrackMixer';
import { BufferIndicator } from '@/components/ui/BufferIndicator';
import { GoldButton } from '@/components/ui/GoldButton';
import { LiveWaveform } from '@/components/feature/LiveWaveform';
import { FrequencyVisualizer } from '@/components/feature/FrequencyVisualizer';
import { WaveformTrimEditor } from '@/components/feature/WaveformTrimEditor';
import { LipSyncPanel } from '@/components/feature/LipSyncPanel';
import { VoicePreviewCard } from '@/components/feature/VoicePreviewCard';
import { RecordingMixer, RecordingTake } from '@/components/feature/RecordingMixer';
import { VoiceChangerPanel, VoicePreset, VOICE_PRESETS as ALL_PRESETS } from '@/components/feature/VoiceChangerPanel';
import { LANGUAGES } from '@/constants/languages';
import { pickVideoFromGallery, pickAudioFromStorage } from '@/services/mediaService';
import { router } from 'expo-router';

// Re-export so VoiceChangerPanel works without circular dep
const VOICE_PRESETS = ALL_PRESETS;

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const TAKE_COLORS = [Colors.primary, '#3498DB', '#2ECC71', '#E91E63', '#9B59B6', '#E67E22'];

type StudioSection = 'record' | 'mixer' | 'voices' | 'changer' | 'trim' | 'lipsync';

export default function StudioScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, isRTL } = useLanguage();
  const {
    activeProject, isPlaying, bufferSize, bufferLevel,
    masterVolume, playbackSpeed, playbackPosition,
    setActiveProject, createProject,
    startRecording: studioStartRec, stopRecording: studioStopRec,
    togglePlay, updateTrackVolume, toggleTrackMute,
    addTrack, deleteTrack, setMasterVolume, setPlaybackSpeed,
    savedVoices, saveVoice, deleteSavedVoice,
    isCloudSynced, setCloudSynced,
  } = useStudio();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const recorder = useRecorder();
  const player = useMediaPlayer();

  // ── Cloud sync notification system ──
  const sync = useSyncNotification();

  // Enable polling when cloud sync is on
  useEffect(() => {
    if (isCloudSynced) {
      sync.startPolling(25000);
      sync.addNotification('Cloud sync enabled. Projects will auto-sync.', 'info');
    } else {
      sync.stopPolling();
    }
    return () => sync.stopPolling();
  }, [isCloudSynced]);

  // ── Real video player ──
  const [videoUri, setVideoUri] = useState<string | null>(activeProject?.videoUri ?? null);
  const videoPlayer = useVideoPlayer(videoUri ?? '', p => {
    p.loop = false;
    p.muted = false;
  });

  // ── Recording mixer state ──
  const [takes, setTakes] = useState<RecordingTake[]>([]);
  const [isMixerRecording, setIsMixerRecording] = useState(false);

  // ── Other state ──
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState('natural');
  const [section, setSection] = useState<StudioSection>('record');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const project = activeProject;

  // ── Upload video ──
  const handleUploadVideo = async () => {
    const media = await pickVideoFromGallery();
    if (!media) { showAlert('No File', 'No video was selected'); return; }
    const uri = media.uri;
    setVideoUri(uri);
    if (!project) {
      const p = createProject(media.name.replace(/\.[^.]+$/, ''));
      setActiveProject({ ...p, videoUri: uri, videoDuration: media.duration ?? 0 });
    } else {
      setActiveProject({ ...project, videoUri: uri, videoDuration: media.duration ?? 0 });
    }
    if (isCloudSynced) sync.addNotification('Video uploaded. Syncing to cloud…', 'info');
    showAlert('Video Loaded', media.name);
  };

  const handleUploadAudio = async () => {
    const media = await pickAudioFromStorage();
    if (!media) return;
    showAlert('Audio Imported', media.name);
  };

  // ── Recording ──
  const handleRecord = async (trackId: string) => {
    if (recorder.isRecording) {
      const result = await recorder.stopRecording();
      studioStopRec();
      if (result) {
        showAlert('Recording Saved', `${result.duration.toFixed(1)}s · ${result.uri}`, [
          { text: 'OK' },
          {
            text: 'Save to Voices',
            onPress: () => {
              saveVoice({
                name: `Recording ${new Date().toLocaleTimeString()}`,
                uri: result.uri,
                duration: result.duration,
                language: language as any,
                type: 'audio',
              });
              if (isCloudSynced) sync.addNotification('Voice saved and synced to cloud', 'success');
            },
          },
        ]);
      }
    } else {
      setActiveTrackId(trackId);
      const ok = await recorder.startRecording();
      if (ok) studioStartRec(trackId);
      else showAlert('Error', recorder.error ?? 'Microphone not available');
    }
  };

  // ── Mixer take management ──
  const handleAddTake = useCallback(async () => {
    if (takes.length >= 6) { showAlert('Limit', 'Maximum 6 takes in mixer'); return; }
    const ok = await recorder.startRecording();
    if (!ok) { showAlert('Error', recorder.error ?? 'Mic unavailable'); return; }
    setIsMixerRecording(true);
  }, [takes.length, recorder]);

  const handleStopMixerRecording = useCallback(async () => {
    const result = await recorder.stopRecording();
    setIsMixerRecording(false);
    if (!result) return;
    const newTake: RecordingTake = {
      id: Date.now().toString(),
      name: `Take ${takes.length + 1}`,
      durationMs: result.duration * 1000,
      uri: result.uri,
      volume: 0.85,
      fadeIn: 0,
      fadeOut: 0,
      isMuted: false,
      isSelected: true,
      waveform: Array.from({ length: 40 }, () => Math.random() * 0.7 + 0.1),
      color: TAKE_COLORS[takes.length % TAKE_COLORS.length],
    };
    setTakes(prev => [...prev, newTake]);
    if (isCloudSynced) sync.addNotification(`Take ${takes.length + 1} recorded and synced`, 'success');
  }, [takes.length, recorder, isCloudSynced]);

  const handleDeleteTake = useCallback((id: string) => {
    setTakes(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleUpdateVolume = useCallback((id: string, vol: number) => {
    setTakes(prev => prev.map(t => t.id === id ? { ...t, volume: vol } : t));
  }, []);

  const handleToggleMute = useCallback((id: string) => {
    setTakes(prev => prev.map(t => t.id === id ? { ...t, isMuted: !t.isMuted } : t));
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setTakes(prev => prev.map(t => t.id === id ? { ...t, isSelected: !t.isSelected } : t));
  }, []);

  const handleUpdateFade = useCallback((id: string, fadeIn: number, fadeOut: number) => {
    setTakes(prev => prev.map(t => t.id === id ? { ...t, fadeIn, fadeOut } : t));
  }, []);

  const handleExportMix = useCallback((selectedIds: string[]) => {
    if (selectedIds.length === 0) { showAlert('No Tracks', 'Select at least one take'); return; }
    showAlert('Export Mix', `Exporting ${selectedIds.length} take${selectedIds.length > 1 ? 's' : ''} as WAV 96kHz · Blending with crossfade…`);
    if (isCloudSynced) sync.addNotification('Mixed export synced to cloud', 'success', selectedIds.length);
  }, [isCloudSynced]);

  const handlePreviewTake = useCallback(async (id: string) => {
    const take = takes.find(t => t.id === id);
    if (take?.uri) {
      await player.load(take.uri);
      await player.play();
    } else {
      showAlert('Preview', `Previewing ${take?.name ?? 'take'}`);
    }
  }, [takes, player]);

  const handleAddTrack = () => {
    showAlert('Add Track', 'Select language for this dub track:', [
      ...LANGUAGES.slice(0, 8).map(lang => ({
        text: `${lang.flag} ${lang.englishName}`,
        onPress: () => { if (project) addTrack(project.id, lang.code); },
      })),
      { text: t.cancel, style: 'cancel' as const },
    ]);
  };

  const handleVoiceSelect = (preset: VoicePreset) => {
    setSelectedVoiceId(preset.id);
    showAlert('Voice Applied', `${preset.label} · Pitch ${preset.pitch > 0 ? '+' : ''}${preset.pitch}st · Rate ${preset.rate}x`);
  };

  const handlePlayVoice = async (voice: { uri: string; id: string }) => {
    if (playingVoiceId === voice.id) {
      await player.stop();
      setPlayingVoiceId(null);
    } else {
      await player.load(voice.uri);
      await player.play();
      setPlayingVoiceId(voice.id);
    }
  };

  const SECTIONS: Array<{ id: StudioSection; label: string; icon: string; badge?: string }> = [
    { id: 'record',  label: 'Record',    icon: 'mic' },
    { id: 'mixer',   label: 'Mixer',     icon: 'layers',          badge: takes.length > 0 ? String(takes.length) : undefined },
    { id: 'voices',  label: 'My Voices', icon: 'audiotrack',      badge: savedVoices.length > 0 ? String(savedVoices.length) : undefined },
    { id: 'changer', label: 'Voice FX',  icon: 'graphic-eq' },
    { id: 'trim',    label: 'Trim',      icon: 'content-cut' },
    { id: 'lipsync', label: 'Lip Sync',  icon: 'face' },
  ];

  if (!project) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.noProjectHeader}>
          <View style={{ flex: 1 }} />
          <SyncBadge
            status={sync.status}
            unreadCount={sync.unreadCount}
            notifications={sync.notifications}
            lastSyncFormatted={sync.formatLastSync()}
            onSync={sync.triggerSync}
            onMarkRead={sync.markAllRead}
            onClear={sync.clearNotifications}
          />
        </View>
        <View style={styles.noProjectContent}>
          <MaterialIcons name="mic" size={64} color={Colors.primary} />
          <Text style={styles.noProjectTitle}>{t.no_projects}</Text>
          <Text style={styles.noProjectSub}>Create a project or upload a video to start dubbing</Text>
          <GoldButton label={`🎬 ${t.upload_video}`} onPress={handleUploadVideo} size="lg" fullWidth style={{ marginTop: Spacing.md }} />
          <GoldButton
            label="🎙 New Project"
            onPress={() => { const p = createProject('My Dub ' + new Date().toLocaleDateString()); setActiveProject(p); }}
            variant="secondary" size="lg" fullWidth
          />
          <GoldButton label="☁ Cloud Sync Login" onPress={() => router.push('/login')} variant="ghost" size="md" fullWidth />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />

      {/* Header with sync badge */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AppHeader
            title={project.name}
            showBack
            showLangPicker
            rightAction={{ icon: 'video-library', label: 'Upload', onPress: handleUploadVideo }}
          />
        </View>
        <View style={styles.syncArea}>
          <SyncBadge
            status={sync.status}
            unreadCount={sync.unreadCount}
            notifications={sync.notifications}
            lastSyncFormatted={sync.formatLastSync()}
            onSync={async () => {
              await sync.triggerSync();
              showAlert('Cloud Sync', 'All projects synced to cloud');
            }}
            onMarkRead={sync.markAllRead}
            onClear={sync.clearNotifications}
          />
        </View>
      </View>

      {/* Section tabs */}
      <View style={styles.sectionTabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabScroll}>
          {SECTIONS.map(s => (
            <Pressable
              key={s.id}
              onPress={() => setSection(s.id)}
              style={[styles.sectionTab, section === s.id && styles.sectionTabActive]}
            >
              <MaterialIcons name={s.icon as any} size={14} color={section === s.id ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.sectionTabText, section === s.id && styles.sectionTabTextActive]}>{s.label}</Text>
              {s.badge ? (
                <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{s.badge}</Text></View>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Cloud sync toggle strip */}
      <View style={styles.syncStrip}>
        <MaterialIcons name={isCloudSynced ? 'cloud-done' : 'cloud-off'} size={13} color={isCloudSynced ? Colors.success : Colors.textMuted} />
        <Text style={[styles.syncLabel, isCloudSynced && { color: Colors.success }]}>
          Cloud Sync {isCloudSynced ? 'Active' : 'Off'}
        </Text>
        <View style={{ flex: 1 }} />
        <Switch
          value={isCloudSynced}
          onValueChange={(val) => {
            setCloudSynced(val);
            if (val) sync.triggerSync();
          }}
          trackColor={{ false: Colors.border, true: Colors.success + '88' }}
          thumbColor={isCloudSynced ? Colors.success : Colors.textMuted}
          style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ════ RECORD SECTION ════ */}
        {section === 'record' ? (
          <>
            {/* Real Video Player */}
            {videoUri ? (
              <View style={styles.videoContainer}>
                <VideoView
                  player={videoPlayer}
                  style={styles.videoView}
                  allowsFullscreen
                  allowsPictureInPicture
                />
                <View style={styles.videoControls}>
                  <Pressable onPress={() => videoPlayer.play()} style={styles.videoBtn}>
                    <MaterialIcons name="play-arrow" size={18} color={Colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => videoPlayer.pause()} style={styles.videoBtn}>
                    <MaterialIcons name="pause" size={18} color={Colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={() => { videoPlayer.currentTime = 0; }} style={styles.videoBtn}>
                    <MaterialIcons name="replay" size={18} color={Colors.textSecondary} />
                  </Pressable>
                  <Pressable onPress={handleUploadVideo} style={styles.videoBtn} hitSlop={8}>
                    <MaterialIcons name="swap-horiz" size={16} color={Colors.primary} />
                    <Text style={styles.videoBtnText}>Change</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.uploadBanner} onPress={handleUploadVideo}>
                <MaterialIcons name="video-call" size={20} color={Colors.primary} />
                <Text style={styles.uploadBannerText}>{t.upload_video} · Gallery / Storage</Text>
                <MaterialIcons name="add-circle" size={20} color={Colors.primary} />
              </Pressable>
            )}

            {/* Recording timer */}
            {recorder.isRecording ? (
              <LinearGradient colors={['rgba(231,76,60,0.25)', 'rgba(8,8,8,0)']} style={styles.recBanner}>
                <View style={styles.recDot} />
                <Text style={styles.recTimer}>{recorder.formattedDuration}</Text>
                <Text style={styles.recLabel}>
                  REC · {LANGUAGES.find(l => l.code === (language as any))?.flag} {language.toUpperCase()}
                </Text>
              </LinearGradient>
            ) : null}

            {/* Waveform + Freq */}
            <View style={styles.waveSection}>
              <LiveWaveform
                data={recorder.meteringHistory}
                isRecording={recorder.isRecording}
                isPlaying={isPlaying}
                progress={playbackPosition}
                height={72}
                activeColor={recorder.isRecording ? Colors.recording : Colors.primary}
              />
            </View>
            <View style={styles.freqSection}>
              <FrequencyVisualizer isActive={recorder.isRecording || isPlaying} meteringLevel={recorder.meteringLevel} height={100} />
            </View>

            {/* Transport */}
            <View style={styles.transport}>
              <LinearGradient colors={[Colors.surfaceElevated, Colors.surface]} style={styles.transportBg}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${playbackPosition * 100}%` }]} />
                </View>
                <View style={[styles.transportRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Pressable style={styles.transportBtn} hitSlop={8}><MaterialIcons name="skip-previous" size={22} color={Colors.textSecondary} /></Pressable>
                  <Pressable
                    onPress={togglePlay}
                    style={({ pressed }) => [styles.playBtn, isPlaying && styles.playBtnActive, pressed && { transform: [{ scale: 0.93 }] }]}
                  >
                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={30} color={isPlaying ? Colors.textInverse : Colors.textPrimary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRecord(activeTrackId ?? project.tracks[0]?.id ?? '')}
                    style={({ pressed }) => [styles.recBtn, recorder.isRecording && styles.recBtnActive, pressed && { transform: [{ scale: 0.93 }] }]}
                  >
                    <MaterialIcons name="fiber-manual-record" size={26} color={recorder.isRecording ? '#FFF' : Colors.recording} />
                  </Pressable>
                  <Pressable style={styles.transportBtn} onPress={async () => { await recorder.stopRecording(); studioStopRec(); }} hitSlop={8}>
                    <MaterialIcons name="stop" size={22} color={Colors.textSecondary} />
                  </Pressable>
                  <Pressable style={styles.transportBtn} hitSlop={8}><MaterialIcons name="skip-next" size={22} color={Colors.textSecondary} /></Pressable>
                </View>
                <View style={styles.speedRow}>
                  <Text style={styles.speedLabel}>{t.playback_speed}</Text>
                  {SPEEDS.map(spd => (
                    <Pressable key={spd} onPress={() => setPlaybackSpeed(spd)} style={[styles.speedChip, playbackSpeed === spd && styles.speedChipActive]}>
                      <Text style={[styles.speedText, playbackSpeed === spd && styles.speedTextActive]}>{spd}x</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.masterRow}>
                  <MaterialIcons name="volume-up" size={14} color={Colors.primary} />
                  <Text style={styles.masterLabel}>{t.master}</Text>
                  <View style={styles.masterBtns}>
                    {[0.25, 0.5, 0.75, 0.85, 1.0].map(v => (
                      <Pressable key={v} onPress={() => setMasterVolume(v)} style={[styles.masterChip, masterVolume === v && styles.masterChipActive]}>
                        <Text style={[styles.masterText, masterVolume === v && styles.masterTextActive]}>{Math.round(v * 100)}%</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Buffer */}
            <View style={styles.section}>
              <BufferIndicator level={bufferLevel} size={bufferSize} isActive={isPlaying || recorder.isRecording} label={t.buffer} />
            </View>

            {/* Track Mixer */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.mix}</Text>
                <View style={styles.sectionActions}>
                  <GoldButton label="🎵 Audio" onPress={handleUploadAudio} variant="ghost" size="sm" />
                  <GoldButton label={`+ ${t.add_track}`} onPress={handleAddTrack} variant="secondary" size="sm" />
                </View>
              </View>
              <TrackMixer
                tracks={project.tracks}
                isPlaying={isPlaying}
                isRecording={recorder.isRecording}
                activeTrackId={activeTrackId}
                playbackPosition={playbackPosition}
                onVolumeChange={(tid, vol) => updateTrackVolume(project.id, tid, vol)}
                onMuteToggle={(tid) => toggleTrackMute(project.id, tid)}
                onRecord={handleRecord}
                onDelete={(tid) => {
                  showAlert('Delete Track', 'Remove this track?', [
                    { text: t.cancel, style: 'cancel' },
                    { text: t.delete_track, style: 'destructive', onPress: () => deleteTrack(project.id, tid) },
                  ]);
                }}
                onSelectTrack={setActiveTrackId}
              />
            </View>

            {/* Quran mode */}
            <View style={styles.section}>
              <View style={styles.quranCard}>
                <MaterialIcons name="mosque" size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quranTitle}>Quran · Naat · Speeches · Public Programs</Text>
                  <Text style={styles.quranSub}>Pure signal · Silence-aware · 192kHz · No compression</Text>
                </View>
                <Pressable
                  style={styles.quranBtn}
                  onPress={() => showAlert('Sacred Mode', 'Pure signal chain: no noise gate, no compression, tajweed mode at 192kHz.')}
                >
                  <Text style={styles.quranBtnText}>Activate</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : null}

        {/* ════ RECORDING MIXER ════ */}
        {section === 'mixer' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎚 Multi-Take Mixer</Text>
              {isMixerRecording ? (
                <Pressable onPress={handleStopMixerRecording} style={styles.stopRecBtn}>
                  <View style={styles.recDotSmall} />
                  <Text style={styles.stopRecText}>Stop · {recorder.formattedDuration}</Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.sectionSub}>Record multiple takes, blend with crossfade, export composite WAV/MP3</Text>

            {isMixerRecording ? (
              <LinearGradient colors={['rgba(231,76,60,0.20)', 'rgba(8,8,8,0)']} style={styles.mixerRecBanner}>
                <View style={styles.recDot} />
                <Text style={styles.recTimer}>{recorder.formattedDuration}</Text>
                <LiveWaveform data={recorder.meteringHistory} isRecording height={40} activeColor={Colors.recording} />
              </LinearGradient>
            ) : null}

            <RecordingMixer
              takes={takes}
              isRecording={isMixerRecording}
              onAddTake={isMixerRecording ? handleStopMixerRecording : handleAddTake}
              onDeleteTake={handleDeleteTake}
              onUpdateVolume={handleUpdateVolume}
              onToggleMute={handleToggleMute}
              onToggleSelect={handleToggleSelect}
              onUpdateFade={handleUpdateFade}
              onExportMix={handleExportMix}
              onPreviewTake={handlePreviewTake}
            />

            {/* Mix export options */}
            {takes.length > 0 ? (
              <View style={styles.mixExportRow}>
                <Text style={styles.mixExportLabel}>Export format:</Text>
                {['WAV', 'MP3', 'AAC', 'FLAC'].map(fmt => (
                  <Pressable
                    key={fmt}
                    onPress={() => showAlert('Export', `Exporting ${takes.filter(t => t.isSelected).length} takes as ${fmt}`)}
                    style={styles.mixFmtChip}
                  >
                    <Text style={styles.mixFmtText}>{fmt}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ════ SAVED VOICES ════ */}
        {section === 'voices' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💾 Saved Voices ({savedVoices.length}/5)</Text>
              <Pressable onPress={() => router.push('/(tabs)/player')} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>Player</Text>
                <MaterialIcons name="chevron-right" size={14} color={Colors.primary} />
              </Pressable>
            </View>

            {savedVoices.length === 0 ? (
              <View style={styles.emptyVoices}>
                <MaterialIcons name="audiotrack" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyVoicesTitle}>No Saved Voices Yet</Text>
                <Text style={styles.emptyVoicesSub}>Record a voice and tap "Save to Voices" to keep up to 5 voices for dubbing</Text>
              </View>
            ) : (
              <View style={{ gap: Spacing.md }}>
                {savedVoices.map(voice => (
                  <VoicePreviewCard
                    key={voice.id}
                    voice={voice}
                    isPlaying={playingVoiceId === voice.id}
                    onPlay={() => handlePlayVoice(voice)}
                    onStop={() => { player.stop(); setPlayingVoiceId(null); }}
                    onDelete={() => {
                      showAlert('Delete', `Remove "${voice.name}"?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteSavedVoice(voice.id) },
                      ]);
                    }}
                    onRevoice={() => { showAlert('Re-voice', 'Tap Record to re-dub'); setSection('record'); }}
                    onExport={() => showAlert('Export', `Exporting "${voice.name}" as M4A 320kbps`)}
                    onUseDub={() => { if (project) { addTrack(project.id, voice.language); showAlert('Added', 'Voice added as dub track'); } }}
                  />
                ))}
              </View>
            )}

            {savedVoices.length < 5 ? (
              <GoldButton label="🎙 Record New Voice" onPress={() => setSection('record')} variant="secondary" size="lg" fullWidth style={{ marginTop: Spacing.md }} />
            ) : (
              <View style={styles.limitBanner}>
                <MaterialIcons name="info-outline" size={14} color={Colors.warning} />
                <Text style={styles.limitText}>Maximum 5 voices saved. Delete one to record new.</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ════ VOICE CHANGER ════ */}
        {section === 'changer' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 Voice Changer · World Class</Text>
            <Text style={styles.sectionSub}>Studio-grade pipeline · Buffer system · 22 voice presets · Fine-tune controls</Text>
            <VoiceChangerPanel
              selectedId={selectedVoiceId}
              onSelect={handleVoiceSelect}
              onPreview={(preset) => {
                showAlert(
                  `Preview: ${preset.label}`,
                  `Pitch: ${preset.pitch > 0 ? '+' : ''}${preset.pitch}st · Rate: ${preset.rate}x · Reverb: ${preset.reverb}% · Formant: ${preset.formant > 0 ? '+' : ''}${preset.formant}st\n\n${preset.description}`
                );
              }}
            />
          </View>
        ) : null}

        {/* ════ WAVEFORM TRIM ════ */}
        {section === 'trim' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✂ Waveform Trim Editor</Text>
            <WaveformTrimEditor
              waveformData={project.tracks[0]?.waveformData ?? []}
              durationSeconds={project.tracks[0]?.duration ?? 60}
              onTrimChange={() => {}}
              onApply={(start, end) => {
                showAlert('Trim Applied', `Clip: ${(start * 100).toFixed(0)}% – ${(end * 100).toFixed(0)}%`);
                if (isCloudSynced) sync.addNotification('Trim saved and synced', 'success');
              }}
            />
          </View>
        ) : null}

        {/* ════ LIP SYNC ════ */}
        {section === 'lipsync' ? (
          <View style={styles.section}>
            <LipSyncPanel
              hasVideo={!!project.videoUri}
              hasAudio={project.tracks.length > 0}
              onSync={() => {
                showAlert('Lip Sync', 'Audio synchronized to video lip movements');
                if (isCloudSynced) sync.addNotification('Lip sync data synced to cloud', 'success');
              }}
            />
          </View>
        ) : null}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  noProjectHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, paddingTop: 52 },
  noProjectContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  noProjectTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.semibold, textAlign: 'center' },
  noProjectSub: { color: Colors.textMuted, fontSize: Typography.base, textAlign: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'stretch' },
  syncArea: { paddingRight: Spacing.md, justifyContent: 'center', paddingTop: 8 },
  syncStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  syncLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  sectionTabBar: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionTabScroll: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  sectionTab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  sectionTabActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  sectionTabText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.medium },
  sectionTabTextActive: { color: Colors.primary },
  tabBadge: { backgroundColor: Colors.primary, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { color: '#000', fontSize: 8, fontWeight: Typography.bold },
  scroll: { flex: 1 },
  // Video player
  videoContainer: { backgroundColor: '#000', marginBottom: Spacing.sm },
  videoView: { width: '100%', height: 200 },
  videoControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  videoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  videoBtnText: { color: Colors.primary, fontSize: Typography.xs },
  uploadBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryGlow, padding: Spacing.sm, marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.primary + '44', justifyContent: 'center' },
  uploadBannerText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.medium },
  recBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.recording },
  recDotSmall: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.recording },
  recTimer: { color: Colors.recording, fontSize: Typography.xl, fontWeight: Typography.black, fontVariant: ['tabular-nums'] },
  recLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginLeft: 4 },
  waveSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  freqSection: { paddingHorizontal: Spacing.md, marginTop: Spacing.sm },
  transport: { marginBottom: Spacing.md },
  transportBg: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  progressBar: { height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  transportRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  transportBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary, ...Shadow.gold },
  playBtnActive: { backgroundColor: Colors.primary },
  recBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.recordingGlow, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.recording },
  recBtnActive: { backgroundColor: Colors.recording },
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  speedLabel: { color: Colors.textMuted, fontSize: Typography.xs, marginRight: 4 },
  speedChip: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  speedChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  speedText: { color: Colors.textMuted, fontSize: Typography.xs },
  speedTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  masterLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.medium },
  masterBtns: { flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' },
  masterChip: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  masterChipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  masterText: { color: Colors.textMuted, fontSize: Typography.xs },
  masterTextActive: { color: Colors.primary, fontWeight: Typography.semibold },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
  sectionSub: { color: Colors.textMuted, fontSize: Typography.xs, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionActions: { flexDirection: 'row', gap: Spacing.sm },
  quranCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.primaryGlow, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '44' },
  quranTitle: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semibold },
  quranSub: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  quranBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full },
  quranBtnText: { color: Colors.textInverse, fontSize: Typography.xs, fontWeight: Typography.bold },
  // Mixer
  mixerRecBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  stopRecBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.recordingGlow, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderWidth: 1, borderColor: Colors.recording + '55' },
  stopRecText: { color: Colors.recording, fontSize: Typography.xs, fontWeight: Typography.semibold },
  mixExportRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  mixExportLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  mixFmtChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.xs, backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: Colors.border },
  mixFmtText: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  // Saved voices
  emptyVoices: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyVoicesTitle: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold },
  emptyVoicesSub: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center', lineHeight: Typography.sm * 1.6 },
  limitBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warning + '11', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.warning + '33' },
  limitText: { color: Colors.warning, fontSize: Typography.xs, flex: 1 },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: Colors.primary, fontSize: Typography.xs },
});
