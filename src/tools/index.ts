/**
 * Miyabi Tools Registry
 *
 * This module aggregates all available tools for the Miyabi chatbot.
 * Each tool is defined in its own file within this directory,
 * following the Vercel AI SDK tool pattern.
 *
 * To add a new tool:
 * 1. Create a new file in src/tools/ (e.g., myNewTool.ts)
 * 2. Define the tool using the `tool()` function from 'ai'
 * 3. Export it from that file
 * 4. Import and add it to the `tools` object below
 *
 * Example:
 * ```typescript
 * // src/tools/myNewTool.ts
 * import { tool } from "ai";
 * import { z } from "zod";
 *
 * export const myNewTool = tool({
 *   description: "Description of what the tool does",
 *   parameters: z.object({ param1: z.string() }),
 *   execute: async ({ param1 }) => { ... }
 * });
 * ```
 */

import { getCurrentDateTime } from "./getCurrentDateTime";

/**
 * All available tools for the Miyabi chatbot.
 * This object is passed directly to generateText/streamText.
 */
export const tools = {
	getCurrentDateTime,
};

/**
 * Type representing all available tool names.
 */
export type ToolName = keyof typeof tools;
