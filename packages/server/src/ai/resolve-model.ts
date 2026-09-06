import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * Chooses the language model from the environment.
 * - `AI_MODEL` alone (with `AI_GATEWAY_API_KEY`) targets the Vercel AI Gateway, e.g. `openai/gpt-5.1`.
 * - `AI_BASE_URL` (+ optional `AI_API_KEY`) targets any OpenAI-compatible endpoint instead.
 * Returns undefined when the assistant is not configured.
 */
export function resolveModel(): LanguageModel | undefined {
  const model = process.env.AI_MODEL;
  if (!model) return undefined;
  const baseURL = process.env.AI_BASE_URL;
  if (!baseURL) return process.env.AI_GATEWAY_API_KEY ? model : undefined;
  const provider = createOpenAICompatible({
    name: "digipm",
    baseURL: baseURL.replace(/\/$/, ""),
    apiKey: process.env.AI_API_KEY,
  });
  return provider(model);
}
