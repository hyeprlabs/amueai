import { ComingSoonBadge } from "@/components/sheard";

/**
 * Shared stage for a not-yet-live channel: a dashed outline around the
 * channel's own icon, and the same `ComingSoonBadge` the nav uses, so a
 * channel that isn't live yet reads the same way here as it does in the nav.
 */
export function ComingSoonGraphic({ icon }: { icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full border border-dashed text-muted-foreground/60 [&_svg]:size-7"
      >
        {icon}
      </div>
      <ComingSoonBadge className="h-5 px-1.5 text-[11px]" />
    </div>
  );
}
