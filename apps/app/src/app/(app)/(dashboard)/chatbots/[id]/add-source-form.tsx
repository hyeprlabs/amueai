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

export function AddSourceForm({ chatbotId }: { chatbotId: string }) {
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

  async function createSource(body: Record<string, unknown>) {
    const res = await fetch(`/api/chatbots/${chatbotId}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const responseBody = await res.json().catch(() => null);
      throw new Error(
        typeof responseBody?.error === "string" ? responseBody.error : "Failed to add source",
      );
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      if (type === "text") {
        await createSource({ type: "text", label, content });
      } else if (type === "url") {
        await createSource({ type: "url", label, url });
      } else if (type === "qa") {
        await createSource({ type: "qa", label, pairs: [{ question, answer }] });
      } else if (type === "file") {
        if (!file || !organization) throw new Error("Pick a file first");

        const storagePath = `${organization.id}/${chatbotId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("sources")
          .upload(storagePath, file);
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        await createSource({ type: "file", label: label || file.name, storagePath });
      }

      setLabel("");
      setContent("");
      setUrl("");
      setQuestion("");
      setAnswer("");
      setFile(null);
      router.refresh();
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
          {pending ? "Adding…" : "Add source"}
        </Button>
      </div>
    </form>
  );
}
