"use client";

import { useFormStatus } from "react-dom";
import { Trash2Icon } from "lucide-react";

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
import { Spinner } from "@/components/ui/spinner";
import { deleteAgent } from "../actions";

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();

  // A plain submit button, not AlertDialogAction/Close - the server action
  // redirects to /agents on success, which unmounts this dialog anyway, and
  // Base UI's Close defaults its rendered button to type="button" (it isn't
  // meant to submit forms), which would silently swallow this click instead
  // of running the delete.
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending && <Spinner />}
      {pending ? "Deleting…" : "Delete agent"}
    </Button>
  );
}

export function DeleteAgentButton({ agentId, agentName }: { agentId: string; agentName: string }) {
  const deleteAgentWithId = deleteAgent.bind(null, agentId);

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon />
        Delete agent
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={deleteAgentWithId}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{agentName}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the agent, its sources, and every conversation it has had.
              Anyone using its embedded widget will stop getting answers. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel />
            <ConfirmDeleteButton />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
