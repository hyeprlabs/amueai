import { SettingsTabs } from "@/components/dashboard/settings-tabs";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your preferences.</p>
      </header>
      <SettingsTabs />
      {children}
    </div>
  );
}
