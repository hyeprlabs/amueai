import { cn } from "@/lib/utils";
import { Header } from "@/components/header"; // @efferd/header-2
import { Footer } from "@/components/footer";
import { Background } from "@/components/ui/bg";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-4 supports-[overflow:clip]:overflow-clip">
      <Background />
      <Background className="top-auto bottom-0 rotate-180" />

      <Header />
      <main
        className={cn(
          "relative mx-auto max-w-4xl grow",
          // X Borders
          "before:absolute before:-inset-y-14 before:-left-px before:w-px before:bg-border",
          "after:absolute after:-inset-y-14 after:-right-px after:w-px after:bg-border",
        )}
      >
        {children}
        <Footer />
      </main>
    </div>
  );
}
