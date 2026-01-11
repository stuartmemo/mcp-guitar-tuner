import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TUNING_PRESETS, getTuningIds } from './tuning/tunings.js';
import { tuningManager } from './tuning/session-manager.js';

// Helper to create a JSON text response
function jsonResponse(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function createGuitarTunerServer(): McpServer {
  const server = new McpServer({
    name: 'guitar-tuner',
    version: '1.0.0',
  });

  // Tool 1: list_tunings - List all available tuning presets
  server.tool(
    'list_tunings',
    'List all available guitar tuning presets',
    {},
    async () => {
      const tunings = TUNING_PRESETS.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        strings: t.strings.map((s) => `${s.note.name}${s.note.octave}`).join(' '),
      }));

      return jsonResponse({ tunings });
    }
  );

  // Tool 2: start_tuning - Start listening to microphone for guitar tuning
  server.tool(
    'start_tuning',
    'Start listening to microphone for guitar tuning. Specify a tuning preset (default: standard).',
    {
      tuning: z
        .string()
        .optional()
        .default('standard')
        .describe(`Tuning preset ID. Available: ${getTuningIds().join(', ')}`),
    },
    async ({ tuning }) => {
      const result = await tuningManager.startSession(tuning);
      return jsonResponse(result);
    }
  );

  // Tool 3: get_pitch - Wait for and return detected pitch with tuning guidance
  server.tool(
    'get_pitch',
    'Wait for a guitar note to be played and return tuning guidance. Blocks until a stable pitch is detected (up to 30 seconds). Must call start_tuning first.',
    {},
    async () => {
      // Use waitForPitch to block until a stable note is detected
      const result = await tuningManager.waitForPitch(30000);

      // Auto-stop when all strings are in tune
      if ('allInTune' in result && result.allInTune) {
        tuningManager.stopSession();
        return jsonResponse({
          ...result,
          message: 'All 6 strings are in tune! Session ended.',
        });
      }

      return jsonResponse(result);
    }
  );

  // Tool 4: stop_tuning - Stop tuning session and release microphone
  server.tool(
    'stop_tuning',
    'Stop the tuning session and release the microphone.',
    {},
    async () => {
      const result = tuningManager.stopSession();
      return jsonResponse(result);
    }
  );

  return server;
}
