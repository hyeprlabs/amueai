import { draftMode } from "next/headers";

/** Shown on every page while Draft Mode is on, with a link back to published content. */
export async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950"
      role="status"
    >
      You are previewing draft content.
      <a className="underline underline-offset-2" href="/api/exit-preview">
        Exit preview
      </a>
    </div>
  );
}
