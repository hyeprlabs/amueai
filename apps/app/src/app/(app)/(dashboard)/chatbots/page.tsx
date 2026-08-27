import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { OrganizationSwitcher } from "@clerk/nextjs";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createChatbot } from "./actions";

export const metadata: Metadata = createMetadata({
  title: "Chatbots",
  description: "The chatbots trained on your data.",
  pathname: "/chatbots",
  noIndex: true,
});

export default async function ChatbotsPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8">
        <div>
          <h1 className="text-lg font-medium">Select or create a workspace</h1>
          <p className="text-sm text-muted-foreground">
            AmueAI workspaces are Clerk organizations. Pick one from the switcher to see its
            chatbots.
          </p>
        </div>
        <OrganizationSwitcher hidePersonal />
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: chatbots, error } = await supabase
    .from("chatbots")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
        Couldn&apos;t load chatbots: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Chatbots</h1>
        <p className="text-sm text-muted-foreground">
          Chatbots trained on your data, scoped to this workspace.
        </p>
      </div>

      <form action={createChatbot} className="flex items-center gap-2">
        <Input name="name" placeholder="e.g. Acme Support" required className="max-w-xs" />
        <Button type="submit">New chatbot</Button>
      </form>

      {chatbots.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
          No chatbots yet.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {chatbots.map((chatbot) => (
            <li key={chatbot.id}>
              <Link
                href={`/chatbots/${chatbot.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <span className="font-medium">{chatbot.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(chatbot.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
