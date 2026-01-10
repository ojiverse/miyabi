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
 * Model adapter interface for abstracting model-specific behavior
 */
export interface ModelAdapter {
	/** The model identifier for Workers AI */
	readonly modelId: string;

	/** Extract response text from model output */
	extractResponse(output: AiTextGenerationOutput): string;
}
