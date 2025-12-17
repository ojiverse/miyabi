import { DiscordHono } from 'discord-hono';
import type { APIChatInputApplicationCommandInteraction, APIApplicationCommandInteractionDataStringOption } from 'discord-api-types/v10';
import { MiyabiWorkflow } from './workflow';

const app = new DiscordHono<{ Bindings: Env }>();

app.command('ask', async (c) => {
  const interaction = c.interaction as APIChatInputApplicationCommandInteraction;
  const options = interaction.data.options as APIApplicationCommandInteractionDataStringOption[] | undefined;
  const question = options?.find((opt) => opt.name === 'question')?.value ?? '';
  const interactionToken = interaction.token;
  const applicationId = c.env.DISCORD_APPLICATION_ID;

  // Generate a unique job ID
  const jobId = crypto.randomUUID();

  // Insert job into D1 database
  await c.env.miyabi_db
    .prepare('INSERT INTO jobs (id, token, status) VALUES (?, ?, ?)')
    .bind(jobId, interactionToken, 'PENDING')
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

// Export the app and workflow
export default app;
export { MiyabiWorkflow };
