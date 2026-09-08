"use client";

import { useState } from "react";
import { DatabaseIcon, Trash2Icon } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty";
import { LiveSourceStatus } from "@/components/dashboard/agents/live-source-status";
import {
  SourceStatusBadge,
  type SourceStatus,
} from "@/components/dashboard/agents/source-status-badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/types/supabase";

export type SourceRow = Pick<
  Tables<"sources">,
  "id" | "label" | "status" | "error_message" | "created_at"
>;

export type ActiveRun = { accessToken: string };

export function SourcesTable({
  sources,
  activeRuns,
  onDelete,
  onRunSettled,
}: {
  sources: SourceRow[];
  activeRuns: Record<string, ActiveRun>;
  onDelete: (sourceId: string) => Promise<void>;
  onRunSettled: (sourceId: string) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

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
                  <SourceStatusBadge
                    error={source.error_message}
                    status={source.status as SourceStatus}
                  />
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(source.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
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
