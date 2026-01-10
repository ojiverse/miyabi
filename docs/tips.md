# Development Tips and Lessons Learned

## Function Calling with Cloudflare Workers AI

### Problem: Llama 3.3 70B Function Calling Doesn't Work with AI SDK

When using `@cf/meta/llama-3.3-70b-instruct-fp8-fast` with Vercel AI SDK (`ai` package) and `workers-ai-provider`, function calling fails with error messages like:

- `"Your input is not sufficient. Please provide more details or specify the task you need help with."`
- `"Your function definitions do not fully cover the aspects of this task. Please enhance them."`

Even simple greetings like "おはよう" (Good morning) would trigger these errors or return raw tool results instead of natural responses.

### Root Cause

Llama models return tool invocation requests as **serialized JSON text within the message content**, rather than using a structured `tool_calls` property. This is a known issue across multiple platforms:

- [meta-llama/llama-models#229](https://github.com/meta-llama/llama-models/issues/229) - Inconsistent tool calling with Llama 3.1 70B
- [pydantic/pydantic-ai#1649](https://github.com/pydantic/pydantic-ai/issues/1649) - Llama 3.3 returns JSON text instead of structured tool calls

The `workers-ai-provider` package does not properly handle this format, causing the multi-step tool calling flow to break.

### What We Tried (And Failed)

1. **Adding `toolChoice: "auto"` explicitly** - No effect
2. **Adding placeholder parameters to empty `inputSchema`** - Changed error message but didn't fix the issue
3. **Enhancing system prompt with detailed tool usage instructions** - Ignored by the model
4. **Upgrading to `ai@6.0.26` and `workers-ai-provider@3.0.2`** - Still broken

### Solution: Use @cloudflare/ai-utils

Cloudflare provides `@cloudflare/ai-utils` package with `runWithTools` function specifically designed for Workers AI function calling.

```typescript
import { runWithTools } from "@cloudflare/ai-utils";

const result = await runWithTools(
  env.AI,
  "@hf/nousresearch/hermes-2-pro-mistral-7b",  // Function calling specialized model
  {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: question },
    ],
    tools: [
      {
        name: "getCurrentDateTime",
        description: "Returns the current date and time.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
        function: async () => {
          // Tool implementation
          return JSON.stringify({ time: new Date().toISOString() });
        },
      },
    ],
  },
  {
    maxRecursiveToolRuns: 5,
    verbose: true,
  },
);
```

### Key Differences

| Aspect | AI SDK + workers-ai-provider | @cloudflare/ai-utils |
|--------|------------------------------|----------------------|
| Function calling | Broken with Llama 3.3 70B | Works correctly |
| Recommended model | Any | `hermes-2-pro-mistral-7b` (fine-tuned for function calling) |
| Tool definition | Zod schema (`inputSchema`) | JSON Schema (`parameters`) |
| Multi-step handling | Manual with `stopWhen` | Automatic with `maxRecursiveToolRuns` |

### Model Recommendations for Function Calling

| Model | Function Calling | Notes |
|-------|------------------|-------|
| `@hf/nousresearch/hermes-2-pro-mistral-7b` | ✅ Works | Recommended for function calling, 7B size |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | ❌ Broken | Does not work with AI SDK, returns JSON as text |

### Cost Considerations

- `hermes-2-pro-mistral-7b` (7B) is significantly cheaper than Llama 3.3 70B
- Llama 3.3 70B: Input $0.293/M tokens, Output $2.253/M tokens
- 7B models are typically ~1/10 the cost of 70B models

### Conclusion

If you need function calling with Cloudflare Workers AI, use `@cloudflare/ai-utils` with `hermes-2-pro-mistral-7b`. Do not use the AI SDK with `workers-ai-provider` for Llama models - the function calling implementation is incompatible.
