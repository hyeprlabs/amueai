"use client";

import { useTheme } from "next-themes";
import { CheckIcon, MinusIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";

const items = [
  { image: "/ui/light.png", label: "Light", value: "light" },
  { image: "/ui/dark.png", label: "Dark", value: "dark" },
  { image: "/ui/system.png", label: "System", value: "system" },
] as const;

type ThemeValue = (typeof items)[number]["value"];

export function ThemeSwitcher() {
  const id = useId();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeValue>("system");

  useEffect(() => {
    setMounted(true);
    if (theme === "light" || theme === "dark" || theme === "system") {
      setSelectedTheme(theme);
    }
  }, [theme]);

  const handleThemeChange = (value: string) => {
    if (value !== "light" && value !== "dark" && value !== "system") {
      return;
    }

    setSelectedTheme(value);
    setTheme(value);
  };

  return (
    <fieldset className="space-y-1">
      <legend className="font-medium text-foreground text-sm leading-none">Choose a theme</legend>
      <RadioGroup
        aria-label="Choose a theme"
        className="flex gap-3"
        disabled={!mounted}
        onValueChange={handleThemeChange}
        value={selectedTheme}
      >
        {items.map((item) => (
          <label
            className="group/theme-option inline-flex shrink-0 flex-col"
            key={`${id}-${item.value}`}
          >
            <RadioGroupItem
              className="peer sr-only after:absolute after:inset-0"
              disabled={!mounted}
              id={`${id}-${item.value}`}
              value={item.value}
            />
            {!mounted ? (
              <>
                <Skeleton className="block h-[70px] w-[88px] rounded-md" />
                <Skeleton className="mt-2 block h-4 w-12 rounded-sm" />
              </>
            ) : (
              <>
                <img
                  alt={item.label}
                  className={cn(
                    "relative block cursor-pointer overflow-hidden rounded-md border border-input shadow-xs outline-none transition-[border-color,box-shadow] peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50",
                    selectedTheme === item.value && "border-ring bg-accent ring-2 ring-ring/25",
                  )}
                  height={70}
                  src={item.image}
                  width={88}
                />
                <span
                  className={cn(
                    "mt-2 flex h-4 items-center gap-1",
                    selectedTheme === item.value ? "text-foreground" : "text-muted-foreground/70",
                  )}
                >
                  {selectedTheme === item.value ? (
                    <CheckIcon aria-hidden="true" className="size-4" size={16} />
                  ) : (
                    <MinusIcon aria-hidden="true" className="size-4" size={16} />
                  )}
                  <span className="font-medium text-xs">{item.label}</span>
                </span>
              </>
            )}
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
