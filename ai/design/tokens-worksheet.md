# Design Tokens Worksheet

> **Fill this from your Stitch screens before running Phase 6.**
> When done, copy values into `tokens-final.md` and into Phase 6's `app.css` and `tailwind.config.ts`.

---

## How to use this worksheet

1. Generate 2-3 Stitch screens for Einaya (suggested: dashboard, patient form, appointments calendar)
2. Open the screens in browser DevTools
3. Pick the colors using the eyedropper or Inspect → Computed Styles
4. Fill in the values below
5. Drop the Stitch HTML/CSS exports into `stitch-screens/`
6. Drop screenshots into `stitch-screenshots/`

---

## 1. Brand & Mood

**Brand keywords** (3-5 words describing the feel):
- e.g. trustworthy, calm, professional, modern, warm

```
Word 1: ___________
Word 2: ___________
Word 3: ___________
Word 4: ___________
Word 5: ___________
```

**References** (any visual inspirations from outside Stitch):
- ___________
- ___________

---

## 2. Color Tokens

Each token has a light-mode and dark-mode value.

Format: `oklch(L C H)` preferred (modern Tailwind), or `hsl()` / hex acceptable.

### Primary brand color
The dominant color. Used for primary buttons, key emphasis, active nav items.

| Token | Light | Dark |
|---|---|---|
| `primary` | _____ | _____ |
| `primary-foreground` (text on primary) | _____ | _____ |

### Secondary
Less prominent than primary. Used for secondary buttons.

| Token | Light | Dark |
|---|---|---|
| `secondary` | _____ | _____ |
| `secondary-foreground` | _____ | _____ |

### Accent
Hover/highlight states.

| Token | Light | Dark |
|---|---|---|
| `accent` | _____ | _____ |
| `accent-foreground` | _____ | _____ |

### Neutral surfaces

| Token | Light | Dark |
|---|---|---|
| `background` (page bg) | _____ | _____ |
| `foreground` (default text) | _____ | _____ |
| `card` | _____ | _____ |
| `card-foreground` | _____ | _____ |
| `popover` | _____ | _____ |
| `popover-foreground` | _____ | _____ |
| `muted` | _____ | _____ |
| `muted-foreground` | _____ | _____ |
| `border` | _____ | _____ |
| `input` (input border) | _____ | _____ |
| `ring` (focus ring) | _____ | _____ |

### Semantic / status colors

| Token | Light | Dark |
|---|---|---|
| `destructive` (errors, delete) | _____ | _____ |
| `destructive-foreground` | _____ | _____ |
| `success` (e.g. paid, completed) | _____ | _____ |
| `success-foreground` | _____ | _____ |
| `warning` (e.g. pending, late) | _____ | _____ |
| `warning-foreground` | _____ | _____ |
| `info` (e.g. confirmed, info) | _____ | _____ |
| `info-foreground` | _____ | _____ |

### Appointment status colors
Used by FullCalendar.

| Status | Color |
|---|---|
| pending | _____ |
| confirmed | _____ |
| arrived | _____ |
| in_progress | _____ |
| completed | _____ |
| cancelled | _____ |
| no_show | _____ |

---

## 3. Typography

### Font families

```
Latin (sans):   ___________ (e.g. Inter, Geist)
Arabic:         ___________ (e.g. Cairo, IBM Plex Sans Arabic, Tajawal)
Mono:           ___________ (e.g. JetBrains Mono, Geist Mono)
```

Source: Google Fonts? Local? Bunny Fonts?
```
___________
```

### Type scale

| Use | Class | Size | Line height | Weight |
|---|---|---|---|---|
| Display | `.text-display` | _____ | _____ | _____ |
| H1 | `.text-h1` | _____ | _____ | _____ |
| H2 | `.text-h2` | _____ | _____ | _____ |
| H3 | `.text-h3` | _____ | _____ | _____ |
| Body | `.text-base` | _____ | _____ | _____ |
| Small | `.text-sm` | _____ | _____ | _____ |
| Tiny | `.text-xs` | _____ | _____ | _____ |

---

## 4. Spacing & Sizing

shadcn defaults are usually fine. Override only if your Stitch screens use distinctive spacing.

```
Base unit:           _____ (default 4px)
Component padding:   _____ (default 16px)
Section padding:     _____ (default 24px)
```

---

## 5. Border Radius

| Token | Value |
|---|---|
| `radius-sm` | _____ |
| `radius` (default) | _____ |
| `radius-md` | _____ |
| `radius-lg` | _____ |
| `radius-xl` | _____ |

Suggestion: pick one identity:
- Sharp / professional: small radii (4-6px)
- Soft / friendly: medium radii (8-12px)
- Modern / playful: larger radii (12-16px)

---

## 6. Shadows

| Token | Value |
|---|---|
| `shadow-sm` | _____ |
| `shadow` | _____ |
| `shadow-md` | _____ |
| `shadow-lg` | _____ |

Or stick with shadcn defaults.

---

## 7. Component-Specific Notes

Anything in your Stitch screens that's unusual:

- Sidebar width: _____
- Topbar height: _____
- Card border style: _____
- Button heights (sm / default / lg): _____ / _____ / _____
- Input heights: _____
- Table row height: _____

---

## 8. Notes / Gotchas

(Free-form: anything else worth remembering for the implementer)

```
___________
___________
___________
```

---

## Done?

When this worksheet is filled:
- Copy values into `tokens-final.md`
- Run Phase 6 with `tokens-final.md` referenced in the prompt
- Drop Stitch sources into `stitch-screens/` and screenshots into `stitch-screenshots/`
