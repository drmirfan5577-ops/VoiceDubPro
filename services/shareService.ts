// Powered by OnSpace.AI — Export Share Service
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export interface ShareOptions {
  title: string;
  mimeType?: string;
  dialogTitle?: string;
}

export async function isShareAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}

// Share a file URI (audio/video/subtitle)
export async function shareFile(uri: string, options?: ShareOptions): Promise<boolean> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return false;

    // Ensure it's a local file
    let localUri = uri;
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const filename = uri.split('/').pop() ?? 'export';
      const dest = FileSystem.documentDirectory + filename;
      await FileSystem.downloadAsync(uri, dest);
      localUri = dest;
    }

    await Sharing.shareAsync(localUri, {
      mimeType: options?.mimeType ?? '*/*',
      dialogTitle: options?.dialogTitle ?? options?.title ?? 'Share File',
      UTI: 'public.item',
    });
    return true;
  } catch (e) {
    console.error('shareFile error:', e);
    return false;
  }
}

// Share text content as a temp file
export async function shareTextAsFile(
  content: string,
  filename: string,
  mimeType = 'text/plain'
): Promise<boolean> {
  try {
    const uri = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
    return shareFile(uri, { title: filename, mimeType });
  } catch (e) {
    console.error('shareTextAsFile error:', e);
    return false;
  }
}

// Generate mock export file and share it
export async function shareExportedProject(
  projectName: string,
  quality: string,
  format: 'video' | 'audio' | 'stems' | 'subtitles'
): Promise<boolean> {
  try {
    // Create a manifest JSON to share
    const manifest = {
      app: 'VoiceDub Pro',
      project: projectName,
      quality,
      format,
      exportDate: new Date().toISOString(),
      specs: {
        video: '8K @ 240fps · HDR 10+ · Dolby Vision',
        audio: 'Dolby Atmos 7.1.4 · 96kHz · 32-bit Float',
        codec: 'H.265 HEVC · AV1',
      },
    };
    return shareTextAsFile(
      JSON.stringify(manifest, null, 2),
      `${projectName.replace(/[^a-z0-9]/gi, '_')}_export.json`,
      'application/json'
    );
  } catch {
    return false;
  }
}
