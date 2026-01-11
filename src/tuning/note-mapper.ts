import {
  TuningPreset,
  PitchResult,
  TuningStatus,
  IN_TUNE_THRESHOLD,
  GUITAR_FREQ_MIN,
  GUITAR_FREQ_MAX,
} from '../types/index.js';

// Calculate cents deviation between detected and target frequency
// Formula: cents = 1200 * log2(detectedFreq / targetFreq)
export function calculateCents(detectedFreq: number, targetFreq: number): number {
  return 1200 * Math.log2(detectedFreq / targetFreq);
}

// Find the closest string in the tuning to the detected frequency
export function findClosestString(
  frequency: number,
  tuning: TuningPreset
): { stringNumber: number; centsOff: number; noteName: string } | null {
  // Filter out frequencies outside guitar range
  if (frequency < GUITAR_FREQ_MIN || frequency > GUITAR_FREQ_MAX) {
    return null;
  }

  let closestString: number | null = null;
  let smallestCentsDiff = Infinity;
  let closestNoteName = '';

  for (const guitarString of tuning.strings) {
    const cents = calculateCents(frequency, guitarString.note.frequency);
    const absCents = Math.abs(cents);

    // Only consider if within 100 cents (1 semitone) of target
    // This prevents matching wrong octaves
    if (absCents < smallestCentsDiff && absCents <= 100) {
      smallestCentsDiff = absCents;
      closestString = guitarString.stringNumber;
      closestNoteName = `${guitarString.note.name}${guitarString.note.octave}`;
    }
  }

  if (closestString === null) {
    return null;
  }

  // Get actual cents (with sign) for the closest string
  const targetString = tuning.strings.find((s) => s.stringNumber === closestString)!;
  const actualCents = calculateCents(frequency, targetString.note.frequency);

  return {
    stringNumber: closestString,
    centsOff: Math.round(actualCents * 10) / 10, // Round to 1 decimal
    noteName: closestNoteName,
  };
}

// Determine tuning status from cents deviation
function getTuningStatus(cents: number): TuningStatus {
  if (Math.abs(cents) <= IN_TUNE_THRESHOLD) {
    return 'in-tune';
  }
  return cents < 0 ? 'flat' : 'sharp';
}

// Generate human-readable advice
function generateAdvice(
  status: TuningStatus,
  cents: number,
  stringNumber: number | null,
  noteName: string | null
): string {
  if (stringNumber === null || noteName === null) {
    return 'No pitch detected. Play a string and hold the note.';
  }

  const stringLabel = `String ${stringNumber} (${noteName})`;
  const centsAbs = Math.abs(Math.round(cents));

  switch (status) {
    case 'in-tune':
      return `${stringLabel} is in tune!`;
    case 'flat':
      return `${stringLabel} is ${centsAbs} cents flat. Tune UP (tighten).`;
    case 'sharp':
      return `${stringLabel} is ${centsAbs} cents sharp. Tune DOWN (loosen).`;
  }
}

// Create a complete PitchResult from detected frequency
export function createPitchResult(
  frequency: number | null,
  tuning: TuningPreset
): PitchResult {
  // No pitch detected
  if (frequency === null) {
    return {
      frequency: null,
      noteName: null,
      centsDeviation: 0,
      closestString: null,
      inTune: false,
      tuningStatus: 'flat',
      advice: 'No pitch detected. Play a string and hold the note.',
    };
  }

  // Find closest string
  const closest = findClosestString(frequency, tuning);

  if (closest === null) {
    return {
      frequency: Math.round(frequency * 10) / 10,
      noteName: null,
      centsDeviation: 0,
      closestString: null,
      inTune: false,
      tuningStatus: 'flat',
      advice: `Detected ${Math.round(frequency)} Hz - not close to any target string.`,
    };
  }

  const status = getTuningStatus(closest.centsOff);
  const inTune = status === 'in-tune';

  return {
    frequency: Math.round(frequency * 10) / 10,
    noteName: closest.noteName,
    centsDeviation: closest.centsOff,
    closestString: closest.stringNumber,
    inTune,
    tuningStatus: status,
    advice: generateAdvice(status, closest.centsOff, closest.stringNumber, closest.noteName),
  };
}
