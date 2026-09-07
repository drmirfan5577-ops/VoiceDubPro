// Powered by OnSpace.AI — Real Recording Service (expo-av)
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface RecordingResult {
  uri: string;
  duration: number;
  fileSize: number;
}

class RecordingService {
  private recording: Audio.Recording | null = null;
  private metering: number[] = [];
  private meteringInterval: ReturnType<typeof setInterval> | null = null;
  private onMeteringUpdate?: (level: number) => void;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async startRecording(onMetering?: (level: number) => void): Promise<boolean> {
    try {
      const granted = await this.requestPermissions();
      if (!granted) return false;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        {
          android: {
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 320000,
          },
          ios: {
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.MAX,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 320000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 320000,
          },
        },
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            // metering is in dB, typically -160 to 0
            const normalised = Math.max(0, Math.min(1, (status.metering + 160) / 160));
            this.metering.push(normalised);
            onMetering?.(normalised);
          }
        },
        100
      );

      this.recording = recording;
      this.onMeteringUpdate = onMetering;
      this.metering = [];
      return true;
    } catch (e) {
      console.error('Start recording error:', e);
      return false;
    }
  }

  async stopRecording(): Promise<RecordingResult | null> {
    try {
      if (!this.recording) return null;

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();
      this.recording = null;

      if (!uri) return null;

      // Move to persistent storage
      const fileName = `recording_${Date.now()}.m4a`;
      const destUri = `${FileSystem.documentDirectory}recordings/${fileName}`;

      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}recordings/`,
        { intermediates: true }
      );
      await FileSystem.moveAsync({ from: uri, to: destUri });

      const fileInfo = await FileSystem.getInfoAsync(destUri);
      const fileSize = fileInfo.exists && 'size' in fileInfo ? (fileInfo.size ?? 0) : 0;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      return {
        uri: destUri,
        duration: (status as any).durationMillis ? (status as any).durationMillis / 1000 : 0,
        fileSize,
      };
    } catch (e) {
      console.error('Stop recording error:', e);
      return null;
    }
  }

  getMetering(): number[] {
    return [...this.metering];
  }

  isRecording(): boolean {
    return this.recording !== null;
  }

  async listRecordings(): Promise<string[]> {
    try {
      const dir = `${FileSystem.documentDirectory}recordings/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const files = await FileSystem.readDirectoryAsync(dir);
      return files.map(f => dir + f);
    } catch {
      return [];
    }
  }

  async deleteRecording(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {}
  }
}

export const recordingService = new RecordingService();
