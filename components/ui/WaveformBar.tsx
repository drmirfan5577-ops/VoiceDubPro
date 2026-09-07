// Powered by OnSpace.AI
import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/theme';

interface WaveformBarProps {
  data: number[];
  isPlaying?: boolean;
  isRecording?: boolean;
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
  progress?: number; // 0-1
}

export const WaveformBar = memo(({
  data, isPlaying, isRecording, height = 60,
  activeColor = Colors.primary, inactiveColor = Colors.border,
  progress = 0,
}: WaveformBarProps) => {
  const animValues = useRef(data.map(v => new Animated.Value(v))).current;
  const progressAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    if (isRecording) {
      const animations = animValues.map((anim, i) => {
        const newVal = Math.random() * 0.9 + 0.05;
        return Animated.timing(anim, {
          toValue: newVal,
          duration: 150 + i * 5,
          useNativeDriver: false,
        });
      });
      const loop = Animated.loop(Animated.stagger(30, animations));
      loop.start();
      return () => loop.stop();
    }
  }, [isRecording]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const progressX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.bars}>
        {data.map((val, i) => {
          const barHeight = animValues[i] ? undefined : val * height;
          const ratio = i / data.length;
          const isPast = ratio < progress;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: val * height * 0.9,
                  backgroundColor: isPast ? activeColor : (isRecording ? Colors.recording : inactiveColor),
                  opacity: isPast ? 1 : 0.4,
                },
              ]}
            />
          );
        })}
      </View>
      {/* Playhead */}
      <Animated.View style={[styles.playhead, { left: progressX }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    flex: 1,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 3,
    maxWidth: 6,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.primaryLight,
    borderRadius: 1,
  },
});
