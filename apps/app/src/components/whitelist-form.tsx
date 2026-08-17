"use client";

import { useState } from "react";
import { useWaitlist } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

function showError(description: string) {
  toast.add({ title: "Couldn't join the waitlist", description, type: "error" });
}

export function WhitelistForm() {
  const { waitlist, errors, fetchStatus } = useWaitlist();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldError = errors.fields.emailAddress;
  const isLoading = isSubmitting || fetchStatus === "fetching";

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const form = e.currentTarget;
    const emailAddress = (new FormData(form).get("emailAddress") as string | null)?.trim();
    if (!emailAddress) {
      form.reportValidity();
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await waitlist.join({ emailAddress });
      if (error) {
        // Invalid email format is already shown inline below the input.
        const isFormatError =
          isClerkAPIResponseError(error) &&
          error.errors.some((fieldErr) => fieldErr.code === "form_param_format_invalid");
        if (!isFormatError) showError(error.longMessage ?? error.message);
        return;
      }

      toast.add({
        title: "You're on the list!",
        description: "We'll be in touch soon.",
        type: "success",
      });
      void fireConfetti();
      form.reset();
    } catch {
      showError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="-mx-3 w-[calc(100%+1.5rem)] sm:mx-0 sm:w-full sm:max-w-md"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
        <Input
          aria-describedby={fieldError ? "waitlist-email-error" : undefined}
          aria-invalid={!!fieldError}
          aria-label="Email address"
          autoComplete="email"
          disabled={isLoading}
          name="emailAddress"
          placeholder="you@company.com"
          required
          type="email"
        />
        <Button
          aria-busy={isLoading}
          className="group relative w-full disabled:opacity-100 sm:w-auto"
          data-loading={isLoading || undefined}
          disabled={isLoading}
          type="submit"
        >
          <span className="group-data-loading:text-transparent">Join</span>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderCircleIcon aria-hidden="true" className="animate-spin" size={16} />
            </div>
          )}
        </Button>
      </div>

      <div
        aria-live="polite"
        className={cn(
          "grid transition-all duration-300 ease-out",
          fieldError ? "grid-rows-[1fr] pt-2 opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <p
          className="flex items-center gap-1 overflow-hidden text-destructive text-xs"
          id="waitlist-email-error"
        >
          <AlertCircleIcon className="size-3.5 shrink-0" />
          {fieldError?.longMessage}
        </p>
      </div>
    </form>
  );
}
