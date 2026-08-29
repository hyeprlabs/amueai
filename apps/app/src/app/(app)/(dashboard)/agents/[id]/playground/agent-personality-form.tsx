"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { GatewayChatModel } from "@/lib/gateway-models";
import { updateAgent } from "../../actions";
import {
  agentPersonalitySchema,
  type AgentPersonalityValues,
} from "../settings/agent-settings-schema";
import { ModelField } from "./model-field";

export function AgentPersonalityForm({
  agentId,
  defaultValues,
  models,
}: {
  agentId: string;
  defaultValues: AgentPersonalityValues;
  models: GatewayChatModel[];
}) {
  const {
    register,
    control,
    handleSubmit,
    resetDefaultValues,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AgentPersonalityValues>({
    resolver: zodResolver(agentPersonalitySchema),
    defaultValues,
  });

  const onSubmit = async (values: AgentPersonalityValues) => {
    try {
      const saved = await updateAgent(agentId, values);
      resetDefaultValues(saved as AgentPersonalityValues);
      toast.add({ type: "success", title: "Personality saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError("root.serverError", { type: "server", message });
      toast.add({ type: "error", title: "Couldn't save", description: message });
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

        <Field data-invalid={!!errors.model}>
          <FieldLabel htmlFor="model">Model</FieldLabel>
          <ModelField control={control} models={models} />
          <FieldDescription>
            Any chat model currently available through the Vercel AI Gateway.
          </FieldDescription>
          <FieldError errors={[errors.model]} />
        </Field>

        <Field data-invalid={!!errors.system_prompt}>
          <FieldLabel htmlFor="system_prompt">Instructions</FieldLabel>
          <Textarea id="system_prompt" rows={10} maxLength={4000} {...register("system_prompt")} />
          <FieldDescription>
            Tell it who it is and what it should refuse to answer.
          </FieldDescription>
          <FieldError errors={[errors.system_prompt]} />
        </Field>
      </FieldGroup>

      <div className="mt-4">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
