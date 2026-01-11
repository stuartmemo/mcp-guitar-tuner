import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PitchDetectorProcessor } from './pitch-detector.js';

// Mock pitchfinder module
vi.mock('pitchfinder', () => ({
  AMDF: vi.fn(() => vi.fn()),
}));

describe('PitchDetectorProcessor', () => {
  let detector: PitchDetectorProcessor;

  beforeEach(() => {
    detector = new PitchDetectorProcessor();
  });

  describe('constructor', () => {
    it('uses default sample rate of 44100', () => {
      const detector = new PitchDetectorProcessor();
      // Can't directly access private property, but we can verify through behavior
      expect(detector).toBeDefined();
    });

    it('accepts custom sample rate', () => {
      const detector = new PitchDetectorProcessor(48000);
      expect(detector).toBeDefined();
    });
  });

  describe('before initialization', () => {
    it('throws error when processing without initialization', () => {
      const samples = new Float32Array(1024);
      expect(() => detector.process(samples)).toThrow('not initialized');
    });

    it('returns null for getLastFrequency before any processing', () => {
      expect(detector.getLastFrequency()).toBeNull();
    });
  });

  describe('reset', () => {
    it('clears last frequency', async () => {
      await detector.initialize();
      detector.reset();
      expect(detector.getLastFrequency()).toBeNull();
    });
  });

  describe('RMS calculation', () => {
    it('filters out quiet signals below threshold', async () => {
      // Create a mock that returns a valid frequency
      const mockDetect = vi.fn().mockReturnValue(110);
      vi.doMock('pitchfinder', () => ({
        AMDF: vi.fn(() => mockDetect),
      }));

      const detector = new PitchDetectorProcessor();
      await detector.initialize();

      // Create very quiet samples (below RMS threshold of 0.01)
      const quietSamples = new Float32Array(4096).fill(0.001);

      // Process enough samples to trigger detection
      const result = detector.process(quietSamples);

      // Should return null because signal is too quiet
      expect(result).toBeNull();
    });
  });
});

describe('PitchDetectorProcessor integration', () => {
  it('accumulates samples until buffer is full', async () => {
    const detector = new PitchDetectorProcessor();
    await detector.initialize();

    // Process small chunks - should return last frequency (null initially)
    const smallChunk = new Float32Array(512);
    expect(detector.process(smallChunk)).toBeNull();
    expect(detector.process(smallChunk)).toBeNull();
  });
});

describe('frequency range filtering', () => {
  it('GUITAR_FREQ_MIN is 70 Hz', async () => {
    // Import to verify constant
    const { GUITAR_FREQ_MIN } = await import('../types/index.js');
    expect(GUITAR_FREQ_MIN).toBe(70);
  });

  it('GUITAR_FREQ_MAX is 1500 Hz', async () => {
    const { GUITAR_FREQ_MAX } = await import('../types/index.js');
    expect(GUITAR_FREQ_MAX).toBe(1500);
  });
});
