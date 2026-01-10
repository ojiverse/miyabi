import type { AiTextGenerationOutput, ModelAdapter } from "./types";

/**
 * Adapter for Hermes 2 Pro Mistral 7B model
 *
 * Uses Workers AI native response format: { response: string }
 */
export class HermesAdapter implements ModelAdapter {
	readonly modelId = "@hf/nousresearch/hermes-2-pro-mistral-7b" as const;

	extractResponse(output: AiTextGenerationOutput): string {
		if (typeof output === "string") {
			return output;
		}
		if ("response" in output && typeof output.response === "string") {
			return output.response;
		}
		console.warn("Unexpected Hermes response format:", JSON.stringify(output));
		return JSON.stringify(output);
	}
}
