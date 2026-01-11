import { describe, it, expect } from 'vitest';
import { calculateCents, findClosestString, createPitchResult } from './note-mapper.js';
import { getTuningById } from './tunings.js';

const standardTuning = getTuningById('standard')!;

describe('calculateCents', () => {
  it('returns 0 for identical frequencies', () => {
    expect(calculateCents(440, 440)).toBe(0);
  });

  it('returns 100 cents for one semitone up', () => {
    // A4 to A#4 (440 to ~466.16)
    const cents = calculateCents(466.16, 440);
    expect(cents).toBeCloseTo(100, 0);
  });

  it('returns -100 cents for one semitone down', () => {
    // A4 to G#4 (440 to ~415.30)
    const cents = calculateCents(415.30, 440);
    expect(cents).toBeCloseTo(-100, 0);
  });

  it('returns 1200 cents for one octave up', () => {
    expect(calculateCents(880, 440)).toBe(1200);
  });

  it('returns -1200 cents for one octave down', () => {
    expect(calculateCents(220, 440)).toBe(-1200);
  });
});

describe('findClosestString', () => {
  it('finds exact match for low E (E2)', () => {
    const result = findClosestString(82.41, standardTuning);
    expect(result).not.toBeNull();
    expect(result!.stringNumber).toBe(6);
    expect(result!.noteName).toBe('E2');
    expect(result!.centsOff).toBeCloseTo(0, 0);
  });

  it('finds exact match for A string (A2)', () => {
    const result = findClosestString(110, standardTuning);
    expect(result).not.toBeNull();
    expect(result!.stringNumber).toBe(5);
    expect(result!.noteName).toBe('A2');
  });

  it('finds exact match for high E (E4)', () => {
    const result = findClosestString(329.63, standardTuning);
    expect(result).not.toBeNull();
    expect(result!.stringNumber).toBe(1);
    expect(result!.noteName).toBe('E4');
  });

  it('detects sharp tuning', () => {
    // 5 cents sharp of A2 (110 Hz)
    const sharpA = 110 * Math.pow(2, 5 / 1200);
    const result = findClosestString(sharpA, standardTuning);
    expect(result).not.toBeNull();
    expect(result!.stringNumber).toBe(5);
    expect(result!.centsOff).toBeCloseTo(5, 0);
  });

  it('detects flat tuning', () => {
    // 10 cents flat of A2 (110 Hz)
    const flatA = 110 * Math.pow(2, -10 / 1200);
    const result = findClosestString(flatA, standardTuning);
    expect(result).not.toBeNull();
    expect(result!.stringNumber).toBe(5);
    expect(result!.centsOff).toBeCloseTo(-10, 0);
  });

  it('returns null for frequency outside guitar range', () => {
    expect(findClosestString(50, standardTuning)).toBeNull(); // Too low
    expect(findClosestString(2000, standardTuning)).toBeNull(); // Too high
  });

  it('returns null for frequency not close to any string', () => {
    // 135 Hz is between A2 (110) and D3 (146.83), and 270 Hz (doubled) is also not close to any string
    // This frequency can't be matched even with octave correction
    expect(findClosestString(135, standardTuning)).toBeNull();
  });

  // Octave correction tests
  describe('octave correction', () => {
    it('corrects octave-below detection for high E', () => {
      // When algorithm detects ~165 Hz instead of ~330 Hz for high E
      const halfE4 = 329.63 / 2; // ~164.8 Hz
      const result = findClosestString(halfE4, standardTuning);
      expect(result).not.toBeNull();
      expect(result!.stringNumber).toBe(1);
      expect(result!.noteName).toBe('E4');
      // The corrected frequency should be doubled
      expect(result!.correctedFrequency).toBeCloseTo(329.63, 0);
    });

    it('corrects octave-below detection for B string', () => {
      // When algorithm detects ~123 Hz instead of ~247 Hz for B3
      const halfB3 = 246.94 / 2; // ~123.5 Hz
      const result = findClosestString(halfB3, standardTuning);
      expect(result).not.toBeNull();
      expect(result!.stringNumber).toBe(2);
      expect(result!.noteName).toBe('B3');
    });

    it('corrects octave-below detection for G string', () => {
      // When algorithm detects ~98 Hz instead of ~196 Hz for G3
      const halfG3 = 196.0 / 2; // 98 Hz
      const result = findClosestString(halfG3, standardTuning);
      expect(result).not.toBeNull();
      expect(result!.stringNumber).toBe(3);
      expect(result!.noteName).toBe('G3');
    });

    it('prefers direct match over octave-corrected match', () => {
      // A2 at 110 Hz should match A2 directly, not try to match something at 220 Hz
      const result = findClosestString(110, standardTuning);
      expect(result).not.toBeNull();
      expect(result!.stringNumber).toBe(5);
      expect(result!.correctedFrequency).toBe(110);
    });
  });
});

describe('createPitchResult', () => {
  it('returns no-pitch result for null frequency', () => {
    const result = createPitchResult(null, standardTuning);
    expect(result.frequency).toBeNull();
    expect(result.noteName).toBeNull();
    expect(result.closestString).toBeNull();
    expect(result.inTune).toBe(false);
  });

  it('returns in-tune result for exact frequency', () => {
    const result = createPitchResult(110, standardTuning);
    expect(result.frequency).toBe(110);
    expect(result.noteName).toBe('A2');
    expect(result.closestString).toBe(5);
    expect(result.inTune).toBe(true);
    expect(result.tuningStatus).toBe('in-tune');
  });

  it('returns sharp result for high frequency', () => {
    const sharpA = 110 * Math.pow(2, 20 / 1200); // 20 cents sharp
    const result = createPitchResult(sharpA, standardTuning);
    expect(result.tuningStatus).toBe('sharp');
    expect(result.inTune).toBe(false);
    expect(result.advice).toContain('sharp');
    expect(result.advice).toContain('DOWN');
  });

  it('returns flat result for low frequency', () => {
    const flatA = 110 * Math.pow(2, -20 / 1200); // 20 cents flat
    const result = createPitchResult(flatA, standardTuning);
    expect(result.tuningStatus).toBe('flat');
    expect(result.inTune).toBe(false);
    expect(result.advice).toContain('flat');
    expect(result.advice).toContain('UP');
  });

  it('returns unknown result for unmatched frequency', () => {
    // 135 Hz can't be matched even with octave correction (270 Hz is not close to any string)
    const result = createPitchResult(135, standardTuning);
    expect(result.noteName).toBeNull();
    expect(result.closestString).toBeNull();
    expect(result.advice).toContain('not close to any target');
  });
});
