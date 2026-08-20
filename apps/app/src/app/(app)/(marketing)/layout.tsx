import { cn } from "@/lib/utils";
import { Header } from "@/components/marketing/header"; // @efferd/header-2
import { Footer } from "@/components/footer";
import { Background } from "@/components/ui/bg";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-4 supports-[overflow:clip]:overflow-clip">
      <Background />

      <Header />
      <div
        className={cn(
          "relative mx-auto flex w-full max-w-4xl grow flex-col",
          // X Borders
          "before:absolute before:-inset-y-14 before:-left-px before:w-px before:bg-border",
          "after:absolute after:-inset-y-14 after:-right-px after:w-px after:bg-border",
        )}
      >
        {/* `main` and `footer` stay siblings so both keep their landmark roles. */}
        <main className="grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
