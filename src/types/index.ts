// Reference pitch constant (A4 = 440 Hz is the standard)
export const A4_FREQUENCY = 440;
export const A4_MIDI = 69;

// Musical note representation
export interface Note {
  name: string;        // e.g., "E", "A", "D", "Eb"
  octave: number;      // e.g., 2, 3, 4
  frequency: number;   // Exact frequency in Hz
  midiNumber: number;  // MIDI note number (E2=40, A4=69)
}

// Guitar string with target note
export interface GuitarString {
  stringNumber: number;  // 1-6 (1 = highest/thinnest E, 6 = lowest E)
  note: Note;
}

// Tuning preset definition
export interface TuningPreset {
  id: string;              // e.g., "standard", "drop-d"
  name: string;            // e.g., "Standard", "Drop D"
  description: string;     // User-friendly description
  strings: GuitarString[]; // 6 strings, ordered 6 to 1
}

// Tuning status
export type TuningStatus = 'flat' | 'sharp' | 'in-tune';

// Result from pitch detection
export interface PitchResult {
  frequency: number | null;      // Detected frequency in Hz (null if none)
  noteName: string | null;       // Closest note name (e.g., "E2")
  centsDeviation: number;        // Cents off from target (-50 to +50)
  closestString: number | null;  // Which string (1-6) this is closest to
  inTune: boolean;               // Within acceptable range (+-5 cents)
  tuningStatus: TuningStatus;    // 'flat', 'sharp', or 'in-tune'
  advice: string;                // Human-readable tuning advice
}

// Active tuning session state
export interface TuningSession {
  active: boolean;
  tuningId: string;
  tuningName: string;
  startedAt: Date;
}

// Audio capture configuration
export interface AudioConfig {
  sampleRate: number;   // Default: 44100
  channels: number;     // Default: 1 (mono)
  bitDepth: number;     // Default: 16
  threshold: number;    // RMS threshold for noise gate
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 44100,
  channels: 1,
  bitDepth: 16,
  threshold: 0.01,
};

// Threshold for considering a note "in tune" (in cents)
export const IN_TUNE_THRESHOLD = 5;

// Guitar frequency range (for filtering)
export const GUITAR_FREQ_MIN = 70;   // Below low E (82 Hz)
export const GUITAR_FREQ_MAX = 1500; // Well above high frets
