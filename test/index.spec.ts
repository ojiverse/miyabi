import { env, SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";

describe("Miyabi bot", () => {
	beforeAll(async () => {
		// Set up D1 database schema
		await env.miyabi_db.exec(
			"CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, token TEXT NOT NULL, status TEXT NOT NULL, result TEXT, created_at INTEGER DEFAULT (unixepoch()))",
		);
	});

	it("returns Discord operational status on root (integration style)", async () => {
		const response = await SELF.fetch("https://example.com/");
		// DiscordHono returns "Operational🔥" for non-interaction requests
		expect(await response.text()).toMatchInlineSnapshot(`"Operational🔥"`);
	});
});
