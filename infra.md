# Miyabi Infrastructure

This document describes the system architecture and infrastructure components of Miyabi.

## Architecture Overview

Miyabi runs on Cloudflare's edge platform, utilizing Workers, D1 database, Workflows, and Workers AI.

```mermaid
graph TB
    User[Discord User] -->|/ask command| Discord[Discord API]
    Discord -->|Interaction| Worker[Cloudflare Worker]
    Worker -->|Create job| D1[(D1 Database)]
    Worker -->|Trigger| Workflow[Cloudflare Workflow]
    Worker -->|Deferred response| Discord
    Workflow -->|Generate response| AI[Workers AI - Llama 3.3 70B]
    Workflow -->|Post messages| Webhook[Discord Webhook]
    Workflow -->|Update status| D1
    Webhook -->|Messages appear| Channel[Discord Channel]
```

## Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant D as Discord
    participant W as Worker
    participant DB as D1 Database
    participant WF as Workflow
    participant AI as Workers AI
    participant WH as Discord Webhook

    U->>D: /ask question
    D->>W: POST interaction
    W->>DB: INSERT job (PENDING)
    W->>WF: Create workflow instance
    W->>D: Return deferred response

    WF->>DB: UPDATE status (PROCESSING)
    WF->>AI: Generate response with tools
    AI-->>WF: Return AI response
    WF->>WH: POST user message (impersonation)
    WH->>D: Message appears
    WF->>WH: POST AI response (as Miyabi)
    WH->>D: Message appears
    WF->>D: DELETE original response
    WF->>DB: UPDATE status (COMPLETED)
```

## Components

### Cloudflare Worker

Entry point for Discord interactions. Handles:
- Discord interaction verification
- User information extraction (name, avatar)
- Job creation in D1
- Workflow triggering
- Deferred response management

**File**: `src/index.ts`

### Cloudflare Workflow

Durable execution environment for async processing. Steps:
1. Update job status to PROCESSING
2. Generate AI response (max 5 tool call rounds)
3. Post user message via webhook
4. Post AI response via webhook
5. Delete deferred interaction
6. Update job status to COMPLETED

**File**: `src/workflow.ts`

### D1 Database

SQLite database for job tracking. Schema:

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  status TEXT NOT NULL,  -- PENDING, PROCESSING, COMPLETED, ERROR
  result TEXT,
  created_at INTEGER DEFAULT (unixepoch())
)
```

**File**: `schema.sql`

### Workers AI

AI inference using Llama 3.3 70B Instruct (FP8 Fast). Features:
- Tool calling support
- Multi-round conversations
- System prompt with personality definition

**Model**: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

### Discord Webhook

Used for posting messages to Discord channels. Supports:
- User impersonation (custom username and avatar)
- Bot messages (as Miyabi)
- Message formatting and escaping

## Infrastructure Requirements

### Cloudflare Account

Required services:
- Workers (edge compute)
- D1 (serverless SQLite)
- Workflows (durable execution)
- Workers AI (LLM inference)

### Discord Application

Required configuration:
- Bot application with slash command support
- Webhook URL for message posting
- Application ID and public key for verification
- Bot token for command registration

## Environment Variables

### Worker Bindings (wrangler.jsonc)

- `AI`: Workers AI binding
- `miyabi_db`: D1 database binding
- `miyabi_workflow`: Workflow binding

### Secrets

- `DISCORD_APPLICATION_ID`: Discord app ID
- `DISCORD_PUBLIC_KEY`: Public key for interaction verification
- `DISCORD_WEBHOOK_URL`: Webhook URL for posting
- `DISCORD_TOKEN`: Bot token for command registration

## Deployment Architecture

```mermaid
graph LR
    GH[GitHub Repository] -->|Push to main| Action[GitHub Actions]
    Action -->|Deploy| CF[Cloudflare Workers]
    Action -->|Register commands| Discord[Discord API]
    CF -->|Runtime bindings| D1[(D1 Database)]
    CF -->|Runtime bindings| WF[Workflows]
    CF -->|Runtime bindings| AI[Workers AI]
```

## Scalability

- **Workers**: Auto-scales globally across Cloudflare's network
- **D1**: Serverless SQLite with automatic replication
- **Workflows**: Durable execution with automatic state management
- **Workers AI**: Managed inference with automatic scaling

## Cost Optimization

- Workers: Pay-per-request model
- D1: Free tier includes 5GB storage, 5M reads/day
- Workflows: Free tier includes 10M step transitions/month
- Workers AI: Usage-based pricing per token

## Monitoring

Observability enabled in `wrangler.jsonc`:
- Real-time logs via Wrangler tail
- Cloudflare dashboard analytics
- Error tracking and debugging
