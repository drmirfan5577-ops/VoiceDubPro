// Powered by OnSpace.AI — Real-Time Cloud Sync Hook (polling-based)
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/template';
import { syncProjectToCloud, fetchCloudProjects, syncTrackToCloud } from '@/services/cloudSyncService';
import { DubProject } from '@/contexts/StudioContext';

interface UseCloudSyncOptions {
  enabled: boolean;
  projects: DubProject[];
  onProjectsFetched?: (projects: DubProject[]) => void;
  pollIntervalMs?: number;
}

export function useCloudSync({
  enabled,
  projects,
  onProjectsFetched,
  pollIntervalMs = 30000,
}: UseCloudSyncOptions) {
  const { user } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncRef = useRef<number>(0);
  const isSyncingRef = useRef(false);

  const syncAll = useCallback(async () => {
    if (!user || !enabled || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      // Push local projects to cloud
      for (const project of projects) {
        await syncProjectToCloud(project, user.id);
        // Sync tracks
        for (const track of project.tracks) {
          await syncTrackToCloud(track, project.id, user.id);
        }
      }
      lastSyncRef.current = Date.now();
      // Pull from cloud
      const { data } = await fetchCloudProjects(user.id);
      if (data && onProjectsFetched) {
        // Map cloud data to DubProject format
        const cloudProjects: DubProject[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          videoUri: p.video_uri ?? null,
          videoDuration: p.video_duration ?? 0,
          videoThumbnail: p.video_thumbnail ?? null,
          tracks: (p.vdp_tracks ?? []).map((t: any) => ({
            id: t.id,
            name: t.name,
            language: t.language,
            duration: t.duration ?? 0,
            volume: t.volume ?? 0.8,
            isMuted: t.is_muted ?? false,
            isPrimary: t.is_primary ?? false,
            waveformData: t.waveform_data ?? [],
            effectPreset: t.effect_preset ?? {},
            audioUri: t.audio_uri,
          })),
          createdAt: new Date(p.created_at).getTime(),
          exportQuality: p.export_quality ?? 'UltraHD',
          mode: p.mode ?? 'studio',
        }));
        onProjectsFetched(cloudProjects);
      }
    } catch (e) {
      console.error('Cloud sync error:', e);
    } finally {
      isSyncingRef.current = false;
    }
  }, [user, enabled, projects, onProjectsFetched]);

  // Start/stop polling based on enabled + auth state
  useEffect(() => {
    if (!enabled || !user) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    // Sync immediately on enable
    syncAll();

    // Then poll
    pollRef.current = setInterval(syncAll, pollIntervalMs);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled, user?.id, pollIntervalMs]);

  return {
    syncNow: syncAll,
    lastSynced: lastSyncRef.current,
  };
}
