/**
 * Metadata for tools used in system prompt generation.
 *
 * This interface allows tools to provide additional context
 * for the system prompt beyond the basic tool description.
 */
export interface ToolMetadata {
	/**
	 * The tool's description (typically from tool.description).
	 * Used as the primary description in the system prompt.
	 */
	description: string;

	/**
	 * Optional additional hint for the system prompt.
	 * Use this to provide extra guidance on when/how to use the tool.
	 */
	systemPromptHint?: string;
}

/**
 * Registry of tool metadata keyed by tool name.
 */
export type ToolMetadataRegistry = Record<string, ToolMetadata>;
