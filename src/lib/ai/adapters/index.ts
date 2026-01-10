export { HermesAdapter } from "./hermes";
export { Qwen3Adapter } from "./qwen3";
export type { CloudflareTool, ModelAdapter } from "./types";

import { Qwen3Adapter } from "./qwen3";

/**
 * Default model adapter
 *
 * Change this to switch the model used by the bot.
 */
export const defaultAdapter = new Qwen3Adapter();
