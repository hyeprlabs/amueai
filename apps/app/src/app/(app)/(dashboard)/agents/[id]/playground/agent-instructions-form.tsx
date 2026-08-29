"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { updateAgent } from "../../actions";
import {
  agentInstructionsSchema,
  type AgentInstructionsValues,
} from "../settings/agent-settings-schema";

export function AgentInstructionsForm({
  agentId,
  defaultValues,
}: {
  agentId: string;
  defaultValues: AgentInstructionsValues;
}) {
  const {
    register,
    handleSubmit,
    resetDefaultValues,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AgentInstructionsValues>({
    resolver: zodResolver(agentInstructionsSchema),
    defaultValues,
  });

  const onSubmit = async (values: AgentInstructionsValues) => {
    try {
      const saved = await updateAgent(agentId, values);
      resetDefaultValues(saved as AgentInstructionsValues);
      toast.add({ type: "success", title: "Instructions saved" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError("root.serverError", { type: "server", message });
      toast.add({ type: "error", title: "Couldn't save", description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
      {errors.root?.serverError && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.serverError.message}
        </p>
      )}

      <Field data-invalid={!!errors.system_prompt} className="flex-1">
        <Textarea
          className="h-full min-h-56 resize-none"
          maxLength={4000}
          {...register("system_prompt")}
        />
        <FieldDescription>Who it is, what it should refuse to answer.</FieldDescription>
        <FieldError errors={[errors.system_prompt]} />
      </Field>

      <Button type="submit" className="mt-4 self-start" disabled={isSubmitting || !isDirty}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
