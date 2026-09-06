"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "@/components/ui/toast";
import { deleteAgent } from "@/app/(app)/(dashboard)/agents/actions";

export function DeleteAgentDialog({ agentId, agentName }: { agentId: string; agentName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAgent(agentId);
      // Close the dialog before navigating away - letting a server-side
      // redirect unmount it out from under Base UI's own close-animation
      // cleanup is what threw here before.
      setOpen(false);
      router.push("/agents");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.add({ type: "error", title: "Couldn't delete agent", description: message });
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !isDeleting && setOpen(next)}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon />
        Delete agent
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{agentName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the agent, its sources, and every conversation it has had.
            Anyone using its embedded widget will stop getting answers. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting && <Spinner />}
            {isDeleting ? "Deleting…" : "Delete agent"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
