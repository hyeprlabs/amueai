"use client";

import { useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { useSupabaseClient } from "@/hooks/use-supabase-client";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

type SourceType = "text" | "url" | "qa" | "file";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // matches the "sources" bucket's file_size_limit

const pendingLabel: Record<SourceType, string> = {
  text: "Embedding…",
  url: "Fetching & embedding…",
  qa: "Adding…",
  file: "Uploading…",
};

export function AddSourceDialog({ agentId }: { agentId: string }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { organization } = useOrganization();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SourceType>("text");
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);

  function resetFields() {
    setLabel("");
    setContent("");
    setUrl("");
    setQuestion("");
    setAnswer("");
    setFile(null);
  }

  /**
   * Returns the created source's ingestion outcome so the caller can warn
   * about a failed embed without treating source creation itself as
   * having failed - the row was created either way, and it'll show up in
   * the list (with a Retrain button) as soon as router.refresh() runs.
   */
  async function createSource(body: Record<string, unknown>): Promise<{ failed: boolean }> {
    const res = await fetch(`/api/agents/${agentId}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const responseBody = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        typeof responseBody?.error === "string" ? responseBody.error : "Failed to add source",
      );
    }

    // Text and URL sources are embedded inline before this request
    // resolves, so a "failed" status here is the real outcome, not a
    // stale placeholder still waiting on a background worker.
    return { failed: responseBody?.source?.status === "failed" };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    try {
      let outcome: { failed: boolean } = { failed: false };

      if (type === "text") {
        outcome = await createSource({ type: "text", label, content });
      } else if (type === "url") {
        outcome = await createSource({ type: "url", label, url });
      } else if (type === "qa") {
        if (!question.trim()) throw new Error("Question is required");
        outcome = await createSource({
          type: "qa",
          label: question.trim().slice(0, 200),
          pairs: [{ question, answer }],
        });
      } else if (type === "file") {
        if (!file || !organization) throw new Error("Pick a file first");
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error("File is too large (20MB limit)");
        }

        const storagePath = `${organization.id}/${agentId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("sources")
          .upload(storagePath, file);
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        try {
          outcome = await createSource({ type: "file", label: label || file.name, storagePath });
        } catch (err) {
          // Don't leave an orphaned blob behind when the source row never
          // gets created.
          await supabase.storage.from("sources").remove([storagePath]);
          throw err;
        }
      }

      resetFields();
      setOpen(false);
      router.refresh();

      if (outcome.failed) {
        toast.add({
          type: "warning",
          title: "Source added, but couldn't be processed",
          description: "See the sources list to retrain it.",
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
        Add source
      </DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add a data source</DialogTitle>
            <DialogDescription>
              Text and URL sources are embedded immediately. Q&amp;A and file sources are queued for
              background processing.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={type} onValueChange={(value) => setType(value as SourceType)}>
            <TabsList className="w-full">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
              <TabsTrigger value="file">File</TabsTrigger>
            </TabsList>

            {type !== "qa" && (
              <Field className="mt-3">
                <FieldLabel htmlFor="source-label">Label</FieldLabel>
                <Input
                  id="source-label"
                  placeholder="e.g. Refund policy"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={200}
                  required={type !== "file"}
                />
              </Field>
            )}

            <TabsContent value="text">
              <Field className="mt-3">
                <FieldLabel htmlFor="source-content">Content</FieldLabel>
                <Textarea
                  id="source-content"
                  placeholder="Paste text content…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  required={type === "text"}
                />
              </Field>
            </TabsContent>

            <TabsContent value="url">
              <Field className="mt-3">
                <FieldLabel htmlFor="source-url">URL</FieldLabel>
                <Input
                  id="source-url"
                  type="url"
                  placeholder="https://example.com/page"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required={type === "url"}
                />
              </Field>
            </TabsContent>

            <TabsContent value="qa">
              <div className="mt-3 flex flex-col gap-3">
                <Field>
                  <FieldLabel htmlFor="source-question">Question</FieldLabel>
                  <Input
                    id="source-question"
                    placeholder="What's your refund policy?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required={type === "qa"}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="source-answer">Answer</FieldLabel>
                  <Textarea
                    id="source-answer"
                    placeholder="We offer a 30-day money-back guarantee…"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={3}
                    required={type === "qa"}
                  />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="file">
              <Field className="mt-3">
                <FieldLabel htmlFor="source-file">File</FieldLabel>
                <input
                  id="source-file"
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
                />
              </Field>
            </TabsContent>
          </Tabs>

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
              {pending ? pendingLabel[type] : "Add source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
