// Powered by OnSpace.AI
import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface BufferIndicatorProps {
  level: number;       // 0-1
  size: number;        // buffer size in samples
  isActive?: boolean;
  label?: string;
}

export const BufferIndicator = memo(({ level, size, isActive, label }: BufferIndicatorProps) => {
  const widthAnim = useRef(new Animated.Value(level)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: level,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [level]);

  useEffect(() => {
    if (isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  const barColor = level > 0.8 ? Colors.success : level > 0.4 ? Colors.primary : Colors.error;
  const widthPercent = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.dot, { backgroundColor: barColor, opacity: pulseAnim }]} />
        <Text style={styles.label}>{label || 'Buffer'}</Text>
        <Text style={styles.size}>{size} samples</Text>
        <Text style={[styles.percent, { color: barColor }]}>{Math.round(level * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: widthPercent, backgroundColor: barColor }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Latency: {size === 64 ? '1.5ms' : size === 128 ? '3ms' : size === 256 ? '6ms' : '12ms'}
        </Text>
        <Text style={styles.footerText}>
          Sample Rate: 96kHz / 32-bit
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    flex: 1,
    fontWeight: Typography.medium,
  },
  size: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  percent: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    minWidth: 36,
    textAlign: 'right',
  },
  track: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
});
