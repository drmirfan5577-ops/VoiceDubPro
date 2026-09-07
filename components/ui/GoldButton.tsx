// Powered by OnSpace.AI
import React, { memo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

interface GoldButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const GoldButton = memo(({
  label, onPress, variant = 'primary',
  size = 'md', isLoading, disabled, style, textStyle, fullWidth,
}: GoldButtonProps) => {
  const isDisabled = disabled || isLoading;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && { alignSelf: 'stretch' },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {isLoading
        ? <ActivityIndicator color={variant === 'primary' ? Colors.textInverse : Colors.primary} size="small" />
        : <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`], textStyle]}>
            {label}
          </Text>
      }
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    ...Shadow.sm,
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadow.gold,
  },
  secondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 36 },
  size_md: { paddingHorizontal: Spacing.lg, paddingVertical: 12, minHeight: 44 },
  size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 52 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.4 },
  label: { fontWeight: Typography.semibold, letterSpacing: 0.3 },
  label_primary: { color: Colors.textInverse },
  label_secondary: { color: Colors.primary },
  label_ghost: { color: Colors.primary },
  label_danger: { color: '#FFF' },
  labelSize_sm: { fontSize: Typography.sm },
  labelSize_md: { fontSize: Typography.base },
  labelSize_lg: { fontSize: Typography.md },
});
