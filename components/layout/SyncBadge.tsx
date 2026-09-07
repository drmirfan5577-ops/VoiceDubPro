// Powered by OnSpace.AI — Cloud Sync Badge + Notification Drawer
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { SyncStatus, SyncNotification } from '@/hooks/useSyncNotification';

interface SyncBadgeProps {
  status: SyncStatus;
  unreadCount: number;
  notifications: SyncNotification[];
  lastSyncFormatted: string;
  onSync: () => void;
  onMarkRead: () => void;
  onClear: () => void;
}

const STATUS_CONFIG: Record<SyncStatus, { icon: string; color: string; label: string }> = {
  idle:    { icon: 'cloud-queue',    color: Colors.textMuted,    label: 'Sync' },
  syncing: { icon: 'cloud-sync',     color: Colors.info,         label: 'Syncing…' },
  success: { icon: 'cloud-done',     color: Colors.success,      label: 'Synced' },
  error:   { icon: 'cloud-off',      color: Colors.error,        label: 'Error' },
};

export function SyncBadge({
  status, unreadCount, notifications, lastSyncFormatted,
  onSync, onMarkRead, onClear,
}: SyncBadgeProps) {
  const [open, setOpen] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const drawerAnim = useRef(new Animated.Value(0)).current;

  // Spin animation while syncing
  useEffect(() => {
    if (status === 'syncing') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [status]);

  // Bounce badge when new notification
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.spring(bounceAnim, { toValue: 1.4, useNativeDriver: true, damping: 6 }),
        Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, damping: 10 }),
      ]).start();
    }
  }, [unreadCount]);

  // Drawer slide
  useEffect(() => {
    Animated.spring(drawerAnim, {
      toValue: open ? 1 : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [open]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const cfg = STATUS_CONFIG[status];

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.wrapper}>
      {/* Badge button */}
      <Pressable
        onPress={() => { setOpen(v => !v); if (!open) onMarkRead(); }}
        style={[styles.badge, { borderColor: cfg.color + '66' }]}
        hitSlop={6}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcons name={cfg.icon as any} size={18} color={cfg.color} />
        </Animated.View>
        <Text style={[styles.badgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
        {unreadCount > 0 ? (
          <Animated.View style={[styles.unreadBubble, { transform: [{ scale: bounceAnim }] }]}>
            <Text style={styles.unreadText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </Animated.View>
        ) : null}
      </Pressable>

      {/* Notification drawer */}
      {open ? (
        <Animated.View
          style={[
            styles.drawer,
            {
              opacity: drawerAnim,
              transform: [{ translateY: drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.drawerHeader}>
            <MaterialIcons name="notifications" size={14} color={Colors.primary} />
            <Text style={styles.drawerTitle}>Sync Notifications</Text>
            <Text style={styles.drawerSync}>Last: {lastSyncFormatted}</Text>
          </View>

          {/* Sync now */}
          <Pressable onPress={() => { onSync(); setOpen(false); }} style={styles.syncNowBtn}>
            <MaterialIcons name="refresh" size={14} color={Colors.primary} />
            <Text style={styles.syncNowText}>Sync Now</Text>
          </Pressable>

          {/* Notifications list */}
          <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyNotif}>
                <MaterialIcons name="cloud-done" size={24} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            ) : (
              notifications.map(n => (
                <View key={n.id} style={[styles.notifRow, { borderLeftColor: n.type === 'success' ? Colors.success : n.type === 'error' ? Colors.error : Colors.info }]}>
                  <MaterialIcons
                    name={n.type === 'success' ? 'check-circle' : n.type === 'error' ? 'error' : 'info'}
                    size={13}
                    color={n.type === 'success' ? Colors.success : n.type === 'error' ? Colors.error : Colors.info}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifMsg} numberOfLines={2}>{n.message}</Text>
                    <Text style={styles.notifTime}>{formatTime(n.timestamp)}</Text>
                  </View>
                  {n.count ? (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{n.count}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>

          {notifications.length > 0 ? (
            <Pressable onPress={() => { onClear(); setOpen(false); }} style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear All</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 100 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.full,
    borderWidth: 1,
    position: 'relative',
  },
  badgeLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  unreadBubble: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  unreadText: { color: '#FFF', fontSize: 8, fontWeight: Typography.bold },
  drawer: {
    position: 'absolute',
    top: 38,
    right: 0,
    width: 260,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    overflow: 'hidden',
    ...Shadow.gold,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primaryGlow,
  },
  drawerTitle: { flex: 1, color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  drawerSync: { color: Colors.textMuted, fontSize: 9 },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  syncNowText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.semibold },
  notifList: { maxHeight: 200 },
  emptyNotif: { alignItems: 'center', paddingVertical: Spacing.lg, gap: 6 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.xs },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '55',
    borderLeftWidth: 3,
  },
  notifMsg: { color: Colors.textSecondary, fontSize: Typography.xs, lineHeight: 16 },
  notifTime: { color: Colors.textMuted, fontSize: 9, marginTop: 2 },
  countBadge: {
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { color: '#000', fontSize: 9, fontWeight: Typography.bold },
  clearBtn: { padding: Spacing.sm, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border },
  clearText: { color: Colors.error, fontSize: Typography.xs },
});
