"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWaitlist } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

const whitelistSchema = z.object({
  emailAddress: z.string().trim().min(1, "Please enter your email address"),
});

type WhitelistFormValues = z.infer<typeof whitelistSchema>;

function showError(description: string) {
  toast.add({ title: "Couldn't join the waitlist", description, type: "error" });
}

export function WhitelistForm() {
  const emailId = useId();
  const errorId = useId();
  const { waitlist, fetchStatus } = useWaitlist();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<WhitelistFormValues>({
    resolver: zodResolver(whitelistSchema),
    defaultValues: { emailAddress: "" },
  });

  useEffect(() => {
    if (isSubmitSuccessful) reset();
  }, [isSubmitSuccessful, reset]);

  const fieldError = errors.emailAddress;
  const isLoading = isSubmitting || fetchStatus === "fetching";

  const onSubmit = async ({ emailAddress }: WhitelistFormValues) => {
    clearErrors("root.serverError");
    try {
      const { error } = await waitlist.join({ emailAddress });
      if (error) {
        const isFormatError =
          isClerkAPIResponseError(error) &&
          error.errors.some((fieldErr) => fieldErr.code === "form_param_format_invalid");
        if (isFormatError) {
          setError("emailAddress", {
            type: "server",
            message: error.errors[0]?.longMessage ?? error.message,
          });
        } else {
          showError(error.longMessage ?? error.message);
          setError("root.serverError", { type: "server", message: error.message });
        }
        return;
      }

      toast.add({
        title: "You're on the list!",
        description: "We'll be in touch soon.",
        type: "success",
      });
      void fireConfetti();
    } catch {
      showError("Something went wrong. Please try again.");
      setError("root.serverError", { type: "network", message: "Something went wrong." });
    }
  };

  return (
    <form
      className="-mx-3 w-[calc(100%+1.5rem)] sm:mx-0 sm:w-full sm:max-w-md"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
        <Field className="flex-1" data-invalid={fieldError ? true : undefined}>
          <FieldLabel className="sr-only" htmlFor={emailId}>
            Email address
          </FieldLabel>
          <Input
            aria-describedby={fieldError ? errorId : undefined}
            aria-invalid={!!fieldError}
            autoComplete="email"
            disabled={isLoading}
            id={emailId}
            placeholder="you@company.com"
            type="email"
            {...register("emailAddress")}
          />
        </Field>
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
        <FieldError className="flex items-center gap-1 overflow-hidden text-xs" id={errorId}>
          {fieldError && (
            <>
              <AlertCircleIcon className="size-3.5 shrink-0" />
              {fieldError.message}
            </>
          )}
        </FieldError>
      </div>
    </form>
  );
}
