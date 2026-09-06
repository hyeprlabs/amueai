"use client";

import { useState } from "react";
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
  DatabaseIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react";

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
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";
import { LiveSourceStatus } from "@/components/dashboard/agents/live-source-status";
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
import type { Tables } from "@/types/supabase";

export type SourceRow = Pick<
  Tables<"sources">,
  "id" | "label" | "status" | "error_message" | "created_at"
>;

export type ActiveRun = { accessToken: string };

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

/**
 * Purely presentational: `SourcesPanel` owns the sources list, the active
 * Trigger.dev runs, and the retrain/delete network calls. A row with an
 * active run renders `LiveSourceStatus` (driven by that run's own realtime
 * updates); otherwise it renders the plain DB-driven `StatusBadge`.
 */
export function SourcesTable({
  sources,
  activeRuns,
  onRetrain,
  onDelete,
  onRunSettled,
}: {
  sources: SourceRow[];
  activeRuns: Record<string, ActiveRun>;
  onRetrain: (sourceId: string) => Promise<void>;
  onDelete: (sourceId: string) => Promise<void>;
  onRunSettled: (sourceId: string) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRetrain(sourceId: string) {
    setPendingId(sourceId);
    try {
      await onRetrain(sourceId);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(sourceId: string) {
    setPendingId(sourceId);
    try {
      await onDelete(sourceId);
    } finally {
      setPendingId(null);
    }
  }

  if (sources.length === 0) {
    return (
      <DashboardEmpty
        description="Add a URL to train this agent on a page."
        icon={<DatabaseIcon />}
        title="No sources yet"
      />
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
        {sources.map((source) => {
          const activeRun = activeRuns[source.id];
          return (
            <TableRow key={source.id}>
              <TableCell className="max-w-64 truncate font-medium">{source.label}</TableCell>
              <TableCell>
                {activeRun ? (
                  <LiveSourceStatus
                    sourceId={source.id}
                    accessToken={activeRun.accessToken}
                    onSettled={() => onRunSettled(source.id)}
                  />
                ) : (
                  <StatusBadge source={source} />
                )}
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
                    onClick={() => handleRetrain(source.id)}
                  >
                    Retrain
                  </Button>

                  <DeleteSourceButton
                    label={source.label}
                    pending={pendingId === source.id}
                    onConfirm={() => handleDelete(source.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
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
