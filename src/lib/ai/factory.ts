import { createWorkersAI } from "workers-ai-provider";

export const getModel = (env: Env) => {
	const workersai = createWorkersAI({ binding: env.AI });
	// Use Llama 3.3 70B model
	// @ts-expect-error - Model not yet in type definitions
	return workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
};
