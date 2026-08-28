"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createAgent } from "./actions";

function CreateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Spinner />}
      {pending ? "Creating…" : "Create agent"}
    </Button>
  );
}

export function CreateAgentDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        New agent
      </DialogTrigger>
      <DialogContent>
        <form action={createAgent}>
          <DialogHeader>
            <DialogTitle>Create an agent</DialogTitle>
            <DialogDescription>
              Give it a name — you&apos;ll add data sources and configure it next.
            </DialogDescription>
          </DialogHeader>

          <Field className="mt-4">
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" name="name" placeholder="e.g. Acme Support" required autoFocus />
            <FieldDescription>You can rename this later from its settings.</FieldDescription>
          </Field>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <CreateButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
