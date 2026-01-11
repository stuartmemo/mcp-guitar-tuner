#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createGuitarTunerServer } from './server.js';
import { tuningManager } from './tuning/session-manager.js';

async function main() {
  const server = createGuitarTunerServer();
  const transport = new StdioServerTransport();

  // Handle graceful shutdown
  const cleanup = () => {
    if (tuningManager.isActive()) {
      tuningManager.stopSession();
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Connect server to stdio transport
  await server.connect(transport);

  // Log to stderr (safe for MCP - stdout is for JSON-RPC only)
  console.error('Guitar tuner MCP server running on stdio');
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
