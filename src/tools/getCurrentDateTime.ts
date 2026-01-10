import { tool } from "ai";
import { z } from "zod";

/**
 * Tool: getCurrentDateTime
 *
 * Returns the current date and time in Japan Standard Time (JST).
 * Use this when the user asks about the current time, today's date,
 * or any time-related queries.
 */
export const getCurrentDateTime = tool({
	description:
		"Returns the current date and time. Use this when asked about the current time, today's date, what day it is, or any time-related questions.",
	inputSchema: z.object({
		_unused: z
			.string()
			.optional()
			.describe("Unused parameter for schema compatibility"),
	}),
	execute: async () => {
		const now = new Date();

		// Format in Japan Standard Time (JST = UTC+9)
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
		const isoString = now.toISOString();

		return {
			jst: jstTime,
			iso: isoString,
			timezone: "Asia/Tokyo (JST)",
		};
	},
});
