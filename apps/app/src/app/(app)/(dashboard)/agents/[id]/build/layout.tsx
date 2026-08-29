import { BuildTabsNav } from "./build-tabs-nav";

export default async function BuildLayout({
  children,
  params,
}: LayoutProps<"/agents/[id]/build">) {
  const { id } = await params;

  return (
    <div className="flex flex-col gap-4">
      <BuildTabsNav agentId={id} />
      {children}
    </div>
  );
}
