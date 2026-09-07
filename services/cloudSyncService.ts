// Powered by OnSpace.AI — Cloud Sync Service
import { getSupabaseClient } from '@/template';
import { DubProject, AudioTrack } from '@/contexts/StudioContext';

const supabase = getSupabaseClient();

// ─── Projects ─────────────────────────────────────────────────────
export async function syncProjectToCloud(project: DubProject, userId: string) {
  const { data, error } = await supabase
    .from('vdp_projects')
    .upsert({
      id: project.id.length === 36 ? project.id : undefined,
      user_id: userId,
      name: project.name,
      video_uri: project.videoUri,
      video_duration: project.videoDuration,
      video_thumbnail: project.videoThumbnail,
      export_quality: project.exportQuality,
      mode: project.mode,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) console.error('syncProject error:', error);
  return { data, error };
}

export async function fetchCloudProjects(userId: string) {
  const { data, error } = await supabase
    .from('vdp_projects')
    .select('*, vdp_tracks(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) console.error('fetchProjects error:', error);
  return { data, error };
}

export async function deleteCloudProject(projectId: string) {
  const { error } = await supabase
    .from('vdp_projects')
    .delete()
    .eq('id', projectId);
  return { error };
}

// ─── Tracks ───────────────────────────────────────────────────────
export async function syncTrackToCloud(track: AudioTrack, projectId: string, userId: string) {
  const { data, error } = await supabase
    .from('vdp_tracks')
    .upsert({
      id: track.id.length === 36 ? track.id : undefined,
      project_id: projectId,
      user_id: userId,
      name: track.name,
      language: track.language,
      duration: track.duration,
      volume: track.volume,
      is_muted: track.isMuted,
      is_primary: track.isPrimary,
      effect_preset: track.effectPreset,
      waveform_data: track.waveformData,
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) console.error('syncTrack error:', error);
  return { data, error };
}

// ─── Subtitles ────────────────────────────────────────────────────
export async function saveSubtitlesToCloud(
  projectId: string,
  userId: string,
  language: string,
  content: string,
  format: string,
  style: object
) {
  const { data, error } = await supabase
    .from('vdp_subtitles')
    .insert({ project_id: projectId, user_id: userId, language, content, format, style })
    .select()
    .single();

  if (error) console.error('saveSubtitles error:', error);
  return { data, error };
}

export async function fetchSubtitles(projectId: string) {
  const { data, error } = await supabase
    .from('vdp_subtitles')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return { data, error };
}
