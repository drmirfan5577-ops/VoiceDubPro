// Powered by OnSpace.AI — Live Recording Waveform Visualizer
import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/theme';

interface LiveWaveformProps {
  data: number[];          // 0-1 amplitude values (last N samples)
  isRecording: boolean;
  isPlaying: boolean;
  height?: number;
  barCount?: number;
  activeColor?: string;
  inactiveColor?: string;
  progress?: number;       // 0-1 playback progress
}

export const LiveWaveform = memo(({
  data,
  isRecording,
  isPlaying,
  height = 64,
  barCount = 60,
  activeColor = Colors.primary,
  inactiveColor = Colors.border,
  progress = 0,
}: LiveWaveformProps) => {
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isRecording) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      glowAnim.setValue(0.3);
    }
  }, [isRecording]);

  const displayData = React.useMemo(() => {
    if (data.length === 0) {
      return Array.from({ length: barCount }, (_, i) =>
        isRecording ? 0.05 : 0.15 + Math.sin(i * 0.5) * 0.08
      );
    }
    // Pad or trim to barCount
    if (data.length >= barCount) return data.slice(-barCount);
    return [...Array(barCount - data.length).fill(0.05), ...data];
  }, [data, barCount, isRecording]);

  const barWidth = 2;
  const gap = 2;

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View
        style={[
          styles.barsRow,
          { opacity: isRecording ? glowAnim : 1 },
        ]}
      >
        {displayData.map((amplitude, index) => {
          const barHeight = Math.max(3, amplitude * (height - 6));
          const isBefore = index / barCount <= progress;
          const color = isPlaying
            ? isBefore ? activeColor : inactiveColor
            : isRecording
            ? activeColor
            : inactiveColor;
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  width: barWidth,
                  marginHorizontal: gap / 2,
                  backgroundColor: color,
                  borderRadius: barWidth / 2,
                },
              ]}
            />
          );
        })}
      </Animated.View>
      {/* Playhead */}
      {isPlaying && progress > 0 ? (
        <View
          style={[
            styles.playhead,
            { left: `${progress * 100}%` },
          ]}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  bar: {},
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.primaryLight,
    opacity: 0.9,
  },
});
