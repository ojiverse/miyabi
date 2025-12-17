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
 * 5. Add metadata entry in `toolMetadata` below
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
import type { ToolMetadataRegistry } from "./types";

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

/**
 * Metadata for each tool, used to generate the system prompt.
 *
 * - `description`: Primary description (defaults to tool.description)
 * - `systemPromptHint`: Optional additional guidance for the AI
 *
 * When adding a new tool, add its metadata here.
 */
export const toolMetadata: ToolMetadataRegistry = {
	getCurrentDateTime: {
		description:
			getCurrentDateTime.description ??
			"Returns the current date and time in JST.",
		systemPromptHint:
			"Use this when the user asks about the current time, today's date, what day of the week it is, or any time-related questions.",
	},
};

/**
 * Generates the available tools section for the system prompt.
 * Combines tool description with optional hints.
 */
export function generateToolsDescription(): string {
	return Object.entries(toolMetadata)
		.map(([name, meta]) => {
			const hint = meta.systemPromptHint ? ` ${meta.systemPromptHint}` : "";
			return `- **${name}**: ${meta.description}${hint}`;
		})
		.join("\n            ");
}
