import { TuningSession, TuningPreset, PitchResult } from '../types/index.js';
import { MicrophoneCapture } from '../audio/mic-capture.js';
import { PitchDetectorProcessor } from '../audio/pitch-detector.js';
import { getTuningById, getTuningIds } from './tunings.js';
import { createPitchResult } from './note-mapper.js';

export interface StartResult {
  success: boolean;
  message: string;
  tuning?: {
    id: string;
    name: string;
    description: string;
    strings: Array<{
      stringNumber: number;
      note: string;
      frequency: number;
    }>;
  };
  error?: string;
}

export interface StopResult {
  success: boolean;
  message: string;
  error?: string;
}

export class TuningSessionManager {
  private session: TuningSession | null = null;
  private mic: MicrophoneCapture | null = null;
  private pitchDetector: PitchDetectorProcessor | null = null;
  private currentTuning: TuningPreset | null = null;
  private lastPitchResult: PitchResult | null = null;

  // For stable pitch detection
  private stableString: number | null = null;
  private stableStartTime: number = 0;
  private readonly STABLE_DURATION_MS = 400; // Note must be stable for 400ms

  // Track tuning progress
  private tunedStrings: Set<number> = new Set(); // Strings that have been in-tune

  async startSession(tuningId: string = 'standard'): Promise<StartResult> {
    // Check if session already active
    if (this.session?.active) {
      return {
        success: false,
        message: 'A tuning session is already active.',
        error: `Stop the current session first. Currently tuning to: ${this.session.tuningName}`,
      };
    }

    // Validate tuning
    const tuning = getTuningById(tuningId);
    if (!tuning) {
      const available = getTuningIds().join(', ');
      return {
        success: false,
        message: `Unknown tuning: ${tuningId}`,
        error: `Available tunings: ${available}`,
      };
    }

    try {
      // Initialize microphone
      this.mic = new MicrophoneCapture();
      await this.mic.checkSoxInstalled();

      // Initialize pitch detector
      this.pitchDetector = new PitchDetectorProcessor();
      await this.pitchDetector.initialize();

      // Wire up audio processing
      this.mic.on('audio', (samples: Float32Array) => {
        if (this.pitchDetector && this.currentTuning) {
          const frequency = this.pitchDetector.process(samples);
          this.lastPitchResult = createPitchResult(frequency, this.currentTuning);

          // Track pitch stability for the same string
          const currentString = this.lastPitchResult.closestString;
          if (currentString !== null && currentString === this.stableString) {
            // Same string, keep tracking
          } else if (currentString !== null) {
            // New string detected, reset stability tracking
            this.stableString = currentString;
            this.stableStartTime = Date.now();
          } else {
            // No pitch, reset
            this.stableString = null;
            this.stableStartTime = 0;
          }
        }
      });

      this.mic.on('error', (err: Error) => {
        // Log to stderr (safe for MCP)
        console.error('Microphone error:', err.message);
      });

      // Start capturing
      await this.mic.start();

      // Create session
      this.currentTuning = tuning;
      this.session = {
        active: true,
        tuningId: tuning.id,
        tuningName: tuning.name,
        startedAt: new Date(),
      };

      return {
        success: true,
        message: `Started tuning session for ${tuning.name}`,
        tuning: {
          id: tuning.id,
          name: tuning.name,
          description: tuning.description,
          strings: tuning.strings.map((s) => ({
            stringNumber: s.stringNumber,
            note: `${s.note.name}${s.note.octave}`,
            frequency: s.note.frequency,
          })),
        },
      };
    } catch (err) {
      // Clean up on error
      this.cleanup();

      const message = err instanceof Error ? err.message : String(err);

      // Check for common errors
      if (message.includes('sox')) {
        return {
          success: false,
          message: 'sox is not installed',
          error: 'Install sox with: brew install sox',
        };
      }

      if (message.includes('permission') || message.includes('access')) {
        return {
          success: false,
          message: 'Microphone access denied',
          error:
            'Grant microphone permission in System Settings > Privacy & Security > Microphone',
        };
      }

      return {
        success: false,
        message: 'Failed to start tuning session',
        error: message,
      };
    }
  }

  stopSession(): StopResult {
    if (!this.session?.active) {
      return {
        success: false,
        message: 'No active tuning session',
        error: 'Call start_tuning first to begin a session.',
      };
    }

    const tuningName = this.session.tuningName;
    this.cleanup();

    return {
      success: true,
      message: `Stopped tuning session for ${tuningName}. Microphone released.`,
    };
  }

  // Wait for a stable pitch detection (blocks until note is held steady)
  async waitForPitch(timeoutMs: number = 30000): Promise<PitchResult | { error: string }> {
    if (!this.session?.active) {
      return {
        error: 'No active tuning session. Call start_tuning first.',
      };
    }

    const startTime = Date.now();

    // Reset stability tracking
    this.stableString = null;
    this.stableStartTime = 0;

    return new Promise((resolve) => {
      const checkStability = () => {
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          resolve({
            frequency: null,
            noteName: null,
            centsDeviation: 0,
            closestString: null,
            inTune: false,
            tuningStatus: 'flat' as const,
            advice: 'Timed out waiting for a note. Play a string and hold it steady.',
          });
          return;
        }

        // Check if session is still active
        if (!this.session?.active) {
          resolve({ error: 'Tuning session was stopped.' });
          return;
        }

        // Check if we have a stable pitch
        if (
          this.stableString !== null &&
          this.stableStartTime > 0 &&
          Date.now() - this.stableStartTime >= this.STABLE_DURATION_MS &&
          this.lastPitchResult &&
          this.lastPitchResult.closestString === this.stableString
        ) {
          // We have a stable reading!
          const result = { ...this.lastPitchResult };

          // Track if this string is now in-tune
          if (result.inTune && result.closestString !== null) {
            this.tunedStrings.add(result.closestString);
          }

          // Add progress info
          const progress = {
            ...result,
            tunedStrings: Array.from(this.tunedStrings).sort((a, b) => b - a),
            tunedCount: this.tunedStrings.size,
            totalStrings: 6,
            allInTune: this.tunedStrings.size === 6,
          };

          resolve(progress);
          return;
        }

        // Keep checking
        setTimeout(checkStability, 50);
      };

      checkStability();
    });
  }

  isActive(): boolean {
    return this.session?.active ?? false;
  }

  getCurrentTuning(): TuningPreset | null {
    return this.currentTuning;
  }

  private cleanup(): void {
    if (this.mic) {
      this.mic.stop();
      this.mic.removeAllListeners();
      this.mic = null;
    }
    if (this.pitchDetector) {
      this.pitchDetector.reset();
      this.pitchDetector = null;
    }
    this.currentTuning = null;
    this.session = null;
    this.lastPitchResult = null;
    this.tunedStrings.clear();
  }
}

// Singleton instance for use across MCP tools
export const tuningManager = new TuningSessionManager();
