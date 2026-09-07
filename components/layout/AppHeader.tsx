// Powered by OnSpace.AI
import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Shadow } from '@/constants/theme';
import { useLanguage } from '@/hooks/useLanguage';
import { router } from 'expo-router';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showLangPicker?: boolean;
  rightAction?: { icon: string; onPress: () => void; label?: string };
}

export const AppHeader = memo(({ title, showBack, showLangPicker, rightAction }: AppHeaderProps) => {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            hitSlop={8}
          >
            <MaterialIcons
              name={isRTL ? 'chevron-right' : 'chevron-left'}
              size={26}
              color={Colors.primary}
            />
          </Pressable>
        ) : (
          <View style={styles.logoRow}>
            <MaterialIcons name="mic" size={20} color={Colors.primary} />
            <Text style={styles.logoText}>VoiceDub</Text>
            <Text style={styles.logoPro}>PRO</Text>
          </View>
        )}

        <Text style={[styles.title, isRTL && { textAlign: 'right' }]} numberOfLines={1}>
          {title ?? ''}
        </Text>

        <View style={[styles.right, isRTL && { flexDirection: 'row-reverse' }]}>
          {showLangPicker ? (
            <Pressable
              onPress={() => router.push('/(tabs)/settings')}
              style={({ pressed }) => [styles.langBtn, pressed && { opacity: 0.7 }]}
              accessibilityLabel={t.language}
            >
              <MaterialIcons name="language" size={18} color={Colors.primary} />
            </Pressable>
          ) : null}
          {rightAction ? (
            <Pressable
              onPress={rightAction.onPress}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
              hitSlop={8}
            >
              <MaterialIcons name={rightAction.icon as any} size={22} color={Colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  logoPro: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    letterSpacing: 2,
    marginTop: 2,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    marginHorizontal: Spacing.sm,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  langBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1, borderColor: Colors.primary + '44',
  },
});
