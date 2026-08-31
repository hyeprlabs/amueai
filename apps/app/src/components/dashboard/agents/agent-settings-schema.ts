import { z } from "zod";

// Shared between the client RHF form (agent-settings-form.tsx) and the
// updateAgent server action, so the two never drift - the client only
// gets a nicer error experience, the server is still the one that decides
// whether a save is valid.
export const agentSettingsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  system_prompt: z.string().trim().min(1, "System instructions are required").max(4000),
  model: z.string().trim().min(1, "Choose a model"),
  temperature: z
    .number("Temperature is required")
    .min(0, "Must be at least 0")
    .max(2, "Must be at most 2"),
  welcome_message: z.string().trim().min(1, "Welcome message is required").max(300),
});

export type AgentSettingsValues = z.infer<typeof agentSettingsSchema>;

// The General settings form (name + temperature) and the Playground's
// instructions panel each save a slice of the same agent row through the
// same updateAgent action - picked from this one schema so field-level
// validation never drifts between them. Model has no form of its own: it's
// switched live from the Playground's chat composer (model-switcher.tsx),
// which saves a bare { model } straight through updateAgent's partial
// schema.
export const agentGeneralSchema = agentSettingsSchema.pick({
  name: true,
  temperature: true,
  welcome_message: true,
});
export type AgentGeneralValues = z.infer<typeof agentGeneralSchema>;

export const agentInstructionsSchema = agentSettingsSchema.pick({ system_prompt: true });
export type AgentInstructionsValues = z.infer<typeof agentInstructionsSchema>;
