"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AddTextSourceForm({ chatbotId }: { chatbotId: string }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const res = await fetch(`/api/chatbots/${chatbotId}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "text", label, content }),
    });

    setPending(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(typeof body?.error === "string" ? body.error : "Failed to add source");
      return;
    }

    setLabel("");
    setContent("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-lg border p-4">
      <Input
        placeholder="Label, e.g. Refund policy"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
        maxLength={200}
      />
      <Textarea
        placeholder="Paste text content…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        rows={5}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add text source"}
        </Button>
      </div>
    </form>
  );
}
