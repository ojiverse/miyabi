# Miyabi Tools

This directory contains tools that the AI can use to provide real-time information.

## Available Tools

- `getCurrentDateTime`: Returns current date/time in JST (Japan Standard Time)

## How Tools Work

Tools are defined using the Vercel AI SDK pattern and registered in `index.ts`. The system prompt automatically includes tool descriptions via `generateToolsDescription()`.

## Adding a New Tool

1. Create a new file (e.g., `myTool.ts`)
2. Define the tool using `tool()` from the AI SDK
3. Add it to the `tools` object in `index.ts`
4. Add metadata entry in `toolMetadata` in `index.ts`

Example:

```typescript
// myTool.ts
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "What the tool does",
  inputSchema: z.object({
    param: z.string().describe("Parameter description"),
  }),
  execute: async ({ param }) => {
    return { result: "value" };
  },
});
```
