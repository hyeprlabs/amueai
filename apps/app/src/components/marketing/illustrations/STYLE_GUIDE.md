# AmueAI Illustration Style Guide

## Visual Language

### Geometric Foundation
- **Style**: Geometric, structured, and modern
- **Dimensionality**: Flat design with subtle depth through shadows and borders
- **Detail Level**: Minimal—only essential elements, no unnecessary decoration
- **Abstraction**: Semi-abstract/semi-representational (communicate concepts through simplified forms)

### Line Style
- **Stroke Weight**: Consistent `1px` borders for interactive elements, `2px` for emphasis
- **Corners**: Rounded corners: `4px` for small elements, `8px` for cards/containers
- **Endpoints**: Rounded caps for decorative lines
- **Color**: Use border color from accent palette

### Hierarchy & Scale
- Primary elements: `56px` to `64px` (hero icons, interactive tiles)
- Secondary elements: `32px` to `40px` (supporting icons, data points)
- Tertiary elements: `16px` to `24px` (indicators, badges)
- Text: Maintain consistent `text-[10px]` to `text-[11px]` for captions

## Color System

### Accent Usage
- **Blue** (`accents.blue`): Core interactions, data retrieval, intelligent features
  - Text: `text-blue-600 dark:text-blue-400`
  - Fill: `bg-blue-500`
  - Border: `border-blue-500/30`
  - Tint: `bg-blue-500/10`

- **Emerald** (`accents.emerald`): Success, positive metrics, growth
  - Use for "answered" states, completed actions
  - Fill: `bg-emerald-500`
  - Border: `border-emerald-500/30`

- **Rose** (`accents.rose`): Gaps, pending, areas for improvement
  - Use for gaps, unanswered, incomplete states
  - Fill: `bg-rose-500`
  - Border: `border-rose-500/30`

- **Violet** (`accents.violet`): Integration, embedding, custom solutions
  - Use for code snippets, integrations
  - Text: `text-violet-600 dark:text-violet-400`
  - Fill: `bg-violet-500`

- **Amber** (`accents.amber`): Localization, variety, options
  - Use for language selection, diverse content
  - Text: `text-amber-600 dark:text-amber-400`

### Dark Mode
- All illustrations support dark mode through Tailwind's `dark:` variant
- Accent colors automatically adjust: lighter shades in dark mode
- Background adapts to `bg-background` or `bg-card` context

## Animation Standards

### Performance
- All animations use Framer Motion with `useReducedMotion` for accessibility
- Duration: `0.3s` for quick interactions, `0.6s` for feature flows, `2-4s` for loops
- Easing: `easeInOut` for smooth transitions, `easeOut` for exits, `backOut` for pop-in effects

### Animation Patterns
1. **Scale**: Use for emphasis on active items (active source in SourcesGraphic)
   - Scale: `1 → 1.1` with 0.3s duration
2. **Opacity**: Use for transitions between states (LanguagesGraphic phrases)
   - Opacity: `0 → 1` on enter, `1 → 0` on exit with 0.3s
3. **Sweep**: Use for progressive reveals (EmbedGraphic code sweep)
   - X translation: `-30% → 130%` with 4s loop
4. **Pulse/Ring**: Use for attention (EmbedGraphic bubble ring)
   - Scale: `1 → 1.6` with opacity fade, 2s repeat delay
5. **Stagger**: Use for sequential reveals (ConversationsGraphic bars)
   - Delay: `index * 0.08s` for cascading effect

### Accessibility
- Always wrap animated content with `!reduced &&` check
- Provide static default state for `prefers-reduced-motion`
- Use `useReducedMotion()` hook on all animations
- Animate only visual properties (opacity, scale, position), not layout

## Component Guidelines

### Spacing & Sizing
- Container max-width: `max-w-[15rem]` (mobile) to `max-w-[17rem]` (tablet)
- Gap between elements: `gap-2` (mobile) to `gap-3` (tablet/desktop)
- Padding: `px-2.5 py-1.5` for compact text blocks, `px-3 py-2` for spacious
- Vertical separator height: `h-4` with `w-px` stroke

### Text Treatment
- Font sizes: `text-[10px]` to `text-[11px]` for captions
- Font family: `font-mono` for code/technical content
- Color: `text-muted-foreground` for secondary/neutral text
- All text must pass WCAG contrast ratios

### Interactive Elements
- Use `IconTile` component (from `@/components/ui/icon-tile`) for icon containers
- Size variants: `size="sm"` (32px), `size="lg"` (64px)
- Variant: `"frame"` for borders, `"soft"` for tinted backgrounds
- Add `aria-hidden="true"` for purely decorative graphics
- Include `transition-colors duration-300` for color changes

## Implementation Standards

### File Structure
- All illustrations live in `/components/marketing/illustrations/`
- Each exported as named function: `export function GraphicName() { ... }`
- Single export per file
- Import accents from local `./accent`

### Required Imports
```tsx
"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { [icons] } from "lucide-react";
import { accents } from "./accent";
import { [components] } from "@/components/...";
import { cn } from "@/lib/utils";
```

### Export Pattern
```tsx
export function NameGraphic() {
  const reduced = useReducedMotion();
  // ...
  return (
    <div className="flex w-full max-w-[15rem] flex-col ... sm:max-w-[17rem]">
      {/* content */}
    </div>
  );
}
```

## When to Use Each Illustration

- **SourcesGraphic**: Show data sources in training/knowledge base context
- **EmbedGraphic**: Demonstrate embed/integration simplicity
- **ConversationsGraphic**: Showcase improving metrics (answers increasing, gaps decreasing)
- **LanguagesGraphic**: Demonstrate multilingual AI capability
- **GroundedChat**: Show the full conversation flow with grounding/retrieval

## Best Practices

✅ **DO**
- Keep illustrations focused on one concept
- Use consistent stroke weights and rounded corners
- Animate with purpose (draws attention or explains flow)
- Test in both light and dark modes
- Respect `prefers-reduced-motion`
- Use semantic colors (emerald = good, rose = attention, blue = action)

❌ **DON'T**
- Use unnecessary details or decorative elements
- Mix illustration styles within a section
- Animate multiple properties simultaneously (keeps it simple)
- Ignore dark mode contrast
- Use illustrations to convey critical information alone
- Add comments that aren't essential (code should be self-documenting)
