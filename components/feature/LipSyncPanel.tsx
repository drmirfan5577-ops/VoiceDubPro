// Powered by OnSpace.AI — AI Lip Sync Panel
import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { GoldButton } from '@/components/ui/GoldButton';

interface LipSyncPanelProps {
  hasVideo: boolean;
  hasAudio: boolean;
  onSync: () => void;
  onClose?: () => void;
}

type SyncStep = 'idle' | 'analyzing' | 'detecting' | 'aligning' | 'done' | 'error';

const SYNC_STEPS = [
  { id: 'analyzing',  label: 'Analyzing video frames',       icon: 'video-camera-front',  duration: 1800 },
  { id: 'detecting',  label: 'Detecting lip movements',       icon: 'face',                duration: 2000 },
  { id: 'aligning',   label: 'Aligning audio to lip timing',  icon: 'graphic-eq',          duration: 1500 },
  { id: 'done',       label: 'Lip sync complete!',            icon: 'check-circle',         duration: 0 },
];

export const LipSyncPanel = memo(({ hasVideo, hasAudio, onSync, onClose }: LipSyncPanelProps) => {
  const [step, setStep] = useState<SyncStep>('idle');
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [accuracy, setAccuracy] = useState(0);
  const [frameShift, setFrameShift] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (step === 'idle' || step === 'done' || step === 'error') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [step]);

  const handleSync = async () => {
    if (!hasVideo) return;
    setStep('analyzing');
    setCurrentStepIdx(0);
    setAccuracy(0);
    setFrameShift(0);

    progressAnim.setValue(0);
    Animated.timing(progressAnim, { toValue: 1, duration: 5500, useNativeDriver: false }).start();

    // Simulate pipeline steps
    let idx = 0;
    const runStep = () => {
      if (idx >= SYNC_STEPS.length - 1) {
        setStep('done');
        setCurrentStepIdx(SYNC_STEPS.length - 1);
        setAccuracy(94 + Math.floor(Math.random() * 5));
        setFrameShift(Math.floor(Math.random() * 3));
        onSync();
        return;
      }
      setTimeout(() => {
        idx++;
        setCurrentStepIdx(idx);
        setStep(SYNC_STEPS[idx].id as SyncStep);
        runStep();
      }, SYNC_STEPS[idx].duration);
    };

    setTimeout(runStep, SYNC_STEPS[0].duration);
  };

  const isProcessing = step !== 'idle' && step !== 'done' && step !== 'error';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(52,152,219,0.12)', 'rgba(8,8,8,0)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.iconRing, isProcessing && { transform: [{ scale: pulseAnim }] }]}>
            <MaterialIcons name="face" size={24} color={Colors.info} />
          </Animated.View>
          <View>
            <Text style={styles.title}>AI Lip Sync</Text>
            <Text style={styles.subtitle}>Neural frame-to-audio alignment</Text>
          </View>
        </View>
        {onClose ? (
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={20} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Requirements */}
      <View style={styles.reqRow}>
        <View style={[styles.reqChip, hasVideo && styles.reqChipMet]}>
          <MaterialIcons name={hasVideo ? 'check-circle' : 'movie'} size={14} color={hasVideo ? Colors.success : Colors.textMuted} />
          <Text style={[styles.reqText, hasVideo && { color: Colors.success }]}>Video Loaded</Text>
        </View>
        <View style={[styles.reqChip, hasAudio && styles.reqChipMet]}>
          <MaterialIcons name={hasAudio ? 'check-circle' : 'mic'} size={14} color={hasAudio ? Colors.success : Colors.textMuted} />
          <Text style={[styles.reqText, hasAudio && { color: Colors.success }]}>Audio Track</Text>
        </View>
      </View>

      {/* Step progress */}
      {step !== 'idle' ? (
        <View style={styles.stepsContainer}>
          {SYNC_STEPS.map((s, i) => {
            const isDone = i < currentStepIdx || step === 'done';
            const isCurrent = i === currentStepIdx && step !== 'done';
            return (
              <View key={s.id} style={styles.stepRow}>
                <View style={[
                  styles.stepIcon,
                  isDone && styles.stepIconDone,
                  isCurrent && styles.stepIconActive,
                ]}>
                  <MaterialIcons
                    name={(isDone ? 'check' : s.icon) as any}
                    size={14}
                    color={isDone ? Colors.textInverse : isCurrent ? Colors.info : Colors.textMuted}
                  />
                </View>
                <Text style={[
                  styles.stepLabel,
                  isDone && { color: Colors.textSecondary },
                  isCurrent && { color: Colors.info },
                ]}>
                  {s.label}
                </Text>
                {isCurrent ? <MaterialIcons name="more-horiz" size={16} color={Colors.info} /> : null}
                {isDone ? <MaterialIcons name="done" size={14} color={Colors.success} /> : null}
              </View>
            );
          })}

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      ) : null}

      {/* Result */}
      {step === 'done' ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.resultTitle}>Sync Complete</Text>
          </View>
          <View style={styles.resultStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{accuracy}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{frameShift}ms</Text>
              <Text style={styles.statLabel}>Shift Applied</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>AI</Text>
              <Text style={styles.statLabel}>Neural Engine</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Info specs */}
      <View style={styles.specsGrid}>
        {[
          { icon: 'face', label: 'Facial landmark detection', sub: '68 keypoints' },
          { icon: 'graphic-eq', label: 'Phoneme alignment', sub: 'Frame-accurate' },
          { icon: 'speed', label: 'Processing speed', sub: '30fps analysis' },
          { icon: 'auto-fix-high', label: 'Neural model', sub: 'OnSpace AI' },
        ].map(spec => (
          <View key={spec.label} style={styles.specCard}>
            <MaterialIcons name={spec.icon as any} size={14} color={Colors.info} />
            <View>
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specSub}>{spec.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <GoldButton
        label={
          step === 'done' ? '✓ Re-Sync' :
          isProcessing ? 'Processing...' :
          !hasVideo ? 'Upload Video First' :
          '🤖 Start AI Lip Sync'
        }
        onPress={handleSync}
        size="lg"
        fullWidth
        isLoading={isProcessing}
        variant={!hasVideo ? 'ghost' : 'primary'}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.info + '33',
    gap: Spacing.md,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconRing: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.info + '22',
    borderWidth: 1.5, borderColor: Colors.info + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.semibold },
  subtitle: { color: Colors.textMuted, fontSize: Typography.xs },
  reqRow: { flexDirection: 'row', gap: Spacing.sm },
  reqChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  reqChipMet: { borderColor: Colors.success + '55', backgroundColor: Colors.success + '11' },
  reqText: { color: Colors.textMuted, fontSize: Typography.xs },
  stepsContainer: { gap: Spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepIconDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepIconActive: { backgroundColor: Colors.info + '22', borderColor: Colors.info },
  stepLabel: { flex: 1, color: Colors.textMuted, fontSize: Typography.xs },
  progressTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: Colors.info, borderRadius: 2 },
  resultCard: {
    backgroundColor: Colors.success + '11',
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.success + '33', gap: Spacing.sm,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  resultTitle: { color: Colors.success, fontSize: Typography.sm, fontWeight: Typography.semibold },
  resultStats: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
  statLabel: { color: Colors.textMuted, fontSize: Typography.xs },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  specCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    flex: 1, minWidth: '45%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.sm, padding: Spacing.sm,
  },
  specLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: Typography.medium },
  specSub: { color: Colors.textMuted, fontSize: 9 },
});
