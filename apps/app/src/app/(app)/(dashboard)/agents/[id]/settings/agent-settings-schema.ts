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
});

export type AgentSettingsValues = z.infer<typeof agentSettingsSchema>;
