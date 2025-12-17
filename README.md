# Miyabi

A Discord chatbot powered by Cloudflare Workers AI (Llama 3.3 70B) with a unique "Heisei-era Internet Otaku" personality.

## What is Miyabi?

Miyabi is a Discord bot that answers user questions with AI while maintaining a distinct personality - a Japanese internet culture enthusiast. It responds in the user's language and can use tools for real-time information (e.g., current date/time).

Key capabilities:
- AI-powered chat via Discord slash command `/ask`
- Automatic language detection and matching
- Tool calling for dynamic information
- Natural conversation flow via webhook impersonation

## Local Development

Prerequisites:
- Node.js 18+
- pnpm
- Cloudflare account with Workers AI, D1, and Workflows enabled
- Discord bot application

Setup:

1. Install dependencies:
```
pnpm install
```

2. Create D1 database:
```
wrangler d1 create miyabi-db
wrangler d1 execute miyabi-db --file=schema.sql
```

3. Update `wrangler.jsonc` with your D1 database ID

4. Create `.dev.vars` file:
```
DISCORD_APPLICATION_ID=your_app_id
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_WEBHOOK_URL=your_webhook_url
DISCORD_TOKEN=your_bot_token
```

5. Register Discord commands:
```
pnpm register:command
```

6. Start development server:
```
pnpm dev
```

## Deployment

Required environment:
- Cloudflare account with Workers AI enabled
- D1 database
- Workflows enabled
- Discord bot configured with webhook

Manual deployment steps:

1. Create D1 database in production:
```
wrangler d1 create miyabi-db
wrangler d1 execute miyabi-db --file=schema.sql --remote
```

2. Update `wrangler.jsonc` with production database ID

3. Set production secrets:
```
wrangler secret put DISCORD_APPLICATION_ID
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_WEBHOOK_URL
wrangler secret put DISCORD_TOKEN
```

4. Deploy to Cloudflare Workers:
```
pnpm deploy
```

5. Register Discord commands in production:
```
pnpm register:command
```

## License

MIT
