import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import { AudioConfig, DEFAULT_AUDIO_CONFIG } from '../types/index.js';

const execAsync = promisify(exec);

// Type declaration for the mic module (no types available)
interface MicInstance {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  getAudioStream: () => NodeJS.ReadableStream;
}

interface MicOptions {
  rate: string;
  channels: string;
  bitwidth: string;
  encoding: string;
  device?: string;
  exitOnSilence?: number;
  fileType?: string;
  debug?: boolean;
}

type MicConstructor = (options: MicOptions) => MicInstance;

export interface MicrophoneCaptureEvents {
  audio: (samples: Float32Array) => void;
  error: (error: Error) => void;
  started: () => void;
  stopped: () => void;
}

// Type-safe EventEmitter interface
export declare interface MicrophoneCapture {
  on<K extends keyof MicrophoneCaptureEvents>(event: K, listener: MicrophoneCaptureEvents[K]): this;
  once<K extends keyof MicrophoneCaptureEvents>(event: K, listener: MicrophoneCaptureEvents[K]): this;
  emit<K extends keyof MicrophoneCaptureEvents>(event: K, ...args: Parameters<MicrophoneCaptureEvents[K]>): boolean;
  removeListener<K extends keyof MicrophoneCaptureEvents>(event: K, listener: MicrophoneCaptureEvents[K]): this;
}

export class MicrophoneCapture extends EventEmitter {
  private mic: MicInstance | null = null;
  private config: AudioConfig;
  private isRunning = false;

  constructor(config: Partial<AudioConfig> = {}) {
    super();
    this.config = { ...DEFAULT_AUDIO_CONFIG, ...config };
  }

  async checkSoxInstalled(): Promise<void> {
    try {
      await execAsync('which sox');
    } catch {
      throw new Error(
        'sox is not installed. Install it with: brew install sox\n' +
        'sox is required for microphone access on macOS.'
      );
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Microphone is already running');
    }

    // Check sox is installed
    await this.checkSoxInstalled();

    // Dynamically import mic (CommonJS module)
    const micModule = await import('mic');
    const Mic: MicConstructor = micModule.default || micModule;

    // Create mic instance
    this.mic = Mic({
      rate: String(this.config.sampleRate),
      channels: String(this.config.channels),
      bitwidth: String(this.config.bitDepth),
      encoding: 'signed-integer',
      fileType: 'raw',
      debug: false,
    });

    const audioStream = this.mic.getAudioStream();

    audioStream.on('data', (buffer: Buffer) => {
      const samples = this.bufferToFloat32(buffer);
      this.emit('audio', samples);
    });

    audioStream.on('error', (err: Error) => {
      this.emit('error', err);
    });

    this.mic.start();
    this.isRunning = true;
    this.emit('started');
  }

  stop(): void {
    if (this.mic && this.isRunning) {
      this.mic.stop();
      this.mic = null;
      this.isRunning = false;
      this.emit('stopped');
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }

  // Convert 16-bit signed integer PCM buffer to Float32Array (-1.0 to 1.0)
  private bufferToFloat32(buffer: Buffer): Float32Array {
    const samples = new Float32Array(buffer.length / 2);
    for (let i = 0; i < samples.length; i++) {
      // Read 16-bit signed little-endian
      const int16 = buffer.readInt16LE(i * 2);
      // Normalize to -1.0 to 1.0
      samples[i] = int16 / 32768;
    }
    return samples;
  }
}
