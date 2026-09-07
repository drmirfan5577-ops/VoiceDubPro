// Powered by OnSpace.AI — Cloud Sync Notification Hook
import { useState, useCallback, useRef } from 'react';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: number;
  count?: number;
}

export function useSyncNotification() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [notifications, setNotifications] = useState<SyncNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addNotification = useCallback((msg: string, type: SyncNotification['type'] = 'info', count?: number) => {
    const notif: SyncNotification = {
      id: Date.now().toString(),
      message: msg,
      type,
      timestamp: Date.now(),
      count,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 20));
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Simulate polling cloud sync (polling replaces realtime)
  const startPolling = useCallback((intervalMs = 30000) => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      setStatus('syncing');
      try {
        // Simulate a sync check
        await new Promise(r => setTimeout(r, 600));
        const now = Date.now();
        setLastSyncTime(now);
        setStatus('success');
        // Occasionally surface a new-data notification
        if (Math.random() > 0.6) {
          const count = Math.floor(Math.random() * 3) + 1;
          addNotification(`${count} project${count > 1 ? 's' : ''} synced from cloud`, 'success', count);
        }
      } catch {
        setStatus('error');
        addNotification('Cloud sync failed. Will retry.', 'error');
      }
    }, intervalMs);
  }, [addNotification]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setStatus('idle');
  }, []);

  const triggerSync = useCallback(async () => {
    setStatus('syncing');
    addNotification('Syncing projects to cloud…', 'info');
    await new Promise(r => setTimeout(r, 1200));
    const now = Date.now();
    setLastSyncTime(now);
    setStatus('success');
    addNotification('All projects synced successfully', 'success');
    return true;
  }, [addNotification]);

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const diff = Date.now() - lastSyncTime;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return {
    status,
    notifications,
    unreadCount,
    lastSyncTime,
    formatLastSync,
    addNotification,
    markAllRead,
    clearNotifications,
    startPolling,
    stopPolling,
    triggerSync,
  };
}
