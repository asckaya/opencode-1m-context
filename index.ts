import type { Plugin } from "@opencode-ai/plugin"

const BETA = "context-1m-2025-08-07"

function is1mModel(id: string): boolean {
  return (
    id.includes("claude") &&
    (id.includes("[1m]") || id.includes("-1m"))
  )
}

export const plugin: Plugin = async () => ({
  "chat.headers": async (input, output) => {
    const modelId = input.model.api.id || input.model.name || ""
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
