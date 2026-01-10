import type { AiTextGenerationOutput, ModelAdapter } from "./types";

/**
 * Type guard for OpenAI-compatible response format
 */
function isOpenAICompatible(
	output: AiTextGenerationOutput,
): output is { choices: Array<{ message: { content: string } }> } {
	return (
		typeof output === "object" &&
		output !== null &&
		"choices" in output &&
		Array.isArray(output.choices) &&
		output.choices.length > 0 &&
		typeof output.choices[0]?.message?.content === "string"
	);
}

/**
 * Adapter for Qwen3 30B model
 *
 * Uses OpenAI-compatible response format: { choices: [{ message: { content: string } }] }
 */
export class Qwen3Adapter implements ModelAdapter {
	readonly modelId = "@cf/qwen/qwen3-30b-a3b-fp8" as const;

	extractResponse(output: AiTextGenerationOutput): string {
		if (typeof output === "string") {
			return output;
		}
		if (isOpenAICompatible(output)) {
			return output.choices[0].message.content;
		}
		// Fallback to native format
		if ("response" in output && typeof output.response === "string") {
			return output.response;
		}
		console.warn("Unexpected Qwen3 response format:", JSON.stringify(output));
		return JSON.stringify(output);
	}
}
