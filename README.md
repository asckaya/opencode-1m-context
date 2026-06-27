# opencode-1m-context

OpenCode plugin that enables the **1M token context window** for supported Anthropic Claude models on **any provider**.

Unlike similar plugins, this one works with **all providers** — Anthropic direct, Aperture, OpenRouter, anyrouter, tunnels, etc. — not just `providerID === "anthropic"`.

## Supported models

Any model whose ID contains both `claude` and one of `[1m]` or `-1m` (e.g. `claude-opus-4-8[1m]`, `claude-sonnet-4-6-1m`).

## How it works

- **HTTP providers** (Anthropic, Aperture, OpenRouter, etc.): Injects `anthropic-beta: context-1m-2025-08-07` HTTP header via `chat.headers` hook
- **Amazon Bedrock**: Injects `anthropicBeta: ["context-1m-2025-08-07"]` option via `chat.params` hook
## Context limits

Context limits must be set in your `opencode.json` — the plugin only injects the beta header:

```json
{
  "plugin": ["opencode-1m-context"],
  "provider": {
    "anthropic": {
      "models": {
        "claude-opus-4-8[1m]": { "limit": { "context": 1000000, "output": 128000 } },
        "claude-sonnet-4-6[1m]": { "limit": { "context": 1000000, "output": 64000 } }
      }
    }
  }
}
```

Adjust the model IDs and provider name to match your setup.

## Install

```json
{
  "plugin": ["opencode-1m-context"]
}
```

## Requirements

- Anthropic API key with **Usage Tier 4** ($400+ cumulative deposit) or equivalent rate limits

## License

MIT
