"use client";

import { useId, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useSupabaseClient } from "@/hooks/use-supabase-client";
import type { ActiveRun, SourceRow } from "@/components/dashboard/agents/sources-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

const ALLOWED_FILE_EXTENSIONS =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.rtf,.epub,.odt,.ods,.odp";
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const urlSchema = z.object({
  url: z.string().trim().min(1, "URL is required").url("Enter a valid URL").max(2048),
  label: z.string().trim().max(200, "Keep it under 200 characters").optional(),
});
type UrlValues = z.infer<typeof urlSchema>;

const fileSchema = z
  .object({
    file: z.custom<File | null>((value) => value === null || value instanceof File),
    label: z.string().trim().max(200, "Keep it under 200 characters").optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.file) {
      ctx.addIssue({ code: "custom", path: ["file"], message: "Choose a file" });
    } else if (data.file.size > MAX_FILE_SIZE_BYTES) {
      ctx.addIssue({ code: "custom", path: ["file"], message: "File must be 20MB or smaller" });
    }
  });
type FileValues = z.infer<typeof fileSchema>;

export type QueuedSource = { source: SourceRow; run: ActiveRun };

/**
 * Queues a source and returns it plus its Trigger.dev run - the caller
 * (SourcesPanel) adds the row to its own state and starts tracking the run
 * immediately, rather than waiting on a Realtime event or a full page
 * refresh to show it.
 */
async function queueSource(
  agentId: string,
  body:
    | { type: "url"; label: string; url: string }
    | { type: "file"; label: string; storagePath: string },
): Promise<QueuedSource> {
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
  return {
    source: { ...responseBody.source, error_message: null },
    run: responseBody.run,
  };
}

/**
 * Everything but the outer shell — form state, tabs, both submit handlers —
 * shared between the desktop Dialog and the mobile Drawer so the two only
 * differ in which chrome wraps them (per shadcn/ui's own Dialog/Drawer
 * responsive pattern). Both tabs are their own react-hook-form instance,
 * each with its own Zod schema, matching how every other form in this app
 * is built.
 */
