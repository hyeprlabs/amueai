import { AgentFeatureCard } from "@/components/agent/feature-card";
import { ConversationsGraphic } from "@/components/agent/conversations-graphic";
import { EmbedGraphic } from "@/components/agent/embed-graphic";
import { GroundedChat } from "@/components/agent/grounded-chat";
import { LanguagesGraphic } from "@/components/agent/languages-graphic";
import { SourcesGraphic } from "@/components/agent/sources-graphic";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/full-width-divider";
import { SectionHeading } from "@/components/marketing/page-hero";

/**
 * The illustrated feature grid.
 *
 * One column on phones, two from `sm`, and a six-column bento from `lg` where
 * the two lead cards take half the row each and the three supporting cards take
 * a third. Every span is declared on the card so the grid stays one place.
 */
export function AgentFeatures() {
  return (
    <section className="mb-12 lg:mb-24">
      <SectionHeading
        description="Trained on your content, grounded in your sources, live wherever your customers are."
        title="How your agent works"
      />

      <div className="relative">
        <DecorIcon className="size-4" position="top-left" />
        <DecorIcon className="size-4" position="top-right" />
        <DecorIcon className="size-4" position="bottom-left" />
        <DecorIcon className="size-4" position="bottom-right" />

        <FullWidthDivider className="-top-px" />
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-6">
          <AgentFeatureCard
            className="lg:col-span-3"
            description="Websites, PDFs, docs, and Q&A pairs. Add a source and it is indexed in seconds."
            title="Train it on what you already have"
          >
            <SourcesGraphic />
          </AgentFeatureCard>

          <AgentFeatureCard
            className="lg:col-span-3"
            description="Every reply is pulled from your sources and cited. No source, no answer."
            title="It never makes things up"
          >
            <GroundedChat />
          </AgentFeatureCard>

          <AgentFeatureCard
            className="sm:col-span-2 lg:col-span-2"
            description="Paste one script tag. The chat bubble is live on every page."
            title="Live in one line"
          >
            <EmbedGraphic />
          </AgentFeatureCard>

          <AgentFeatureCard
            className="lg:col-span-2"
            description="Ask in any of 90+ languages and get the same answer from the same source."
            title="Speaks your customer's language"
          >
            <LanguagesGraphic />
          </AgentFeatureCard>

          <AgentFeatureCard
            className="lg:col-span-2"
            description="Read real questions, spot what your content is missing, and fill the gaps."
            title="See what people actually ask"
          >
            <ConversationsGraphic />
          </AgentFeatureCard>
        </div>
        <FullWidthDivider className="-bottom-px" />
      </div>
    </section>
  );
}
