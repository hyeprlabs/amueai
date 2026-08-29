"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsInteger, useQueryState } from "nuqs";
import {
  AtSignIcon,
  CheckIcon,
  FileStackIcon,
  GlobeIcon,
  HashIcon,
  MailIcon,
  MessageCircleIcon,
  SendIcon,
} from "lucide-react";
import { Controller, useForm, type SubmitErrorHandler } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createAgent } from "../agents/actions";

const TOTAL_STEPS = 3;

const onboardingSchema = z
  .object({
    sourceType: z.enum(["website", "other"]),
    websiteUrl: z.string().trim().max(2048),
    systemPrompt: z
      .string()
      .trim()
      .min(1, "Tell your agent what to do")
      .max(2000, "Keep it under 2000 characters"),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType !== "website") return;

    const domain = stripProtocol(data.websiteUrl);
    if (!domain) {
      ctx.addIssue({ code: "custom", path: ["websiteUrl"], message: "Enter your website URL" });
      return;
    }
    if (
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(\/.*)?$/i.test(
        domain,
      )
    ) {
      ctx.addIssue({ code: "custom", path: ["websiteUrl"], message: "Enter a valid domain" });
    }
  });

type OnboardingValues = z.infer<typeof onboardingSchema>;

const STEP_FIELDS: Record<number, (keyof OnboardingValues)[]> = {
  1: ["sourceType", "websiteUrl"],
  2: ["systemPrompt"],
  3: [],
};

