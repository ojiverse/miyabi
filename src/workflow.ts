import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";
import { generateText } from "ai";
import { getModel } from "./lib/ai/factory";
import { SYSTEM_PROMPT } from "./lib/ai/system";

type WorkflowParams = {
	jobId: string;
	question: string;
	interactionToken: string;
	applicationId: string;
};

export class MiyabiWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
	async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
		const { jobId, question, interactionToken, applicationId } =
			event.payload;
		const isDebug = interactionToken === "DEBUG_TOKEN";

		// Step 1: Update job status to PROCESSING
		await step.do("update-status-processing", async () => {
			await this.env.miyabi_db
				.prepare("UPDATE jobs SET status = ? WHERE id = ?")
				.bind("PROCESSING", jobId)
				.run();
		});

		// Step 2: Generate AI response
		const aiResponse = await step.do("generate-ai-response", async () => {
			const model = getModel(this.env);
			const result = await generateText({
				model,
				system: SYSTEM_PROMPT,
				prompt: question,
			});
			return result.text;
		});

		// Step 3: Send response to Discord via webhook (skip in debug mode)
		await step.do("send-discord-response", async () => {
			if (isDebug) {
				// Debug mode: log result to console instead of sending to Discord
				console.log("DEBUG RESULT:", aiResponse);
				return;
			}

			// Production: send to Discord webhook
			const webhookUrl = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`;

			const response = await fetch(webhookUrl, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					content: aiResponse.slice(0, 2000), // Discord message limit
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Discord API error: ${response.status} - ${errorText}`,
				);
			}
		});

		// Step 4: Update job status to COMPLETED
		await step.do("update-status-completed", async () => {
			await this.env.miyabi_db
				.prepare("UPDATE jobs SET status = ?, result = ? WHERE id = ?")
				.bind("COMPLETED", aiResponse, jobId)
				.run();
		});

		return { success: true, jobId };
	}
}
