import { REST, Routes } from "@discordjs/rest";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import * as dotenv from "dotenv";

// Load environment variables from .dev.vars if not already set (for local dev)
if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_APPLICATION_ID) {
	dotenv.config({ path: ".dev.vars" });
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

if (!DISCORD_TOKEN) {
	throw new Error("DISCORD_TOKEN is required");
}

if (!DISCORD_APPLICATION_ID) {
	throw new Error("DISCORD_APPLICATION_ID is required");
}

// Define slash commands
const commands = [
	{
		name: "ask",
		description: "Ask miyabi (AI Agent) a question",
		options: [
			{
				name: "prompt",
				description: "Your question for the AI",
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
];

async function main() {
	const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

	try {
		console.log("Started refreshing application (/) commands...");

		await rest.put(Routes.applicationCommands(DISCORD_APPLICATION_ID), {
			body: commands,
		});

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error("Failed to register commands:", error);
		process.exit(1);
	}
}

main();
