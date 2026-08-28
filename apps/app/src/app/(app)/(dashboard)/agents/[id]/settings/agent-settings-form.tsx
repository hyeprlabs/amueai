"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { GatewayChatModel } from "@/lib/gateway-models";
import { updateAgent } from "../../actions";
import { agentSettingsSchema, type AgentSettingsValues } from "./agent-settings-schema";
import { ModelField } from "./model-field";

export function AgentSettingsForm({
  agentId,
  defaultValues,
  models,
}: {
  agentId: string;
  defaultValues: AgentSettingsValues;
  models: GatewayChatModel[];
}) {
  const {
    register,
    control,
    handleSubmit,
    resetDefaultValues,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AgentSettingsValues>({
    resolver: zodResolver(agentSettingsSchema),
    defaultValues,
  });

  const onSubmit = async (values: AgentSettingsValues) => {
    try {
      const saved = await updateAgent(agentId, values);
      // Rebases the dirty-tracking baseline to what was just saved without
      // touching live field values - any edit made while the request was
      // in flight stays put and correctly reads as dirty again.
      resetDefaultValues(saved);
      toast.add({ type: "success", title: "Settings saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError("root.serverError", { type: "server", message });
      toast.add({ type: "error", title: "Couldn't save settings", description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        {errors.root?.serverError && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.serverError.message}
          </p>
        )}

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" maxLength={200} {...register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.system_prompt}>
          <FieldLabel htmlFor="system_prompt">System instructions</FieldLabel>
          <Textarea id="system_prompt" rows={6} maxLength={4000} {...register("system_prompt")} />
          <FieldDescription>
            Tell it who it is and what it should refuse to answer.
          </FieldDescription>
          <FieldError errors={[errors.system_prompt]} />
        </Field>

        <Field data-invalid={!!errors.model}>
          <FieldLabel htmlFor="model">Model</FieldLabel>
          <ModelField control={control} models={models} />
          <FieldDescription>
            Any chat model currently available through the Vercel AI Gateway.
          </FieldDescription>
          <FieldError errors={[errors.model]} />
        </Field>

        <Field data-invalid={!!errors.temperature}>
          <FieldLabel htmlFor="temperature">Temperature</FieldLabel>
          <Input
            id="temperature"
            type="number"
            min={0}
            max={2}
            step={0.1}
            className="max-w-24"
            {...register("temperature", { valueAsNumber: true })}
          />
          <FieldDescription>
            Lower is more focused and repeatable, higher is more varied.
          </FieldDescription>
          <FieldError errors={[errors.temperature]} />
        </Field>
      </FieldGroup>

      <div className="mt-6">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
