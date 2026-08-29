"use client";

import { useEffect, useState } from "react";
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  DatabaseIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";

import { useSupabaseClient } from "@/hooks/use-supabase-client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import type { Tables } from "@/types/supabase";

type SourceRow = Pick<
  Tables<"sources">,
  "id" | "label" | "status" | "error_message" | "created_at"
>;

const statusConfig: Record<
  SourceRow["status"],
  { label: string; variant: "secondary" | "outline" | "destructive"; icon: React.ReactNode }
> = {
  queued: { label: "Queued", variant: "secondary", icon: <ClockIcon /> },
  processing: {
    label: "Processing",
    variant: "outline",
    icon: <Loader2Icon className="animate-spin" />,
  },
  ready: {
    label: "Ready",
    variant: "secondary",
    icon: <CircleCheckIcon className="text-emerald-600 dark:text-emerald-500" />,
  },
  failed: { label: "Failed", variant: "destructive", icon: <CircleXIcon /> },
};

function StatusBadge({ source }: { source: SourceRow }) {
  const config = statusConfig[source.status];
  const badge = (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );

  if (source.status !== "failed" || !source.error_message) return badge;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex cursor-default" />}>
        {badge}
      </TooltipTrigger>
      <TooltipContent>{source.error_message}</TooltipContent>
    </Tooltip>
  );
}

/** Live queued/processing/ready/failed status via Supabase Realtime. */
export function SourcesList({
  agentId,
  initialSources,
}: {
  agentId: string;
  initialSources: SourceRow[];
}) {
  const supabase = useSupabaseClient();
  const [sources, setSources] = useState(initialSources);

  useEffect(() => {
    const channel = supabase
      .channel(`sources:${agentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sources", filter: `agent_id=eq.${agentId}` },
        (payload) => {
          setSources((current) => {
            if (payload.eventType === "DELETE") {
              return current.filter((source) => source.id !== payload.old.id);
            }

            const updated = payload.new as SourceRow;
            const exists = current.some((source) => source.id === updated.id);

            return exists
              ? current.map((source) => (source.id === updated.id ? updated : source))
              : [updated, ...current];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, agentId]);

  const [pendingId, setPendingId] = useState<string | null>(null);

  async function retrain(sourceId: string) {
    setPendingId(sourceId);
    setSources((current) =>
      current.map((s) => (s.id === sourceId ? { ...s, status: "processing" } : s)),
    );
    try {
      const res = await fetch(`/api/agents/${agentId}/sources/${sourceId}/retrain`, {
        method: "POST",
      });
      if (!res.ok) {
        // Request never kicked off a retrain, so the optimistic
        // "processing" status is never going to resolve on its own.
        setSources((current) =>
          current.map((s) => (s.id === sourceId ? { ...s, status: "failed" } : s)),
        );
        toast.add({ type: "error", title: "Couldn't start retraining" });
      } else {
        toast.add({ type: "success", title: "Retraining started" });
      }
    } finally {
      setPendingId(null);
    }
  }

  async function remove(sourceId: string) {
    setPendingId(sourceId);
    try {
      const res = await fetch(`/api/agents/${agentId}/sources/${sourceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSources((current) => current.filter((s) => s.id !== sourceId));
        toast.add({ type: "success", title: "Source deleted" });
      } else {
        toast.add({ type: "error", title: "Couldn't delete source" });
      }
    } finally {
      setPendingId(null);
    }
  }

  if (sources.length === 0) {
    return (
      <Empty className="border border-dashed py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DatabaseIcon />
          </EmptyMedia>
          <EmptyTitle>No sources yet</EmptyTitle>
          <EmptyDescription>Add a URL to train this agent on a page.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => (
          <TableRow key={source.id}>
            <TableCell className="max-w-64 truncate font-medium">{source.label}</TableCell>
            <TableCell>
              <StatusBadge source={source} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(source.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={pendingId === source.id}
                  onClick={() => retrain(source.id)}
                >
                  Retrain
                </Button>

                <DeleteSourceButton
                  label={source.label}
                  pending={pendingId === source.id}
                  onConfirm={() => remove(source.id)}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DeleteSourceButton({
  label,
  pending,
  onConfirm,
}: {
  label: string;
  pending: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <AlertDialogTrigger
        render={<Button type="button" size="xs" variant="destructive" disabled={pending} />}
      >
        <Trash2Icon />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{label}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the source and everything it taught the agent. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={pending} />
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
          >
            {pending && <Spinner />}
            {pending ? "Deleting…" : "Delete source"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
