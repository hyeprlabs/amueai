import { z } from "zod";

import { CHAT_MODELS } from "@/lib/models";

const modelIds = CHAT_MODELS.map((model) => model.id) as [string, ...string[]];

export const agentSettingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  system_prompt: z.string().trim().min(1, "System instructions are required").max(4000),
  model: z.enum(modelIds),
  temperature: z
    .number("Temperature is required")
    .min(0, "Must be at least 0")
    .max(2, "Must be at most 2"),
  welcome_message: z.string().trim().min(1, "Welcome message is required").max(300),
  fallback_message: z.string().trim().min(1, "Fallback message is required").max(300),
});

export type AgentSettingsValues = z.infer<typeof agentSettingsSchema>;

export const agentGeneralSchema = agentSettingsSchema.pick({
  name: true,
  temperature: true,
  welcome_message: true,
  fallback_message: true,
});
export type AgentGeneralValues = z.infer<typeof agentGeneralSchema>;

export const agentInstructionsSchema = agentSettingsSchema.pick({ system_prompt: true });
export type AgentInstructionsValues = z.infer<typeof agentInstructionsSchema>;
