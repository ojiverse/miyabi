import type {
	APIApplicationCommandInteractionDataStringOption,
	APIChatInputApplicationCommandInteraction,
} from "discord-api-types/v10";
import { DiscordHono } from "discord-hono";
import { Hono } from "hono";
import { MiyabiWorkflow } from "./workflow";

// Discord interaction handler
const discord = new DiscordHono<{ Bindings: Env }>();

discord.command("ask", async (c) => {
	const interaction =
		c.interaction as APIChatInputApplicationCommandInteraction;
	const options = interaction.data.options as
		| APIApplicationCommandInteractionDataStringOption[]
		| undefined;
	const question =
		options?.find((opt) => opt.name === "question")?.value ?? "";
	const interactionToken = interaction.token;
	const applicationId = c.env.DISCORD_APPLICATION_ID;

	// Generate a unique job ID
	const jobId = crypto.randomUUID();

	// Insert job into D1 database
	await c.env.miyabi_db
		.prepare("INSERT INTO jobs (id, token, status) VALUES (?, ?, ?)")
		.bind(jobId, interactionToken, "PENDING")
		.run();

	// Trigger workflow
	await c.env.miyabi_workflow.create({
		id: jobId,
		params: {
			jobId,
			question,
			interactionToken,
			applicationId,
		},
	});

	// Return deferred response (Type 5)
	return c.resDefer();
});

// Main Hono application
const app = new Hono<{ Bindings: Env }>();

// Debug endpoint for local testing without Discord
app.get("/debug", async (c) => {
	const prompt = c.req.query("prompt") ?? "Hello";
	const jobId = crypto.randomUUID();

	// Insert job into D1 database
	await c.env.miyabi_db
		.prepare("INSERT INTO jobs (id, token, status) VALUES (?, ?, ?)")
		.bind(jobId, "DEBUG_TOKEN", "PENDING")
		.run();

	// Trigger workflow with debug token
	await c.env.miyabi_workflow.create({
		id: jobId,
		params: {
			jobId,
			question: prompt,
			interactionToken: "DEBUG_TOKEN",
			applicationId: "DEBUG",
		},
	});

	return c.json({ status: "Debug triggered", jobId });
});

// Delegate all other requests to Discord handler
app.all("*", (c) => discord.fetch(c.req.raw, c.env, c.executionCtx));

// Export the app and workflow
export default app;
export { MiyabiWorkflow };
