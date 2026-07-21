# Design System Components

Living documentation for Kadamba Phase 2 UI primitives.

## Theme

| Token | Value |
|-------|-------|
| Black | `#000000` |
| Gold | `#FFD700` |
| Cream | `#FFFDD0` |
| Heading | Playfair Display |
| Body | Inter |

Source of truth: `src/theme/designTokens.ts` + CSS in `src/index.css`.

## Components

Import from `@/components/ui`:

| Component | Purpose |
|-----------|---------|
| `Button` | primary, secondary, ghost, luxury |
| `Card` | default, image, pricing, service |
| `Input` / `Select` / `Checkbox` / `RadioGroup` | Forms |
| `Modal` / `Drawer` | Overlays |
| `ToastProvider` / `useToast` | Notifications |
| `Spinner` / `Progress` | Loading |
| `Breadcrumb` / `Pagination` | Navigation |
| `Section` / `SectionIntro` / `Heading` / `PageShell` | Layout & classic typography |

### Typography (mandatory)

- Use `SectionIntro` for section title + lede on every major page block
- Use `.text-lede` / `.text-measure` for readable line length (~38rem)
- **Never** set `--spacing-sm|md|lg|xl` in `@theme` — it breaks `max-w-sm|md|lg|xl` into tiny columns
- See `.cursor/rules/typography-layout.mdc`

## Preview

Run the app and open `/design-system`.

## Accessibility

- Focus-visible gold rings
- Modal focus trap + Escape
- `aria-*` on form errors, progress, toasts
- WCAG-oriented contrast on cream/black surfaces
