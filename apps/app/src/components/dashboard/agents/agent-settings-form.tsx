"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { updateAgent } from "@/app/(app)/(dashboard)/agents/actions";
import { agentGeneralSchema, type AgentGeneralValues } from "@/components/dashboard/agents/agent-settings-schema";

export function AgentSettingsForm({
  agentId,
  defaultValues,
}: {
  agentId: string;
  defaultValues: AgentGeneralValues;
}) {
  const {
    register,
    control,
    handleSubmit,
    resetDefaultValues,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AgentGeneralValues>({
    resolver: zodResolver(agentGeneralSchema),
    defaultValues,
  });

  const onSubmit = async (values: AgentGeneralValues) => {
    try {
      const saved = await updateAgent(agentId, values);
      // Rebases the dirty-tracking baseline to what was just saved without
      // touching live field values - any edit made while the request was
      // in flight stays put and correctly reads as dirty again.
      resetDefaultValues(saved as AgentGeneralValues);
      toast.add({ type: "success", title: "Settings saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError("root.serverError", { type: "server", message });
      toast.add({ type: "error", title: "Couldn't save settings", description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.root?.serverError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {errors.root.serverError.message}
        </p>
      )}

      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" maxLength={200} {...register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <FieldSeparator />

        <Controller
          control={control}
          name="temperature"
          render={({ field }) => (
            <Field data-invalid={!!errors.temperature}>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="temperature">Temperature</FieldLabel>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {field.value.toFixed(1)}
                </span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
              />
              <FieldDescription>
                Lower is more focused and repeatable, higher is more varied.
              </FieldDescription>
              <FieldError errors={[errors.temperature]} />
            </Field>
          )}
        />
      </FieldGroup>

      <Button type="submit" className="mt-6" disabled={isSubmitting || !isDirty}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
