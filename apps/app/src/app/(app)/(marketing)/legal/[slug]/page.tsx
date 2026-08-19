import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { RichText } from "@payloadcms/richtext-lexical/react";
import config from "@payload-config";
import { cn } from "@/lib/utils";
import { FullWidthDivider } from "@/components/full-width-divider";
import { LegalDropdown } from "@/components/legal-dropdown";

type Params = { params: Promise<{ slug: string }> };

async function getLegalPage(slug: string) {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "legal-pages",
    where: { slug: { equals: slug } },
    limit: 1,
  });

  return docs[0];
}

export default async function LegalPage({ params }: Params) {
  const { slug } = await params;
  const page = await getLegalPage(slug);

  if (!page) notFound();

  return (
    <article className="my-12 lg:my-24">
      <div className="flex flex-col items-start gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{page.title}</h1>
        <LegalDropdown />
      </div>

      <RichText className="border-y p-4" data={page.content} />
    </article>
  );
}
