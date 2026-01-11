import { describe, it, expect } from 'vitest';
import { TUNING_PRESETS, getTuningById, getTuningIds, note } from './tunings.js';

describe('note helper', () => {
  it('calculates correct frequency for A4', () => {
    const a4 = note('A', 4, 69);
    expect(a4.frequency).toBeCloseTo(440, 2);
  });

  it('calculates correct frequency for E2 (low E)', () => {
    const e2 = note('E', 2, 40);
    expect(e2.frequency).toBeCloseTo(82.41, 1);
  });

  it('calculates correct frequency for E4 (high E)', () => {
    const e4 = note('E', 4, 64);
    expect(e4.frequency).toBeCloseTo(329.63, 1);
  });

  it('calculates correct frequency for B3', () => {
    const b3 = note('B', 3, 59);
    expect(b3.frequency).toBeCloseTo(246.94, 1);
  });

  it('calculates correct frequency for G3', () => {
    const g3 = note('G', 3, 55);
    expect(g3.frequency).toBeCloseTo(196.0, 1);
  });
});

describe('TUNING_PRESETS', () => {
  it('contains standard tuning', () => {
    const standard = TUNING_PRESETS.find((t) => t.id === 'standard');
    expect(standard).toBeDefined();
    expect(standard!.name).toBe('Standard');
  });

  it('contains drop-d tuning', () => {
    const dropD = TUNING_PRESETS.find((t) => t.id === 'drop-d');
    expect(dropD).toBeDefined();
    expect(dropD!.name).toBe('Drop D');
  });

  it('all presets have 6 strings', () => {
    for (const tuning of TUNING_PRESETS) {
      expect(tuning.strings).toHaveLength(6);
    }
  });

  it('strings are numbered 1-6', () => {
    for (const tuning of TUNING_PRESETS) {
      const stringNumbers = tuning.strings.map((s) => s.stringNumber).sort((a, b) => a - b);
      expect(stringNumbers).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });
});

describe('standard tuning frequencies', () => {
  const standard = getTuningById('standard')!;

  it('string 6 (low E) is E2 at ~82 Hz', () => {
    const string6 = standard.strings.find((s) => s.stringNumber === 6)!;
    expect(string6.note.name).toBe('E');
    expect(string6.note.octave).toBe(2);
    expect(string6.note.frequency).toBeCloseTo(82.41, 1);
  });

  it('string 5 (A) is A2 at 110 Hz', () => {
    const string5 = standard.strings.find((s) => s.stringNumber === 5)!;
    expect(string5.note.name).toBe('A');
    expect(string5.note.octave).toBe(2);
    expect(string5.note.frequency).toBeCloseTo(110, 1);
  });

  it('string 4 (D) is D3 at ~147 Hz', () => {
    const string4 = standard.strings.find((s) => s.stringNumber === 4)!;
    expect(string4.note.name).toBe('D');
    expect(string4.note.octave).toBe(3);
    expect(string4.note.frequency).toBeCloseTo(146.83, 1);
  });

  it('string 3 (G) is G3 at 196 Hz', () => {
    const string3 = standard.strings.find((s) => s.stringNumber === 3)!;
    expect(string3.note.name).toBe('G');
    expect(string3.note.octave).toBe(3);
    expect(string3.note.frequency).toBeCloseTo(196, 1);
  });

  it('string 2 (B) is B3 at ~247 Hz', () => {
    const string2 = standard.strings.find((s) => s.stringNumber === 2)!;
    expect(string2.note.name).toBe('B');
    expect(string2.note.octave).toBe(3);
    expect(string2.note.frequency).toBeCloseTo(246.94, 1);
  });

  it('string 1 (high E) is E4 at ~330 Hz', () => {
    const string1 = standard.strings.find((s) => s.stringNumber === 1)!;
    expect(string1.note.name).toBe('E');
    expect(string1.note.octave).toBe(4);
    expect(string1.note.frequency).toBeCloseTo(329.63, 1);
  });
});

describe('drop-d tuning', () => {
  const dropD = getTuningById('drop-d')!;

  it('string 6 is D2 (dropped from E2)', () => {
    const string6 = dropD.strings.find((s) => s.stringNumber === 6)!;
    expect(string6.note.name).toBe('D');
    expect(string6.note.octave).toBe(2);
    expect(string6.note.frequency).toBeCloseTo(73.42, 1);
  });

  it('other strings remain the same as standard', () => {
    const standard = getTuningById('standard')!;
    for (let i = 1; i <= 5; i++) {
      const dropDString = dropD.strings.find((s) => s.stringNumber === i)!;
      const standardString = standard.strings.find((s) => s.stringNumber === i)!;
      expect(dropDString.note.frequency).toBeCloseTo(standardString.note.frequency, 1);
    }
  });
});

describe('getTuningById', () => {
  it('returns standard tuning for "standard"', () => {
    const tuning = getTuningById('standard');
    expect(tuning).toBeDefined();
    expect(tuning!.id).toBe('standard');
  });

  it('returns undefined for unknown tuning', () => {
    const tuning = getTuningById('unknown-tuning');
    expect(tuning).toBeUndefined();
  });
});

describe('getTuningIds', () => {
  it('returns array of tuning IDs', () => {
    const ids = getTuningIds();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids).toContain('standard');
    expect(ids).toContain('drop-d');
  });

  it('matches TUNING_PRESETS length', () => {
    expect(getTuningIds().length).toBe(TUNING_PRESETS.length);
  });
});
