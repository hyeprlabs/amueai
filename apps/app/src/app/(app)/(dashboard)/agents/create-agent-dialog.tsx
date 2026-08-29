"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createAgent } from "./actions";

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
});

type CreateAgentValues = z.infer<typeof createAgentSchema>;

export function CreateAgentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAgentValues>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (values: CreateAgentValues) => {
    try {
      const agent = await createAgent(values);
      setOpen(false);
      router.push(`/agents/${agent.id}/sources`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError("root.serverError", { type: "server", message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && setOpen(next)}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        New agent
      </DialogTrigger>
      <DialogContent showCloseButton={!isSubmitting}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create an agent</DialogTitle>
            <DialogDescription>
              Give it a name — you&apos;ll add data sources and configure it next.
            </DialogDescription>
          </DialogHeader>

          {errors.root?.serverError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {errors.root.serverError.message}
            </p>
          )}

          <Field className="mt-4" data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" placeholder="e.g. Acme Support" autoFocus {...register("name")} />
            <FieldDescription>You can rename this later from its settings.</FieldDescription>
            <FieldError errors={[errors.name]} />
          </Field>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Creating…" : "Create agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
