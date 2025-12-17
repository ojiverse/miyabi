# Miyabi

A Discord chatbot powered by AI with a unique "Heisei-era Internet Otaku" personality. Built on Cloudflare Workers for fast, global edge computing.

## Overview

Miyabi is a Discord bot that responds to user questions with the personality of a Japanese internet culture enthusiast. It uses Llama 3.3 70B Instruct running on Cloudflare Workers AI, with support for tool calling to provide real-time information.

### Key Features

- **AI-Powered Responses**: Uses Llama 3.3 70B Instruct (FP8 Fast) for high-quality responses
- **Unique Personality**: Embodies a "Heisei-era Internet Otaku" and "Fujoshi" character with Japanese internet slang
- **Tool Calling**: Extensible tool system for real-time information (current date/time, etc.)
- **Webhook Impersonation**: Posts user messages with their display name and avatar for natural conversation flow
- **Language Matching**: Automatically detects and responds in the user's language
- **Durable Workflows**: Uses Cloudflare Workflows for reliable async processing
- **Edge Computing**: Runs globally on Cloudflare's network for low latency

## Architecture

### Technology Stack

- **Runtime**: Cloudflare Workers (serverless edge computing)
- **Language**: TypeScript (ES2024, strict mode)
- **Framework**: [Hono](https://hono.dev/) with [discord-hono](https://github.com/discordjs/discord-hono)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai/) with [workers-ai-provider](https://github.com/jeasonstudio/workers-ai-provider)
- **Database**: Cloudflare D1 (SQLite)
- **Orchestration**: Cloudflare Workflows
- **Package Manager**: pnpm

### System Flow

```
User types /ask command in Discord
        ↓
Discord sends interaction to Worker
        ↓
Worker creates job in D1 database
        ↓
Worker triggers Cloudflare Workflow
        ↓
Worker returns deferred response
        ↓
Workflow processes request:
  1. Updates job status to PROCESSING
  2. Generates AI response (with tool calls)
  3. Posts user message via webhook (impersonation)
  4. Posts AI response via webhook (as Miyabi)
  5. Deletes original deferred response
  6. Updates job status to COMPLETED
```

### Components

#### Discord Command Handler (`src/index.ts`)

Handles the `/ask` slash command:
- Extracts user information (display name, avatar)
- Creates a job record in D1 database
- Triggers the Miyabi Workflow
- Returns an ephemeral deferred response

#### Miyabi Workflow (`src/workflow.ts`)

A durable workflow that processes requests asynchronously:
- Updates job status throughout processing
- Generates AI responses with support for up to 5 tool call round-trips
- Posts messages via Discord webhooks
- Handles special Discord markdown escaping for kaomoji

#### AI System

**Model Factory** (`src/lib/ai/factory.ts`):
- Initializes Llama 3.3 70B Instruct via Cloudflare Workers AI
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

**System Prompt** (`src/lib/ai/system.ts`):
- Defines Miyabi's personality and behavior
- Includes language detection and matching rules
- Dynamically generates tool descriptions
- Enforces respectful interaction guidelines

#### Tools System (`src/tools/`)

Extensible tool registry following Vercel AI SDK patterns:
- **getCurrentDateTime**: Returns current date/time in JST (Japan Standard Time)
- Tool metadata for system prompt generation
- Easy to add new tools by extending the registry

#### Database Schema (`schema.sql`)

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'PENDING', 'PROCESSING', 'COMPLETED', 'ERROR'
  result TEXT,
  created_at INTEGER DEFAULT (unixepoch())
)
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [pnpm](https://pnpm.io/) package manager
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- A Cloudflare account with:
  - Workers AI enabled
  - D1 database access
  - Workflows enabled
- A Discord bot application

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd miyabi
```

2. Install dependencies:

```bash
pnpm install
```

3. Create the D1 database:

```bash
wrangler d1 create miyabi-db
```

4. Apply the database schema:

```bash
wrangler d1 execute miyabi-db --file=schema.sql
```

5. Update `wrangler.jsonc` with your D1 database ID.

## Configuration

### Environment Variables

Create a `.dev.vars` file in the project root for local development:

```bash
DISCORD_APPLICATION_ID=your_application_id
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_WEBHOOK_URL=your_webhook_url
DISCORD_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_guild_id  # Optional, for guild-specific commands
```

### Required Secrets

For production, set these secrets using Wrangler:

```bash
wrangler secret put DISCORD_APPLICATION_ID
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_WEBHOOK_URL
wrangler secret put DISCORD_TOKEN
```

### Discord Bot Setup

1. Create a Discord application at https://discord.com/developers/applications
2. Create a bot user and copy the bot token
3. Copy the application ID and public key
4. Create a webhook in your Discord server
5. Enable the following bot permissions:
   - Send Messages
   - Use Slash Commands
   - Manage Webhooks
6. Add the bot to your server

## Development

### Local Development

Start the local development server:

```bash
pnpm dev
```

This uses Wrangler's local development mode with:
- D1 local database
- Workers AI emulation
- Hot reload on file changes

### Register Discord Commands

Before using the bot, register the slash commands:

```bash
pnpm register:command
```

This will register the `/ask` command with Discord.

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start local development server |
| `pnpm deploy` | Deploy to Cloudflare Workers |
| `pnpm test` | Run tests with Vitest |
| `pnpm register:command` | Register Discord slash commands |
| `pnpm lint` | Lint code with Biome |
| `pnpm lint:fix` | Lint and auto-fix issues |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm cf-typegen` | Generate Cloudflare types |

## Testing

Run the test suite:

```bash
pnpm test
```

Tests use Vitest with `@cloudflare/vitest-pool-workers` for Workers environment simulation.

## Deployment

### Deploy to Production

```bash
pnpm deploy
```

This will:
1. Build the Worker
2. Deploy to Cloudflare
3. Apply configuration from `wrangler.jsonc`

### Register Commands in Production

After deploying, register the commands:

```bash
pnpm register:command
```

### CI/CD

The project includes GitHub Actions workflows:

#### PR Checks (`.github/workflows/pr-checks.yml`)

Runs on pull requests:
- Biome linting
- TypeScript type checking
- Tests
- PR title validation (Conventional Commits)

#### Deployment (`.github/workflows/deploy.yml`)

Runs on push to main:
- Deploy to Cloudflare Workers
- Register Discord slash commands

## Project Structure

```
miyabi/
├── src/
│   ├── index.ts              # Main entry point, Discord command handler
│   ├── commands.ts           # Discord command definitions
│   ├── workflow.ts           # Cloudflare Workflow implementation
│   ├── lib/
│   │   └── ai/
│   │       ├── factory.ts    # AI model initialization
│   │       └── system.ts     # System prompt definition
│   └── tools/
│       ├── index.ts          # Tool registry
│       ├── types.ts          # Tool metadata types
│       └── getCurrentDateTime.ts  # Date/time tool implementation
├── scripts/
│   └── register.ts           # Discord command registration script
├── test/
│   ├── index.spec.ts         # Integration tests
│   └── env.d.ts              # Test type definitions
├── .github/workflows/
│   ├── pr-checks.yml         # PR validation workflow
│   └── deploy.yml            # Deployment workflow
├── schema.sql                # D1 database schema
├── wrangler.jsonc            # Cloudflare Workers configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── biome.json                # Biome linter/formatter config
├── vitest.config.mts         # Test configuration
├── CLAUDE.md                 # Project guidelines
└── README.md                 # This file
```

## Code Quality

### Conventional Commits

All commit messages and PR titles must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>: <description>

[optional body]
[optional footer(s)]
```

**Available types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Example**:
```
feat: add user authentication
fix: resolve null pointer exception in chat handler
docs: update README with setup instructions
```

### Linting and Formatting

Code is formatted and linted using [Biome](https://biomejs.dev/):

```bash
pnpm lint        # Check for issues
pnpm lint:fix    # Auto-fix issues
```

### Type Checking

TypeScript strict mode is enabled. Run type checking:

```bash
pnpm typecheck
```

## Adding New Tools

To add a new tool for the AI to use:

1. Create a new file in `src/tools/` (e.g., `myTool.ts`)
2. Define the tool using Vercel AI SDK's `tool()` function
3. Add tool metadata to the `toolMetadata` map in `src/tools/index.ts`
4. Export the tool from `src/tools/index.ts`

Example:

```typescript
// src/tools/myTool.ts
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "Description of what the tool does",
  parameters: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    // Implementation
    return { result: "value" };
  },
});

