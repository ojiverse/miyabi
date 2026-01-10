import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";
import { runWithTools } from "@cloudflare/ai-utils";
import { SYSTEM_PROMPT } from "./lib/ai/system";

type WorkflowParams = {
	jobId: string;
	question: string;
	interactionToken: string;
	applicationId: string;
	webhookUrl: string;
	userDisplayName: string;
	userAvatarUrl?: string;
};

// Bot configuration for webhook messages
const BOT_NAME = "Miyabi";
const BOT_AVATAR_URL =
	"https://cdn.discordapp.com/avatars/1450755873587724323/109a92e86cdc903f15cd3904615c3527.png";

/**
 * Escape special characters that interfere with Discord markdown.
 * - Backslash (\) is Discord's escape character
 * - Backtick (`) triggers code formatting
 * These characters often appear in kaomoji and can break formatting.
 */
function escapeDiscordMarkdown(text: string): string {
	return text
		.replace(/\\/g, "\\\\") // Escape backslashes first
		.replace(/`/g, "\\`"); // Then escape backticks
}

export class MiyabiWorkflow extends WorkflowEntrypoint<Env, WorkflowParams> {
	async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
		const {
			jobId,
			question,
			interactionToken,
			applicationId,
			webhookUrl,
			userDisplayName,
			userAvatarUrl,
		} = event.payload;
		const isDebug = interactionToken === "DEBUG_TOKEN";

		// Step 1: Update job status to PROCESSING
		await step.do("update-status-processing", async () => {
			await this.env.miyabi_db
				.prepare("UPDATE jobs SET status = ? WHERE id = ?")
				.bind("PROCESSING", jobId)
				.run();
		});

		// Step 2: Generate AI response (with tool calling support via @cloudflare/ai-utils)
		const aiResponse = await step.do("generate-ai-response", async () => {
			// Define tools in @cloudflare/ai-utils format
			const cfTools = [
				{
					name: "getCurrentDateTime",
					description:
						"Returns the current date and time. Use this when asked about the current time, today's date, what day it is, or any time-related questions.",
					parameters: {
						type: "object" as const,
						properties: {},
						required: [] as string[],
					},
					function: async () => {
						const now = new Date();
						const jstFormatter = new Intl.DateTimeFormat("ja-JP", {
							timeZone: "Asia/Tokyo",
							year: "numeric",
							month: "2-digit",
							day: "2-digit",
							weekday: "long",
							hour: "2-digit",
							minute: "2-digit",
							second: "2-digit",
							hour12: false,
						});
						const jstTime = jstFormatter.format(now);
						return JSON.stringify({
							jst: jstTime,
							iso: now.toISOString(),
							timezone: "Asia/Tokyo (JST)",
						});
					},
				},
			];

			const result = await runWithTools(
				this.env.AI,
				"@cf/qwen/qwen3-30b-a3b-fp8",
				{
					messages: [
						{ role: "system", content: SYSTEM_PROMPT },
						{ role: "user", content: question },
					],
					tools: cfTools,
				},
				{
					maxRecursiveToolRuns: 5,
					verbose: true,
				},
			);

			// Extract response text
			if (typeof result === "string") {
				return result;
			}
			if ("response" in result && typeof result.response === "string") {
				return result.response;
			}
			return JSON.stringify(result);
		});

		// Step 3: Post user's message via webhook (impersonation)
		await step.do("post-user-message", async () => {
			if (isDebug) {
				console.log("DEBUG - User message:", question);
				return;
			}

			const payload: Record<string, string> = {
				content: question,
				username: userDisplayName,
			};
			if (userAvatarUrl) {
				payload.avatar_url = userAvatarUrl;
			}

			const response = await fetch(webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Discord webhook error (user message): ${response.status} - ${errorText}`,
				);
			}
		});

		// Step 4: Post AI's message via webhook
		await step.do("post-ai-message", async () => {
			if (isDebug) {
				console.log("DEBUG - AI response:", aiResponse);
				return;
			}

			const escapedResponse = escapeDiscordMarkdown(aiResponse);
			const response = await fetch(webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					content: escapedResponse.slice(0, 2000), // Discord message limit
					username: BOT_NAME,
					avatar_url: BOT_AVATAR_URL,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Discord webhook error (AI message): ${response.status} - ${errorText}`,
				);
			}
		});

		// Step 5: Delete the original deferred interaction response
		await step.do("cleanup-interaction", async () => {
			if (isDebug) {
				console.log("DEBUG - Skipping interaction cleanup");
				return;
			}

			const deleteUrl = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`;

			const response = await fetch(deleteUrl, {
				method: "DELETE",
			});

			// 204 No Content is the expected response for successful deletion
			// 404 is also acceptable (message might already be gone)
			if (!response.ok && response.status !== 204 && response.status !== 404) {
				const errorText = await response.text();
				console.error(
					`Failed to delete interaction response: ${response.status} - ${errorText}`,
				);
				// Don't throw - this is cleanup, we don't want to fail the whole workflow
			}
		});

		// Step 6: Update job status to COMPLETED
		await step.do("update-status-completed", async () => {
			await this.env.miyabi_db
				.prepare("UPDATE jobs SET status = ?, result = ? WHERE id = ?")
				.bind("COMPLETED", aiResponse, jobId)
				.run();
		});

		return { success: true, jobId };
	}
}
