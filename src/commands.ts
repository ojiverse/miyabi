import { Command, Option } from 'discord-hono';

export const commands = [
  new Command('ask', 'Ask the AI a question').options(
    new Option('question', 'Your question for the AI').required()
  ),
];
