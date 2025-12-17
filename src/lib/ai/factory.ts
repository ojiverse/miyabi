import { createWorkersAI } from "workers-ai-provider";

export const getModel = (env: Env) => {
	const workersai = createWorkersAI({ binding: env.AI });
	// Use a lightweight model for the demo
	return workersai("@cf/meta/llama-3.2-3b-instruct");
};
