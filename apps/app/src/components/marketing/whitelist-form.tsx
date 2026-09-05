"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWaitlist } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { Controller, type FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { siteConfig } from "@/config/site";
import { fireConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

const CONSENT_REQUIRED = "Please accept the Terms of Service and Privacy Policy.";

/**
 * Consent is a required, separately-refused field rather than an implied
 * "by joining you agree" line: GDPR Art. 7 and the German TDDDG want an
 * unambiguous, affirmative action, so the box starts unchecked and the form
 * refuses to submit without it.
 */
const whitelistSchema = z.object({
  emailAddress: z.string().trim().min(1, "Please enter your email address"),
  acceptedTerms: z.boolean().refine((accepted) => accepted, CONSENT_REQUIRED),
});

type WhitelistFormValues = z.infer<typeof whitelistSchema>;

function showError(description: string) {
  toast.add({ title: "Couldn’t join the waitlist", description, type: "error" });
}

export function WhitelistForm() {
  const emailId = useId();
  const termsId = useId();
  const errorId = useId();
  const { waitlist, fetchStatus } = useWaitlist();
  const {
    control,
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<WhitelistFormValues>({
    resolver: zodResolver(whitelistSchema),
    defaultValues: { emailAddress: "", acceptedTerms: false },
  });

  useEffect(() => {
    if (isSubmitSuccessful) reset();
  }, [isSubmitSuccessful, reset]);

  const fieldError = errors.emailAddress;
  const termsError = errors.acceptedTerms;
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
        title: "You’re on the list!",
        description: "We’ll be in touch soon.",
        type: "success",
      });
      void fireConfetti();
    } catch {
      showError("Something went wrong. Please try again.");
      setError("root.serverError", { type: "network", message: "Something went wrong." });
    }
  };

  /**
   * Missing consent is surfaced as a toast rather than inline text, so the
   * form's resting state stays clean. The field is still marked invalid, which
   * is what screen readers and the focus ring go on.
   *
   * Reads the errors handed in by the resolver, not `formState.errors` from the
   * render closure: that one is still the previous value at this point.
   */
  const onInvalid = (submitErrors: FieldErrors<WhitelistFormValues>) => {
    if (submitErrors.acceptedTerms) {
      toast.add({ title: CONSENT_REQUIRED, type: "error" });
    }
  };

  return (
    <form
      className="w-full max-w-2xs sm:max-w-md"
      noValidate
      onSubmit={handleSubmit(onSubmit, onInvalid)}
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
            spellCheck={false}
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
          "grid transition-[grid-template-rows,opacity,padding-top] duration-300 ease-out",
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

      <Field className="mt-3 text-left" data-invalid={termsError ? true : undefined}>
        <Controller
          control={control}
          name="acceptedTerms"
          render={({ field }) => (
            <div className="flex items-start gap-2">
              <Checkbox
                aria-invalid={!!termsError}
                checked={field.value}
                disabled={isLoading}
                id={termsId}
                inputRef={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                // Base UI passes `(checked, eventDetails)`; forward only the value.
                onCheckedChange={(checked) => field.onChange(checked)}
                // Nudged down so the box aligns with the first line of a label
                // that wraps to two lines on narrow viewports.
                className="mt-0.5"
              />
              <label
                className="min-w-0 text-left font-normal text-muted-foreground text-xs leading-relaxed"
                htmlFor={termsId}
              >
                I agree to the{" "}
                <Link
                  className="font-medium text-foreground underline underline-offset-2"
                  href="/legal/terms-of-service"
                >
                  Terms of Service
                </Link>{" "}
                and the{" "}
                <Link
                  className="font-medium text-foreground underline underline-offset-2"
                  href="/legal/privacy-policy"
                >
                  Privacy Policy
                </Link>
                , and to {siteConfig.name} storing my email address so it can contact me about early
                access.
              </label>
            </div>
          )}
        />
      </Field>
    </form>
  );
}
