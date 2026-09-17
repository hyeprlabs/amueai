export const CHAT_MODELS = [
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
  { id: "anthropic/claude-3-5-haiku", name: "Claude 3.5 Haiku" },
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash" },
] as const;

export const DEFAULT_CHAT_MODEL = CHAT_MODELS[0].id;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];
