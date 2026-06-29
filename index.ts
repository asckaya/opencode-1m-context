import type { Plugin } from "@opencode-ai/plugin"

const BETA = "context-1m-2025-08-07"

const COPILOT_MODEL_VARIANTS = [
  {
    baseID: "claude-opus-4.6",
    variantID: "claude-opus-4.6-1m",
    preserveExisting: false,
    limit: { context: 1000000, input: 900000 },
  },
  {
    baseID: "claude-opus-4.7",
    variantID: "claude-opus-4.7-1m",
    preserveExisting: false,
    limit: { context: 1000000, input: 900000 },
  },
  {
    baseID: "claude-opus-4.8",
    variantID: "claude-opus-4.8-1m",
    preserveExisting: false,
    limit: { context: 1000000, input: 900000 },
  },
  {
    baseID: "claude-sonnet-4.6",
    variantID: "claude-sonnet-4.6-1m",
    preserveExisting: false,
    limit: { context: 1000000, input: 900000 },
  },
  {
    baseID: "gpt-5.4",
    variantID: "gpt-5.4-1m",
    preserveExisting: true,
    limit: { context: 1050000, input: 922000 },
  },
  {
    baseID: "gpt-5.5",
    variantID: "gpt-5.5-1m",
    preserveExisting: true,
    limit: { context: 1050000, input: 922000 },
  },
] as const

function is1mModel(id: string): boolean {
  return (
    id.includes("claude") &&
    (id.includes("[1m]") || id.includes("-1m"))
  )
}

export const plugin: Plugin = async () => ({
  provider: {
    id: "github-copilot",
    async models(provider) {
      for (const variant of COPILOT_MODEL_VARIANTS) {
        const base = provider.models[variant.baseID]
        if (!base) continue
        if (variant.preserveExisting && provider.models[variant.variantID]) continue

        const name = base.name || variant.baseID
        provider.models[variant.variantID] = {
          ...base,
          id: variant.variantID,
          name: `${name} (1M)`,
          api: base.api ? { ...base.api } : base.api,
          limit: {
            ...(base.limit ?? {}),
            ...variant.limit,
          },
        }
      }
      return provider.models
    },
  },

  // HTTP providers (Anthropic direct, third-party gateways, tunnels, …)
  //
  // @ai-sdk/anthropic merges headers via combineHeaders(), which uses object
  // spread — later keys override earlier ones. The SDK-level anthropic-beta
  // (claude-code, interleaved-thinking, fine-grained-tool-streaming, …) lives
  // in config.headers and would be overwritten if we naively set
  // output.headers["anthropic-beta"]. We read the existing SDK value from
  // provider.options.headers so we can APPEND the 1M flag instead of replacing
  // it, preserving the other beta features.
  "chat.headers": async (input, output) => {
    const providerID = input.model.providerID || ""
    const modelId = input.model.api.id || input.model.name || ""

    if (providerID.includes("github-copilot")) {
      output.headers["Copilot-Integration-Id"] = "copilot-developer-cli"
      return
    }

    if (!is1mModel(modelId)) return

    const sdk =
      (input.provider?.options as Record<string, any>)?.headers?.[
        "anthropic-beta"
      ] ?? ""
    const existing = output.headers["anthropic-beta"] ?? sdk
    if (existing.includes(BETA)) return
    output.headers["anthropic-beta"] = existing
      ? `${existing},${BETA}`
      : BETA
  },

  // Amazon Bedrock — the @ai-sdk/amazon-bedrock SDK translates
  // options.anthropicBeta into additionalModelRequestFields.anthropic_beta
  // in the Converse API request body. We append (not replace) to preserve
  // any existing beta flags.
  "chat.params": async (input, output) => {
    const modelId = input.model.api.id || input.model.name || ""
    if (!is1mModel(modelId)) return

    if (input.model.providerID === "amazon-bedrock") {
      const existing: string[] =
        (output.options.anthropicBeta as string[]) ?? []
      if (existing.includes(BETA)) return
      output.options.anthropicBeta = [...existing, BETA]
    }
  },
})

export default plugin
