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
	const question = options?.find((opt) => opt.name === "question")?.value ?? "";
	const interactionToken = interaction.token;
	const applicationId = c.env.DISCORD_APPLICATION_ID;

	// Extract user info for webhook impersonation
	const member = interaction.member;
	const user = member?.user;
	const guildId = interaction.guild_id;

	// Get display name (nickname > global_name > username)
	const displayName =
		member?.nick ?? user?.global_name ?? user?.username ?? "Unknown User";

	// Build user avatar URL (PNG format with size parameter)
	// Priority: guild avatar > user avatar > default avatar
	let userAvatarUrl: string | undefined;
	if (member?.avatar && guildId && user?.id) {
		// Guild-specific avatar
		userAvatarUrl = `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${member.avatar}.png?size=256`;
	} else if (user?.avatar && user?.id) {
		// User's global avatar
		userAvatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
	} else if (user?.id) {
		// Default avatar based on user ID
		const defaultAvatarIndex = Number(BigInt(user.id) >> 22n) % 6;
		userAvatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
	}

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
			webhookUrl: c.env.DISCORD_WEBHOOK_URL,
			userDisplayName: displayName,
			userAvatarUrl,
		},
	});

	// Return deferred response (ephemeral so it's hidden from other users)
	return c.flags("EPHEMERAL").resDefer();
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
			webhookUrl: "DEBUG_WEBHOOK",
			userDisplayName: "Debug User",
			userAvatarUrl: undefined,
		},
	});

	return c.json({ status: "Debug triggered", jobId });
});

// Delegate all other requests to Discord handler
app.all("*", (c) => discord.fetch(c.req.raw, c.env, c.executionCtx));

// Export the app and workflow
export default app;
export { MiyabiWorkflow };
