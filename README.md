# Fine Tuning - Guitar Tuner MCP Server

An MCP plugin for guitar tuning with real-time microphone pitch detection on macOS.

## Prerequisites

**Install sox** (required for microphone access):
```bash
brew install sox
```

## Installation

```bash
# Install dependencies
npm install

# Build
npm run build

# Register with Claude Code
claude mcp add guitar-tuner -- node /path/to/mcp-guitar-tuner/dist/index.js
```

Then restart Claude Code to load the new MCP server.

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_tunings` | List all available tuning presets |
| `start_tuning` | Start mic capture for a tuning (default: standard) |
| `get_pitch` | Get current pitch, closest string, cents deviation |
| `stop_tuning` | Stop session and release microphone |

## Supported Tunings

- **Standard** (E A D G B E)
- **Drop D** (D A D G B E)
- **Half Step Down** (Eb Ab Db Gb Bb Eb)
- **Open G** (D G D G B D)
- **Open D** (D A D F# A D)
- **DADGAD** (D A D G A D)

## Usage Examples

Once registered, use natural language with Claude Code:

- "What guitar tunings are available?"
- "Help me tune my guitar to Drop D"
- "What note am I playing?" (while holding a string)
- "Stop tuning"

## How It Works

1. Uses `mic` npm package with `sox` for audio capture
2. Detects pitch using the YIN algorithm via `pitchfinder`
3. Maps frequency to closest target string
4. Calculates cents deviation and provides tuning advice

## Tuning Guidance

- **In tune**: ±5 cents
- **Flat**: tune UP (tighten the string)
- **Sharp**: tune DOWN (loosen the string)
