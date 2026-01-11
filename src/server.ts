import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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

  // Tool 1: start_tuning - Start listening to microphone for guitar tuning
  server.tool(
    'start_tuning',
    'Start listening to microphone for guitar tuning (standard tuning: E A D G B E).',
    {},
    async () => {
      const result = await tuningManager.startSession('standard');
      return jsonResponse(result);
    }
  );

  // Tool 2: get_pitch - Wait for and return detected pitch with tuning guidance
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

  // Tool 3: stop_tuning - Stop tuning session and release microphone
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
