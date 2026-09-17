"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export function CopySnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.add({ type: "error", title: "Couldn't copy to clipboard" });
    }
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border bg-muted p-4 pe-12 text-xs">{snippet}</pre>
      <Button
        aria-label="Copy snippet"
        className="absolute right-2 top-2 size-8"
        onClick={copy}
        size="icon-sm"
        variant="ghost"
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </Button>
    </div>
  );
}
