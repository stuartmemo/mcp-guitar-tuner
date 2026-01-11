import { GUITAR_FREQ_MIN, GUITAR_FREQ_MAX, DEFAULT_AUDIO_CONFIG } from '../types/index.js';

// Type for pitchfinder's detector function
type PitchDetector = (samples: Float32Array) => number | null;

interface ACF2PlusOptions {
  sampleRate: number;
}

export class PitchDetectorProcessor {
  private detectPitch: PitchDetector | null = null;
  private sampleRate: number;
  private accumulatedSamples: Float32Array;
  private bufferSize: number;
  private rmsThreshold: number;
  private lastFrequency: number | null = null;

  constructor(sampleRate = DEFAULT_AUDIO_CONFIG.sampleRate) {
    this.sampleRate = sampleRate;
    // Need at least 2048 samples for accurate low frequency detection
    // Low E (82 Hz) has a period of ~538 samples at 44100 Hz
    // ACF2+ needs sufficient samples for autocorrelation
    this.bufferSize = 4096;
    this.accumulatedSamples = new Float32Array(0);
    this.rmsThreshold = 0.01; // Ignore quiet signals
  }

  async initialize(): Promise<void> {
    // Dynamically import pitchfinder
    const pitchfinder = await import('pitchfinder');
    // Use ACF2+ algorithm - more reliable than YIN for guitar frequencies
    const ACF2PLUS = pitchfinder.ACF2PLUS as (options: ACF2PlusOptions) => PitchDetector;

    this.detectPitch = ACF2PLUS({
      sampleRate: this.sampleRate,
    });
  }

  // Process incoming audio samples and return detected frequency
  process(samples: Float32Array): number | null {
    if (!this.detectPitch) {
      throw new Error('PitchDetector not initialized. Call initialize() first.');
    }

    // Accumulate samples
    const newBuffer = new Float32Array(this.accumulatedSamples.length + samples.length);
    newBuffer.set(this.accumulatedSamples);
    newBuffer.set(samples, this.accumulatedSamples.length);
    this.accumulatedSamples = newBuffer;

    // Wait until we have enough samples
    if (this.accumulatedSamples.length < this.bufferSize) {
      return this.lastFrequency;
    }

    // Take the most recent bufferSize samples
    const analysisBuffer = this.accumulatedSamples.slice(-this.bufferSize);

    // Keep some overlap for next analysis
    const overlap = Math.floor(this.bufferSize / 2);
    this.accumulatedSamples = this.accumulatedSamples.slice(-overlap);

    // Check RMS to ignore quiet signals
    const rms = this.calculateRMS(analysisBuffer);
    if (rms < this.rmsThreshold) {
      this.lastFrequency = null;
      return null;
    }

    // Detect pitch
    const frequency = this.detectPitch(analysisBuffer);

    // Filter to guitar frequency range
    if (frequency !== null && frequency >= GUITAR_FREQ_MIN && frequency <= GUITAR_FREQ_MAX) {
      this.lastFrequency = frequency;
      return frequency;
    }

    // If we got a frequency outside range, keep the last valid one briefly
    // This helps with stability
    return this.lastFrequency;
  }

  // Get the last detected frequency without processing new samples
  getLastFrequency(): number | null {
    return this.lastFrequency;
  }

  // Reset the detector state
  reset(): void {
    this.accumulatedSamples = new Float32Array(0);
    this.lastFrequency = null;
  }

  // Calculate Root Mean Square of samples
  private calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }
}
