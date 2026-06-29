# opencode-1m-context

OpenCode plugin that enables the **1M token context window** for supported Anthropic Claude models on **any provider**, including **GitHub Copilot**.

Unlike similar plugins, this one works with **all providers** — Anthropic direct, third-party gateways/proxies, Amazon Bedrock, GitHub Copilot, etc. — not just `providerID === "anthropic"`.

## Supported providers

| Provider | How it works |
| --- | --- |
| Anthropic direct | Injects `anthropic-beta: context-1m-2025-08-07` header |
| Third-party gateways / proxies / tunnels | Injects `anthropic-beta: context-1m-2025-08-07` header |
| Amazon Bedrock | Injects `anthropicBeta: ["context-1m-2025-08-07"]` option |
| GitHub Copilot | Clones models into `-1m` variants with higher limits + sets `Copilot-Integration-Id` header |

## Supported models

### Anthropic providers (header injection)

Any model whose ID contains both `claude` and one of `[1m]` or `-1m` (e.g. `claude-opus-4-8[1m]`, `claude-sonnet-4-6-1m`).

### GitHub Copilot (model cloning)

The plugin automatically creates `(1M)` variants for:

- Claude Opus 4.6 → `claude-opus-4.6-1m`
- Claude Opus 4.7 → `claude-opus-4.7-1m`
- Claude Opus 4.8 → `claude-opus-4.8-1m`
- Claude Sonnet 4.6 → `claude-sonnet-4.6-1m`
- GPT-5.4 → `gpt-5.4-1m`
- GPT-5.5 → `gpt-5.5-1m`

## Install

```json
{
  "plugin": ["opencode-1m-context"]
}
```

## Configuration

Two layers are required and work together:

1. **Plugin layer (API header)** — injects the `anthropic-beta` flag so the API accepts up to 1M input tokens
2. **Config layer (OpenCode limit override)** — sets `limit.context` so OpenCode's auto-compaction triggers near 1M instead of ~168K. Without this, OpenCode truncates conversation history at 200K before the request is even sent.

### Anthropic direct / third-party gateways / tunnels

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

Adjust the model IDs and provider name to match your setup. The `[1m]`/`-1m` marker in the model ID is what triggers the plugin's header injection.

### Amazon Bedrock

```json
{
  "plugin": ["opencode-1m-context"],
  "provider": {
    "amazon-bedrock": {
      "models": {
        "anthropic.claude-opus-4-6-v1:0": { "limit": { "context": 1000000, "output": 128000 } },
        "anthropic.claude-sonnet-4-6-v1:0": { "limit": { "context": 1000000, "output": 64000 } }
      }
    }
  }
}
```

You don't need to include the region prefix (`us.`, `eu.`, `global.`, etc.) — OpenCode adds it automatically based on your `AWS_REGION`. The model ID must contain `claude` and a `[1m]`/`-1m` marker to trigger the plugin.

### GitHub Copilot

No extra configuration needed — the plugin automatically creates the 1M variants. You'll see new model entries like "Claude Opus 4.8 (1M)" and "GPT-5.5 (1M)" alongside the originals after restarting OpenCode.

Optional: set reasoning effort for the 1M variants:

```json
{
  "plugin": ["opencode-1m-context"],
  "provider": {
    "github-copilot": {
      "models": {
        "claude-opus-4.6-1m": { "reasoningEffort": "high" },
        "claude-opus-4.7-1m": { "reasoningEffort": "medium" }
      }
    }
  }
}
```

## How it works

- **HTTP providers** (Anthropic direct, third-party gateways, etc.): Injects `anthropic-beta: context-1m-2025-08-07` HTTP header via `chat.headers` hook
- **Amazon Bedrock**: Injects `anthropicBeta: ["context-1m-2025-08-07"]` option via `chat.params` hook
- **GitHub Copilot**: Clones each supported model into a `-1m` variant with model-specific long-context limits via `provider.models` hook, and sets the `Copilot-Integration-Id: copilot-developer-cli` header on all Copilot requests

## Requirements

- Anthropic API key with **Usage Tier 4** ($400+ cumulative deposit) or equivalent rate limits (for Anthropic direct provider)
- GitHub Copilot subscription (for GitHub Copilot provider)

## Related

- [opencode-copilot-1m](https://github.com/rasmusjosefsson/opencode-copilot-1m) — same idea, GitHub Copilot only
- [opencode-anthropic-context-1m](https://github.com/DusKing1/opencode-anthropic-context-1m) — same idea, Anthropic direct and Bedrock only
- [opencode-anthropic-context-1m](https://github.com/razor54/opencode-anthropic-context-1m) — same idea, Anthropic direct only

## License

MIT
