/**
 * Workers AI text generation output type
 * Can be either native format or OpenAI-compatible format
 */
export type AiTextGenerationOutput =
	| string
	| { response: string }
	| {
			choices: Array<{
				message: {
					content: string;
				};
			}>;
	  };

/**
 * Tool definition for @cloudflare/ai-utils
 */
export type CloudflareTool = {
	name: string;
	description: string;
	parameters: {
		type: "object";
		properties: Record<string, unknown>;
		required: string[];
	};
	function: (args: Record<string, unknown>) => Promise<string>;
};

/**
 * Example for tool usage in system prompt
 */
export type ToolExample = {
	userQuery: string;
	toolResponse?: string;
	goodResponse: string;
};

/**
 * Tool documentation for system prompt generation
 */
export type ToolPromptInfo = {
	description: string;
	whenToUse: string[];
	examples: ToolExample[];
};

/**
 * Tool with prompt information for system prompt generation
 */
export type ToolWithPrompt = CloudflareTool & {
	promptInfo: ToolPromptInfo;
};

/**
 * Model adapter interface for abstracting model-specific behavior
 */
export interface ModelAdapter {
	/** The model identifier for Workers AI */
	readonly modelId: string;

	/** Extract response text from model output */
	extractResponse(output: AiTextGenerationOutput): string;
}
