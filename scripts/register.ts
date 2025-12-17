import { REST, Routes } from "@discordjs/rest";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import * as dotenv from "dotenv";

// Load environment variables from .dev.vars if not already set (for local dev)
if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_APPLICATION_ID) {
	dotenv.config({ path: ".dev.vars" });
}

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID; // Optional: for guild-specific commands

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

	const route = DISCORD_GUILD_ID
		? Routes.applicationGuildCommands(DISCORD_APPLICATION_ID, DISCORD_GUILD_ID)
		: Routes.applicationCommands(DISCORD_APPLICATION_ID);

	const scope = DISCORD_GUILD_ID ? `guild (${DISCORD_GUILD_ID})` : "global";

	try {
		console.log(`Started refreshing ${scope} application (/) commands...`);

		await rest.put(route, { body: commands });

		console.log(`Successfully reloaded ${scope} application (/) commands.`);
	} catch (error) {
		console.error("Failed to register commands:", error);
		process.exit(1);
	}
}

main();