function AddSourceForm({
  agentId,
  onQueued,
}: {
  agentId: string;
  onQueued: (result: QueuedSource) => void;
}) {
  const { orgId } = useAuth();
  const supabase = useSupabaseClient();
  const [tab, setTab] = useState<"url" | "file">("url");
  const fileInputId = useId();

  const urlForm = useForm<UrlValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: "", label: "" },
  });

  const fileForm = useForm<FileValues>({
    resolver: zodResolver(fileSchema),
    defaultValues: { file: null, label: "" },
  });

  const reportSuccess = () => {
    toast.add({
      type: "success",
      title: "Source queued",
      description: "Processing may take a moment.",
    });
  };

  const onSubmitUrl = async ({ url, label }: UrlValues) => {
    try {
      const result = await queueSource(agentId, { type: "url", label: label || url, url });
      urlForm.reset();
      onQueued(result);
      reportSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      urlForm.setError("root.serverError", { type: "server", message });
      toast.add({ type: "error", title: "Couldn't add source", description: message });
    }
  };

  const onSubmitFile = async ({ file, label }: FileValues) => {
    // Zod's refine above already guarantees this at validation time; the
    // check here is just to satisfy the resulting `File | null` type.
    if (!file) return;
    if (!orgId) {
      fileForm.setError("root.serverError", {
        type: "server",
        message: "No active organization",
      });
      return;
    }

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${orgId}/${agentId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("sources")
        .upload(storagePath, file, { contentType: file.type || undefined });
      if (uploadError) throw new Error(uploadError.message);

      const result = await queueSource(agentId, {
        type: "file",
        label: label || file.name,
        storagePath,
      });

      fileForm.reset();
      onQueued(result);
      reportSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      fileForm.setError("root.serverError", { type: "server", message });
      toast.add({ type: "error", title: "Couldn't add source", description: message });
    }
  };

  const busy = urlForm.formState.isSubmitting || fileForm.formState.isSubmitting;

  return (
    <Tabs value={tab} onValueChange={(value) => !busy && setTab(value as "url" | "file")}>
      <TabsList>
        <TabsTrigger value="url">URL</TabsTrigger>
        <TabsTrigger value="file">File</TabsTrigger>
      </TabsList>

      <TabsContent value="url">
        <form onSubmit={urlForm.handleSubmit(onSubmitUrl)} className="flex flex-col gap-4">
          {urlForm.formState.errors.root?.serverError && (
            <p role="alert" className="text-sm text-destructive">
              {urlForm.formState.errors.root.serverError.message}
            </p>
          )}

          <Field data-invalid={!!urlForm.formState.errors.url}>
            <FieldLabel htmlFor="source-url">URL</FieldLabel>
            <Input
              id="source-url"
              type="url"
              placeholder="https://example.com/page"
              autoFocus
              {...urlForm.register("url")}
            />
            <FieldError errors={[urlForm.formState.errors.url]} />
          </Field>

          <Field data-invalid={!!urlForm.formState.errors.label}>
            <FieldLabel htmlFor="source-label">Label</FieldLabel>
            <Input
              id="source-label"
              placeholder="e.g. Refund policy"
              maxLength={200}
              {...urlForm.register("label")}
            />
            <FieldDescription>Optional — defaults to the URL.</FieldDescription>
            <FieldError errors={[urlForm.formState.errors.label]} />
          </Field>

          <Button type="submit" disabled={busy}>
            {urlForm.formState.isSubmitting && <Spinner />}
            {urlForm.formState.isSubmitting ? "Queuing…" : "Add source"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="file">
        <form onSubmit={fileForm.handleSubmit(onSubmitFile)} className="flex flex-col gap-4">
          {fileForm.formState.errors.root?.serverError && (
            <p role="alert" className="text-sm text-destructive">
              {fileForm.formState.errors.root.serverError.message}
            </p>
          )}

          <Field data-invalid={!!fileForm.formState.errors.file}>
            <FieldLabel htmlFor={fileInputId}>File</FieldLabel>
            <Controller
              control={fileForm.control}
              name="file"
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <Input
                  id={fileInputId}
                  name={name}
                  ref={ref}
                  type="file"
                  accept={ALLOWED_FILE_EXTENSIONS}
                  onBlur={onBlur}
                  onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                />
              )}
            />
            <FieldDescription>
              PDF, Word, Excel, PowerPoint, CSV, EPUB, RTF, or OpenDocument — up to 20MB.
            </FieldDescription>
            <FieldError errors={[fileForm.formState.errors.file]} />
          </Field>

          <Field data-invalid={!!fileForm.formState.errors.label}>
            <FieldLabel htmlFor="file-source-label">Label</FieldLabel>
            <Input
              id="file-source-label"
              placeholder="e.g. Employee handbook"
              maxLength={200}
              {...fileForm.register("label")}
            />
            <FieldDescription>Optional — defaults to the file name.</FieldDescription>
            <FieldError errors={[fileForm.formState.errors.label]} />
          </Field>

          <Button type="submit" disabled={busy}>
            {fileForm.formState.isSubmitting && <Spinner />}
            {fileForm.formState.isSubmitting ? "Uploading…" : "Add source"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}

const TITLE = "Add a source";
const DESCRIPTION =
  "Firecrawl scrapes or parses the content and queues it for embedding in the background.";

/**
 * Desktop gets the Dialog, mobile gets the Drawer — same form underneath,
 * per shadcn/ui's own responsive Dialog/Drawer pattern. A file input inside
 * a Dialog on a small viewport fights the on-screen keyboard and the
 * dialog's own max-height; a bottom Drawer doesn't.
 */
export function AddSourceDialog({
  agentId,
  onQueued,
}: {
  agentId: string;
  onQueued: (result: QueuedSource) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);

  const handleQueued = (result: QueuedSource) => {
    setOpen(false);
    onQueued(result);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
          <PlusIcon />
          Add source
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{TITLE}</DialogTitle>
            <DialogDescription>{DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <AddSourceForm agentId={agentId} onQueued={handleQueued} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger render={<Button />}>
        <PlusIcon />
        Add source
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{TITLE}</DrawerTitle>
          <DrawerDescription>{DESCRIPTION}</DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <AddSourceForm agentId={agentId} onQueued={handleQueued} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
