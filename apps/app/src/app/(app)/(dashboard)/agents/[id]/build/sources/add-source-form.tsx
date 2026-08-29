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
import { toast } from "@/components/ui/toast";

const addSourceSchema = z.object({
  url: z.string().trim().min(1, "URL is required").url("Enter a valid URL").max(2048),
  label: z.string().trim().max(200, "Keep it under 200 characters").optional(),
});

type AddSourceValues = z.infer<typeof addSourceSchema>;

export function AddSourceDialog({ agentId }: { agentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddSourceValues>({
    resolver: zodResolver(addSourceSchema),
    defaultValues: { url: "", label: "" },
  });

  const onSubmit = async ({ url, label }: AddSourceValues) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "url", label: label || url, url }),
      });

      const responseBody = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          typeof responseBody?.error === "string" ? responseBody.error : "Failed to add source",
        );
      }

      reset();
      setOpen(false);
      router.refresh();

      // Firecrawl scrapes and embeds inline before this request resolves,
      // so a "failed" status here is the real outcome, not a stale
      // placeholder still waiting on a background worker.
      if (responseBody?.source?.status === "failed") {
        toast.add({
          type: "warning",
          title: "Source added, but couldn't be processed",
          description: responseBody.source.error_message || "See the sources list to retrain it.",
        });
      } else {
        toast.add({ type: "success", title: "Source added" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError("root.serverError", { type: "server", message });
      toast.add({ type: "error", title: "Couldn't add source", description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && setOpen(next)}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Add URL
      </DialogTrigger>
      <DialogContent showCloseButton={!isSubmitting}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add a URL source</DialogTitle>
            <DialogDescription>
              Firecrawl scrapes the page and it&apos;s embedded immediately.
            </DialogDescription>
          </DialogHeader>

          {errors.root?.serverError && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.serverError.message}
            </p>
          )}

          <Field data-invalid={!!errors.url}>
            <FieldLabel htmlFor="source-url">URL</FieldLabel>
            <Input
              id="source-url"
              type="url"
              placeholder="https://example.com/page"
              autoFocus
              {...register("url")}
            />
            <FieldError errors={[errors.url]} />
          </Field>

          <Field data-invalid={!!errors.label}>
            <FieldLabel htmlFor="source-label">Label</FieldLabel>
            <Input
              id="source-label"
              placeholder="e.g. Refund policy"
              maxLength={200}
              {...register("label")}
            />
            <FieldDescription>Optional — defaults to the URL.</FieldDescription>
            <FieldError errors={[errors.label]} />
          </Field>

          <DialogFooter>
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
              {isSubmitting ? "Fetching & embedding…" : "Add source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
