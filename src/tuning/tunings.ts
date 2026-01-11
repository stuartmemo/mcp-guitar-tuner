import { TuningPreset, Note, A4_FREQUENCY, A4_MIDI } from '../types/index.js';

// Calculate frequency from MIDI note number
// Formula: f = 440 * 2^((midiNumber - 69) / 12)
export function midiToFrequency(midiNumber: number): number {
  return A4_FREQUENCY * Math.pow(2, (midiNumber - A4_MIDI) / 12);
}

// Helper to create a note
function note(name: string, octave: number, midiNumber: number): Note {
  return {
    name,
    octave,
    midiNumber,
    frequency: Math.round(midiToFrequency(midiNumber) * 100) / 100,
  };
}

// Standard tuning reference:
// String 6 (low E): E2  = MIDI 40 = 82.41 Hz
// String 5:         A2  = MIDI 45 = 110.00 Hz
// String 4:         D3  = MIDI 50 = 146.83 Hz
// String 3:         G3  = MIDI 55 = 196.00 Hz
// String 2:         B3  = MIDI 59 = 246.94 Hz
// String 1 (high E): E4 = MIDI 64 = 329.63 Hz

export const TUNING_PRESETS: TuningPreset[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Standard tuning (E A D G B E)',
    strings: [
      { stringNumber: 6, note: note('E', 2, 40) },
      { stringNumber: 5, note: note('A', 2, 45) },
      { stringNumber: 4, note: note('D', 3, 50) },
      { stringNumber: 3, note: note('G', 3, 55) },
      { stringNumber: 2, note: note('B', 3, 59) },
      { stringNumber: 1, note: note('E', 4, 64) },
    ],
  },
  {
    id: 'drop-d',
    name: 'Drop D',
    description: 'Drop D tuning (D A D G B E) - 6th string lowered to D',
    strings: [
      { stringNumber: 6, note: note('D', 2, 38) },  // D2 instead of E2
      { stringNumber: 5, note: note('A', 2, 45) },
      { stringNumber: 4, note: note('D', 3, 50) },
      { stringNumber: 3, note: note('G', 3, 55) },
      { stringNumber: 2, note: note('B', 3, 59) },
      { stringNumber: 1, note: note('E', 4, 64) },
    ],
  },
  {
    id: 'half-step-down',
    name: 'Half Step Down',
    description: 'Eb tuning (Eb Ab Db Gb Bb Eb) - all strings down 1 semitone',
    strings: [
      { stringNumber: 6, note: note('Eb', 2, 39) },
      { stringNumber: 5, note: note('Ab', 2, 44) },
      { stringNumber: 4, note: note('Db', 3, 49) },
      { stringNumber: 3, note: note('Gb', 3, 54) },
      { stringNumber: 2, note: note('Bb', 3, 58) },
      { stringNumber: 1, note: note('Eb', 4, 63) },
    ],
  },
  {
    id: 'open-g',
    name: 'Open G',
    description: 'Open G tuning (D G D G B D) - strums a G major chord',
    strings: [
      { stringNumber: 6, note: note('D', 2, 38) },
      { stringNumber: 5, note: note('G', 2, 43) },
      { stringNumber: 4, note: note('D', 3, 50) },
      { stringNumber: 3, note: note('G', 3, 55) },
      { stringNumber: 2, note: note('B', 3, 59) },
      { stringNumber: 1, note: note('D', 4, 62) },
    ],
  },
  {
    id: 'open-d',
    name: 'Open D',
    description: 'Open D tuning (D A D F# A D) - strums a D major chord',
    strings: [
      { stringNumber: 6, note: note('D', 2, 38) },
      { stringNumber: 5, note: note('A', 2, 45) },
      { stringNumber: 4, note: note('D', 3, 50) },
      { stringNumber: 3, note: note('F#', 3, 54) },
      { stringNumber: 2, note: note('A', 3, 57) },
      { stringNumber: 1, note: note('D', 4, 62) },
    ],
  },
  {
    id: 'dadgad',
    name: 'DADGAD',
    description: 'DADGAD tuning (D A D G A D) - popular for Celtic music',
    strings: [
      { stringNumber: 6, note: note('D', 2, 38) },
      { stringNumber: 5, note: note('A', 2, 45) },
      { stringNumber: 4, note: note('D', 3, 50) },
      { stringNumber: 3, note: note('G', 3, 55) },
      { stringNumber: 2, note: note('A', 3, 57) },
      { stringNumber: 1, note: note('D', 4, 62) },
    ],
  },
];

// Get a tuning by ID
export function getTuningById(id: string): TuningPreset | undefined {
  return TUNING_PRESETS.find((t) => t.id === id);
}

// Get all tuning IDs
export function getTuningIds(): string[] {
  return TUNING_PRESETS.map((t) => t.id);
}
