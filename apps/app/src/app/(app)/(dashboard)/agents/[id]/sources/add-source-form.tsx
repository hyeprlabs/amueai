"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlusIcon } from "lucide-react";

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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";

export function AddSourceDialog({ agentId }: { agentId: string }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

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

      setLabel("");
      setUrl("");
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
      toast.add({
        type: "error",
        title: "Couldn't add source",
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Add URL
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add a URL source</DialogTitle>
            <DialogDescription>
              Firecrawl scrapes the page and it&apos;s embedded immediately.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="source-url">URL</FieldLabel>
            <Input
              id="source-url"
              type="url"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="source-label">Label</FieldLabel>
            <Input
              id="source-label"
              placeholder="e.g. Refund policy"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={200}
            />
            <FieldDescription>Optional — defaults to the URL.</FieldDescription>
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {pending ? "Fetching & embedding…" : "Add source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