function stripProtocol(value: string) {
  return value.trim().replace(/^https?:\/\//i, "");
}

function deriveAgentName(values: OnboardingValues) {
  if (values.sourceType === "website" && values.websiteUrl) {
    const domain = stripProtocol(values.websiteUrl).split("/")[0];
    if (domain) return domain.replace(/^www\./, "");
  }
  return "New agent";
}

const CHANNELS = [
  {
    id: "website",
    label: "Website widget",
    description: "A chat bubble embedded on your site.",
    icon: GlobeIcon,
    badge: "Included",
  },
  {
    id: "slack",
    label: "Slack",
    description: "Answer questions inside Slack channels.",
    icon: HashIcon,
    badge: "Coming soon",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    description: "Chat with customers on WhatsApp.",
    icon: MessageCircleIcon,
    badge: "Coming soon",
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Reply to Instagram DMs automatically.",
    icon: AtSignIcon,
    badge: "Coming soon",
  },
  {
    id: "messenger",
    label: "Messenger",
    description: "Connect to Facebook Messenger.",
    icon: SendIcon,
    badge: "Coming soon",
  },
  {
    id: "email",
    label: "Email",
    description: "Draft replies to incoming support emails.",
    icon: MailIcon,
    badge: "Coming soon",
  },
] as const;

const STEP_COPY: Record<number, { title: string; description: string }> = {
  1: {
    title: "How would you like to train your AI Agent?",
    description: "Pick a source and we'll pull in the content it needs to answer questions.",
  },
  2: {
    title: "Customize your agent's personality",
    description: "Give it a short brief on tone, scope, and when to hand off to a human.",
  },
  3: {
    title: "Where will you be deploying your AI agents?",
    description: "Pick the channels you'd like to reach — you can add more later.",
  },
};

export function NewAgentForm() {
  const router = useRouter();
  const [rawStep, setRawStep] = useQueryState("step", parseAsInteger.withDefault(1));
  const step = Math.min(Math.max(rawStep, 1), TOTAL_STEPS);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["website"]);

  const {
    control,
    register,
    handleSubmit,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { sourceType: "website", websiteUrl: "", systemPrompt: "" },
  });

  const goToStep = (next: number) => setRawStep(Math.min(Math.max(next, 1), TOTAL_STEPS));

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) goToStep(step + 1);
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels((current) =>
      current.includes(id) ? current.filter((channel) => channel !== id) : [...current, id],
    );
  };

  const onSubmit = async (values: OnboardingValues) => {
    try {
      const agent = await createAgent({
        name: deriveAgentName(values),
        system_prompt: values.systemPrompt,
      });

      if (values.sourceType === "website" && values.websiteUrl) {
        const url = `https://${stripProtocol(values.websiteUrl)}`;
        await fetch(`/api/agents/${agent.id}/sources`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: url, url }),
        }).catch(() => {});
      }

      router.push(`/agents/${agent.id}/sources`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError("root.serverError", { type: "server", message });
    }
  };

  const onInvalid: SubmitErrorHandler<OnboardingValues> = (formErrors) => {
    for (let candidate = 1; candidate <= TOTAL_STEPS; candidate++) {
      if (STEP_FIELDS[candidate].some((field) => formErrors[field])) {
        goToStep(candidate);
        return;
      }
    }
  };

  const copy = STEP_COPY[step];

  return (
    <div className="w-full space-y-6">
      <div className="space-y-3">
        <Progress value={(step / TOTAL_STEPS) * 100} aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
          <span className="text-xs font-medium text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
        </Progress>
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold tracking-wide">{copy.title}</h1>
          <p className="text-base text-muted-foreground">{copy.description}</p>
        </div>
      </div>

      {errors.root?.serverError && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.serverError.message}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {step === 1 && (
          <Controller
            control={control}
            name="sourceType"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="gap-3">
                <FieldLabel htmlFor="source-website">
                  <Field orientation="horizontal" className="items-start gap-3">
                    <RadioGroupItem value="website" id="source-website" className="mt-0.5" />
                    <FieldContent>
                      <FieldTitle>
                        <GlobeIcon className="size-4 shrink-0 text-muted-foreground" />
                        Your website
                        <Badge variant="secondary">Recommended</Badge>
                      </FieldTitle>
                      <FieldDescription>
                        We&apos;ll extract info from all pages in this domain to train your AI
                        Agent.
                      </FieldDescription>
                      {field.value === "website" && (
                        <div className="mt-2 space-y-1">
                          <InputGroup data-invalid={!!errors.websiteUrl}>
                            <InputGroupAddon align="inline-start">
                              <InputGroupText>https://</InputGroupText>
                            </InputGroupAddon>
                            <InputGroupInput
                              placeholder="www.example.com"
                              autoFocus
                              {...register("websiteUrl")}
                            />
                          </InputGroup>
                          <FieldError errors={[errors.websiteUrl]} />
                        </div>
                      )}
                    </FieldContent>
                  </Field>
                </FieldLabel>

                <FieldLabel htmlFor="source-other">
                  <Field orientation="horizontal" className="items-start gap-3">
                    <RadioGroupItem value="other" id="source-other" className="mt-0.5" />
                    <FieldContent>
                      <FieldTitle>
                        <FileStackIcon className="size-4 shrink-0 text-muted-foreground" />
                        Other sources
                      </FieldTitle>
                      <FieldDescription>Add Notion, Files, Text and more</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              </RadioGroup>
            )}
          />
        )}

        {step === 2 && (
          <Field data-invalid={!!errors.systemPrompt}>
            <FieldLabel htmlFor="system-prompt">What will your agent do?</FieldLabel>
            <Textarea
              id="system-prompt"
              rows={6}
              placeholder="Answer customer questions clearly and concisely. Stay polite and professional. Escalate billing or account issues to a human agent when unsure."
              autoFocus
              {...register("systemPrompt")}
            />
            <FieldError errors={[errors.systemPrompt]} />
          </Field>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CHANNELS.map((channel) => {
              const Icon = channel.icon;
              const checked = selectedChannels.includes(channel.id);
              return (
                <button
                  key={channel.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggleChannel(channel.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                    checked &&
                      "border-primary/30 bg-primary/5 dark:border-primary/20 dark:bg-primary/10",
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {channel.label}
                      <Badge variant={channel.badge === "Included" ? "secondary" : "outline"}>
                        {channel.badge}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{channel.description}</p>
                  </div>
                  {checked && <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => goToStep(step - 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Setting up…" : "Finish setup"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