// src/tools/index.ts
import { myTool } from "./myTool";

export const tools = {
  getCurrentDateTime,
  myTool,  // Add your tool here
};

export const toolMetadata: ToolMetadata[] = [
  // ... existing metadata
  {
    name: "myTool",
    description: "Description for the system prompt",
    usageGuidelines: "When to use this tool",
  },
];
```

## Bot Personality

Miyabi has a unique personality defined in the system prompt:

- **Character**: Heisei-era Internet Otaku, Fujoshi, Niconico Douga enthusiast
- **Language**: Naturally incorporates Japanese internet slang and kaomoji
- **Tone**: High energy, enthusiastic, but fundamentally kind and respectful
- **Behavior**: Matches user's language, gently admonishes abusive language
- **Knowledge**: Deep knowledge of 2channel, Inm memes, BL culture

## License

MIT License - Copyright (c) 2025 OJIverse

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`pnpm test`)
2. Code is linted (`pnpm lint`)
3. Type checking passes (`pnpm typecheck`)
4. Commit messages follow Conventional Commits
5. PR titles follow Conventional Commits

## Troubleshooting

### Common Issues

**Issue**: Commands not showing in Discord
**Solution**: Run `pnpm register:command` to register slash commands

**Issue**: "Unknown interaction" error
**Solution**: Check that `DISCORD_PUBLIC_KEY` is correctly set

**Issue**: Webhook errors
**Solution**: Verify `DISCORD_WEBHOOK_URL` is correct and the webhook exists

**Issue**: D1 database errors
**Solution**: Ensure the database schema is applied with `wrangler d1 execute miyabi-db --file=schema.sql`

**Issue**: AI responses not working
**Solution**: Verify Workers AI is enabled in your Cloudflare account

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Hono Framework](https://hono.dev/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Conventional Commits](https://www.conventionalcommits.org/)
