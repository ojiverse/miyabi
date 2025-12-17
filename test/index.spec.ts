import {
	createExecutionContext,
	env,
	SELF,
	waitOnExecutionContext,
} from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Miyabi bot", () => {
	beforeAll(async () => {
		// Set up D1 database schema
		await env.miyabi_db.exec(
			"CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, token TEXT NOT NULL, status TEXT NOT NULL, result TEXT, created_at INTEGER DEFAULT (unixepoch()))",
		);
	});
	it("returns debug response on /debug endpoint (unit style)", async () => {
		const request = new IncomingRequest("http://example.com/debug?prompt=test");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toHaveProperty("status", "Debug triggered");
		expect(json).toHaveProperty("jobId");
	});

	it("returns debug response on /debug endpoint (integration style)", async () => {
		const response = await SELF.fetch("https://example.com/debug?prompt=hello");

		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toHaveProperty("status", "Debug triggered");
		expect(json).toHaveProperty("jobId");
	});

	it("returns Discord operational status on root (integration style)", async () => {
		const response = await SELF.fetch("https://example.com/");
		// DiscordHono returns "Operational🔥" for non-interaction requests
		expect(await response.text()).toMatchInlineSnapshot(`"Operational🔥"`);
	});
});
