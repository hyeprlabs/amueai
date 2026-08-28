"use client";

import { useEffect, useId } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name"),
  email: z.string().trim().min(1, "Please enter your email address").email("Enter a valid email"),
  message: z.string().trim().min(1, "Please enter a message"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  useEffect(() => {
    if (isSubmitSuccessful) reset();
  }, [isSubmitSuccessful, reset]);

  const onSubmit = ({ name, email, message }: ContactFormValues) => {
    const subject = `Message from ${name}`;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form
      className="flex w-full max-w-md flex-col gap-4"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor={nameId}>Name</FieldLabel>
        <Input
          aria-invalid={!!errors.name}
          autoComplete="name"
          id={nameId}
          placeholder="Jane Doe"
          {...register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field data-invalid={errors.email ? true : undefined}>
        <FieldLabel htmlFor={emailId}>Email</FieldLabel>
        <Input
          aria-invalid={!!errors.email}
          autoComplete="email"
          id={emailId}
          placeholder="you@company.com"
          type="email"
          {...register("email")}
        />
        <FieldError errors={[errors.email]} />
      </Field>

      <Field data-invalid={errors.message ? true : undefined}>
        <FieldLabel htmlFor={messageId}>Message</FieldLabel>
        <Textarea
          aria-invalid={!!errors.message}
          id={messageId}
          placeholder="How can we help?"
          rows={5}
          {...register("message")}
        />
        <FieldError errors={[errors.message]} />
      </Field>

      <Button className="w-full" type="submit">
        Send message
      </Button>

      {/*
        A notice rather than a consent checkbox: submitting opens the visitor's
        own mail client, so nothing is transmitted to or stored by us until
        they send the message themselves. The link still has to be here.
      */}
      <p className="font-light text-muted-foreground text-xs leading-relaxed">
        This opens your email client so you can send the message yourself. See our{" "}
        <Link
          className="font-medium text-foreground underline underline-offset-2"
          href="/legal/privacy-policy"
        >
          Privacy Policy
        </Link>{" "}
        for how we handle your message once we receive it.
      </p>
    </form>
  );
}
