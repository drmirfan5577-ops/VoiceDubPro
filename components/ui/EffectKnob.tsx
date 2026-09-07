// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface EffectKnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  onIncrease: () => void;
  onDecrease: () => void;
  color?: string;
}

export const EffectKnob = memo(({
  label, value, min = 0, max = 100, unit = '',
  onIncrease, onDecrease, color = Colors.primary,
}: EffectKnobProps) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={styles.container}>
      {/* Circular indicator */}
      <View style={[styles.ring, { borderColor: Colors.border }]}>
        <View
          style={[
            styles.fill,
            {
              height: `${pct}%`,
              backgroundColor: color,
              opacity: 0.8,
            },
          ]}
        />
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color }]}>
            {value > 0 && (min < 0) ? `+${value}` : `${value}`}
          </Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
      </View>
      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
          onPress={onDecrease}
          hitSlop={8}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}
          onPress={onIncrease}
          hitSlop={8}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 72,
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceCard,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  fill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 28,
  },
  valueContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0, bottom: 0, left: 0, right: 0,
  },
  value: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  unit: {
    fontSize: 8,
    color: Colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  btn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnText: {
    color: Colors.primary,
    fontSize: Typography.md,
    lineHeight: 20,
    fontWeight: Typography.bold,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
