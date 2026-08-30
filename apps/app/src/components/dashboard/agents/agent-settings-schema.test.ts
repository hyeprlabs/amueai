import { describe, expect, it } from "vitest";

import { agentSettingsSchema } from "./agent-settings-schema";

const validValues = {
  name: "Acme Support",
  system_prompt: "You are a helpful assistant. Only answer from the provided context.",
  model: "openai/gpt-4o-mini",
  temperature: 0.3,
};

describe("agentSettingsSchema", () => {
  it("accepts a fully valid payload", () => {
    const result = agentSettingsSchema.safeParse(validValues);
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name, system_prompt, and model", () => {
    const result = agentSettingsSchema.parse({
      ...validValues,
      name: "  Acme Support  ",
      system_prompt: "  Be helpful.  ",
      model: "  openai/gpt-4o-mini  ",
    });
    expect(result.name).toBe("Acme Support");
    expect(result.system_prompt).toBe("Be helpful.");
    expect(result.model).toBe("openai/gpt-4o-mini");
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(agentSettingsSchema.safeParse({ ...validValues, name: "" }).success).toBe(false);
    expect(agentSettingsSchema.safeParse({ ...validValues, name: "   " }).success).toBe(false);
  });

  it("rejects a name over 200 characters", () => {
    expect(agentSettingsSchema.safeParse({ ...validValues, name: "a".repeat(201) }).success).toBe(
      false,
    );
    expect(agentSettingsSchema.safeParse({ ...validValues, name: "a".repeat(200) }).success).toBe(
      true,
    );
  });

  it("rejects an empty system_prompt", () => {
    expect(agentSettingsSchema.safeParse({ ...validValues, system_prompt: "" }).success).toBe(
      false,
    );
  });

  it("rejects a system_prompt over 4000 characters", () => {
    expect(
      agentSettingsSchema.safeParse({ ...validValues, system_prompt: "a".repeat(4001) }).success,
    ).toBe(false);
  });

  it("rejects an empty model id", () => {
    expect(agentSettingsSchema.safeParse({ ...validValues, model: "" }).success).toBe(false);
    expect(agentSettingsSchema.safeParse({ ...validValues, model: "   " }).success).toBe(false);
  });

  it("accepts temperature at the 0 and 2 boundaries", () => {
    expect(agentSettingsSchema.safeParse({ ...validValues, temperature: 0 }).success).toBe(true);
    expect(agentSettingsSchema.safeParse({ ...validValues, temperature: 2 }).success).toBe(true);
  });

  it("rejects temperature outside 0-2", () => {
    expect(agentSettingsSchema.safeParse({ ...validValues, temperature: -0.1 }).success).toBe(
      false,
    );
    expect(agentSettingsSchema.safeParse({ ...validValues, temperature: 2.1 }).success).toBe(false);
  });

  it("rejects NaN temperature (what an emptied number input produces)", () => {
    // register('temperature', { valueAsNumber: true }) turns a cleared
    // input into NaN, not undefined - this must fail validation rather
    // than silently coercing to some default.
    expect(agentSettingsSchema.safeParse({ ...validValues, temperature: NaN }).success).toBe(false);
  });

  it("rejects a non-numeric temperature", () => {
    expect(agentSettingsSchema.safeParse({ ...validValues, temperature: "0.3" }).success).toBe(
      false,
    );
  });

  it("rejects a payload missing required fields", () => {
    expect(agentSettingsSchema.safeParse({}).success).toBe(false);
    expect(agentSettingsSchema.safeParse({ name: "Acme" }).success).toBe(false);
  });
});
