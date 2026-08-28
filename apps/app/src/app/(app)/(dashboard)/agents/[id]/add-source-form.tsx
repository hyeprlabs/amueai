"use client";

import { useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSupabaseClient } from "@/hooks/use-supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SourceType = "text" | "url" | "qa" | "file";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // matches the "sources" bucket's file_size_limit

export function AddSourceForm({ agentId }: { agentId: string }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { organization } = useOrganization();

  const [type, setType] = useState<SourceType>("text");
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

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

      setLabel("");
      setContent("");
      setUrl("");
      setQuestion("");
      setAnswer("");
      setFile(null);
      router.refresh();

      if (outcome.failed) {
        setError("Source was created but couldn't be processed — see the list below to retrain.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add source");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border p-4">
      <Tabs value={type} onValueChange={(value) => setType(value as SourceType)}>
        <TabsList>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="qa">Q&amp;A</TabsTrigger>
          <TabsTrigger value="file">File</TabsTrigger>
        </TabsList>

        {type !== "qa" && (
          <Input
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={200}
            className="mt-3"
            required={type !== "file"}
          />
        )}

        <TabsContent value="text">
          <Textarea
            placeholder="Paste text content…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="mt-3"
            required={type === "text"}
          />
        </TabsContent>

        <TabsContent value="url">
          <Input
            type="url"
            placeholder="https://example.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-3"
            required={type === "url"}
          />
        </TabsContent>

        <TabsContent value="qa">
          <div className="mt-3 flex flex-col gap-2">
            <Input
              placeholder="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required={type === "qa"}
            />
            <Textarea
              placeholder="Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
              required={type === "qa"}
            />
          </div>
        </TabsContent>

        <TabsContent value="file">
          <input
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-3 text-sm"
          />
        </TabsContent>
      </Tabs>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending
            ? type === "url"
              ? "Fetching & embedding…"
              : type === "text"
                ? "Embedding…"
                : "Adding…"
            : "Add source"}
        </Button>
      </div>
    </form>
  );
}
