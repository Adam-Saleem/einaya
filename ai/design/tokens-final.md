# Design Tokens — Final

> **Source:** Clinical Precision design system (Stitch — MedPrecision project), adapted for Einaya.
> **Status:** ✅ Filled. Ready for Phase 6.

---

## Brand Identity

- **Aesthetic:** Modern SaaS, Stripe-inspired, Clinical, Clean, Trustworthy
- **Reference:** Clinical Precision (Stitch / MedPrecision)
- **Density:** Spacious — prioritizes legibility for medical data
- **Personality keywords:** professional, clinical, precise, calm, premium

---

## 1. Color Tokens

### Light Mode

```css
:root {
  /* Surfaces */
  --background: #F9F9FF;             /* soft cool-tinted page background */
  --foreground: #0F172A;              /* deep slate body text */

  --card: #FFFFFF;                    /* pure white card surface */
  --card-foreground: #0F172A;

  --popover: #FFFFFF;
  --popover-foreground: #0F172A;

  /* Brand */
  --primary: #0066FF;                 /* MedPrecision Blue */
  --primary-foreground: #FFFFFF;

  --secondary: #4ADE80;               /* Clinical Green — supportive */
  --secondary-foreground: #052E14;

  /* Neutrals & accents */
  --muted: #F1F5F9;                   /* hover / ghost backgrounds */
  --muted-foreground: #64748B;        /* secondary labels, helpers */

  --accent: #DBEAFE;                  /* light blue selection wash */
  --accent-foreground: #0F172A;

  --border: #E2E8F0;                  /* card outlines, dividers */
  --input: #E2E8F0;                   /* input borders */
  --ring: #0066FF;                    /* focus ring (matches primary) */

  /* Functional / status */
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;

  --success: #22C55E;
  --success-foreground: #052E14;

  --warning: #F59E0B;
  --warning-foreground: #1F1300;

  --info: #0066FF;                    /* same as primary in this system */
  --info-foreground: #FFFFFF;

  /* Radius */
  --radius: 0.5rem;                   /* 8px — cards, inputs, buttons */
}
```

### Dark Mode

```css
.dark {
  /* Surfaces */
  --background: #0F172A;              /* deep slate-navy */
  --foreground: #F1F5F9;

  --card: #1E293B;                    /* elevated surface */
  --card-foreground: #F1F5F9;

  --popover: #1E293B;
  --popover-foreground: #F1F5F9;

  /* Brand */
  --primary: #3B82F6;                 /* slightly lifted blue for dark contrast */
  --primary-foreground: #FFFFFF;

  --secondary: #4ADE80;
  --secondary-foreground: #052E14;

  /* Neutrals & accents */
  --muted: #1E293B;
  --muted-foreground: #94A3B8;

  --accent: #1E3A8A;                  /* deep blue wash for selection */
  --accent-foreground: #DBEAFE;

  --border: #334155;
  --input: #334155;
  --ring: #3B82F6;

  /* Functional / status */
  --destructive: #F87171;
  --destructive-foreground: #1F0808;

  --success: #4ADE80;
  --success-foreground: #052E14;

  --warning: #FBBF24;
  --warning-foreground: #1F1300;

  --info: #3B82F6;
  --info-foreground: #FFFFFF;
}
```

### Appointment Status Colors (FullCalendar)

```css
:root {
  --status-pending: #94A3B8;          /* slate-gray */
  --status-confirmed: #0066FF;        /* primary blue */
  --status-arrived: #F59E0B;          /* warning amber */
  --status-in-progress: #8B5CF6;      /* violet — "active" */
  --status-completed: #22C55E;        /* success green */
  --status-cancelled: #EF4444;        /* destructive red */
  --status-no-show: #7F1D1D;          /* dark red */
}
```

---

## 2. Typography

### Font Families

```css
--font-sans: 'Manrope', system-ui, -apple-system, sans-serif;
--font-arabic: 'IBM Plex Sans Arabic', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

**Loading source:** Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
  rel="stylesheet"
>
```

### Type Scale (Tailwind config)

Base: **14px (0.875rem)** — high data density for medical records.

```javascript
// tailwind.config.ts → theme.extend.fontSize
fontSize: {
  // Base UI
  xs:   ['0.75rem',  { lineHeight: '1rem' }],         // 12px / 16px
  sm:   ['0.8125rem',{ lineHeight: '1.25rem' }],      // 13px / 20px
  base: ['0.875rem', { lineHeight: '1.5' }],          // 14px / 21px ← DEFAULT
  md:   ['1rem',     { lineHeight: '1.5rem' }],       // 16px / 24px

  // Headings (with tightened tracking)
  'h4':      ['1rem',     { lineHeight: '1.5rem',  fontWeight: '600' }],                              // 16px
  'h3':      ['1.125rem', { lineHeight: '1.625rem',fontWeight: '600' }],                              // 18px
  'h2':      ['1.5rem',   { lineHeight: '2rem',    fontWeight: '600', letterSpacing: '-0.02em' }],   // 24px
  'h1':      ['2.25rem',  { lineHeight: '2.5rem',  fontWeight: '700', letterSpacing: '-0.02em' }],   // 36px
  'display': ['3rem',     { lineHeight: '3.25rem', fontWeight: '700', letterSpacing: '-0.02em' }],   // 48px (optional)
}
```

### Weights

| Weight | Usage |
|---|---|
| `400` Regular | Body copy, table cells, secondary data |
| `500` Medium | Buttons, nav items, table headers |
| `600` Semi-bold | Subtitles, emphasized labels, h2/h3/h4 |
| `700` Bold | h1, page titles, brand elements |

---

## 3. Layout & Spacing

### Shell Dimensions

| Element | Value |
|---|---|
| Sidebar width (expanded) | `260px` |
| Sidebar width (collapsed) | `80px` (icon-only) |
| Top header height | `64px` (`h-16`) |
| Section gap (primary modules) | `32px` (`gap-8`) |
| Section gap (subsections) | `24px` (`gap-6`) |

### Component Dimensions

| Element | Value | Tailwind |
|---|---|---|
| Card padding | `24px` | `p-6` |
| Button height — sm | `32px` | `h-8` |
| Button height — md (default) | `44px` | `h-11` |
| Button height — lg | `56px` | `h-14` |
| Input height | `44px` | `h-11` |
| Table row height | comfortable, ~48px | (default Tailwind table) |
| Border weight | `1px` | `border` |

---

## 4. Border Radius

```javascript
// tailwind.config.ts → theme.extend.borderRadius
borderRadius: {
  none: '0',
  sm:   'calc(var(--radius) - 4px)',  // 4px
  DEFAULT: 'var(--radius)',            // 8px
  md:   'var(--radius)',               // 8px
  lg:   'calc(var(--radius) + 2px)',   // 10px
  xl:   'calc(var(--radius) + 4px)',   // 12px
  full: '9999px',
}
```

**Identity:** soft-but-precise (8px) — modern and approachable without feeling playful.

Applied uniformly across **cards, buttons, inputs, dialogs, badges**.

---

## 5. Shadows

Soft, layered, subtle — never heavy.

```javascript
// tailwind.config.ts → theme.extend.boxShadow
boxShadow: {
  sm:      '0 1px 2px 0 rgb(0 0 0 / 0.04)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
  md:      '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg:      '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  focus:   '0 0 0 3px rgb(0 102 255 / 0.25)',  // focus ring uses primary
}
```

Cards use `shadow-sm` by default; modals and popovers `shadow-md` or `shadow-lg`.

---

## 6. Iconography

- **Library:** `lucide-react`
- **Stroke weight:** `1.5px` (Lucide default)
- **Default size:** `20px` (UI actions, nav items, inline icons)
- **Section header size:** `24px`
- **Inline-with-text size:** `16px`

```tsx
import { User } from 'lucide-react';
<User className="size-5" strokeWidth={1.5} />   {/* 20px default */}
```

---

## 7. Density Principles

- **Base font 14px** — denser than 16px default but never cramped
- **Line height 1.5** — preserves breathability for long medical records
- **24px card padding** — standard "breathing room" inside containers
- **32px section gaps** — premium SaaS rhythm between major modules
- **1px borders + soft shadows** — definition without visual heaviness

---

## 8. Component-Specific Notes

### Navigation (Sidebar)
- Active item: **left border accent** in `--primary` + background `--accent` (light blue wash) + text in `--primary`
- Hover state: `--muted` background, no border accent
- In RTL (Arabic): the accent appears on the **right** edge — use `border-s-2` (logical property)

### Data Tables
- Clean rows, **1px horizontal divider** in `--border`
- Hover row: `--muted` background
- Status column: render via `<StatusBadge />` chip component
- Header: `font-medium`, `--muted-foreground`, uppercase optional
- First and last cell: extra padding (`px-6` vs default `px-4`)

### Forms
- Label **above** input
- Input: `h-11`, `rounded-md` (8px), `border-input`
- Focus: 3px ring in `--ring` (= primary)
- Error state: `border-destructive`, error message in `--destructive`

### Cards
- `bg-card` background
- `border` (1px in `--border`)
- `shadow-sm`
- `rounded-lg` (10px) OR `rounded-md` (8px) — consistent across the app, pick `rounded-lg` for slight elevation
- `p-6` internal padding

### Buttons
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
- Ghost: `text-foreground hover:bg-muted`
- Destructive: `bg-destructive text-destructive-foreground`
- All: `h-11`, `rounded-md`, `font-medium`, focus ring in `--ring`

---

## 9. CSS Variable Block (paste into `resources/css/app.css`)

> The space-separated RGB triplet format below works with shadcn/ui's `rgb(var(--token) / <alpha>)` pattern. If your shadcn init produced HSL format, convert each color and use `hsl(var(--token) / <alpha>)` in `tailwind.config.ts` instead. Either format works — pick one and stay consistent.

```css
@import 'tailwindcss';

@layer base {
  :root {
    --background: 248 248 255;       /* #F9F9FF */
    --foreground: 15 23 42;          /* #0F172A */
    --card: 255 255 255;
    --card-foreground: 15 23 42;
    --popover: 255 255 255;
    --popover-foreground: 15 23 42;
    --primary: 0 102 255;            /* #0066FF */
    --primary-foreground: 255 255 255;
    --secondary: 74 222 128;         /* #4ADE80 */
    --secondary-foreground: 5 46 20;
    --muted: 241 245 249;
    --muted-foreground: 100 116 139;
    --accent: 219 234 254;
    --accent-foreground: 15 23 42;
    --destructive: 239 68 68;
    --destructive-foreground: 255 255 255;
    --success: 34 197 94;
    --success-foreground: 5 46 20;
    --warning: 245 158 11;
    --warning-foreground: 31 19 0;
    --info: 0 102 255;
    --info-foreground: 255 255 255;
    --border: 226 232 240;
    --input: 226 232 240;
    --ring: 0 102 255;
    --radius: 0.5rem;

    /* Status (FullCalendar) */
    --status-pending: 148 163 184;
    --status-confirmed: 0 102 255;
    --status-arrived: 245 158 11;
    --status-in-progress: 139 92 246;
    --status-completed: 34 197 94;
    --status-cancelled: 239 68 68;
    --status-no-show: 127 29 29;
  }

  .dark {
    --background: 15 23 42;
    --foreground: 241 245 249;
    --card: 30 41 59;
    --card-foreground: 241 245 249;
    --popover: 30 41 59;
    --popover-foreground: 241 245 249;
    --primary: 59 130 246;
    --primary-foreground: 255 255 255;
    --secondary: 74 222 128;
    --secondary-foreground: 5 46 20;
    --muted: 30 41 59;
    --muted-foreground: 148 163 184;
    --accent: 30 58 138;
    --accent-foreground: 219 234 254;
    --destructive: 248 113 113;
    --destructive-foreground: 31 8 8;
    --success: 74 222 128;
    --success-foreground: 5 46 20;
    --warning: 251 191 36;
    --warning-foreground: 31 19 0;
    --info: 59 130 246;
    --info-foreground: 255 255 255;
    --border: 51 65 85;
    --input: 51 65 85;
    --ring: 59 130 246;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
    font-size: 0.875rem;     /* 14px base */
    line-height: 1.5;
  }

  html[lang="ar"] body {
    font-family: var(--font-arabic);
  }
}
```

---

## 10. tailwind.config.ts Extensions

```typescript
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
import rtl from 'tailwindcss-rtl';

export default {
  darkMode: 'class',
  content: [
    './resources/**/*.{js,ts,jsx,tsx,blade.php}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          foreground: 'rgb(var(--info-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        sans:   ['Manrope', 'system-ui', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono:   ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs:        ['0.75rem',   { lineHeight: '1rem' }],
        sm:        ['0.8125rem', { lineHeight: '1.25rem' }],
        base:      ['0.875rem',  { lineHeight: '1.5' }],
        md:        ['1rem',      { lineHeight: '1.5rem' }],
        'h4':      ['1rem',      { lineHeight: '1.5rem',   fontWeight: '600' }],
        'h3':      ['1.125rem',  { lineHeight: '1.625rem', fontWeight: '600' }],
        'h2':      ['1.5rem',    { lineHeight: '2rem',     fontWeight: '600', letterSpacing: '-0.02em' }],
        'h1':      ['2.25rem',   { lineHeight: '2.5rem',   fontWeight: '700', letterSpacing: '-0.02em' }],
        'display': ['3rem',      { lineHeight: '3.25rem',  fontWeight: '700', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        sm:   'calc(var(--radius) - 4px)',
        DEFAULT: 'var(--radius)',
        md:   'var(--radius)',
        lg:   'calc(var(--radius) + 2px)',
        xl:   'calc(var(--radius) + 4px)',
      },
      boxShadow: {
        sm:    '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        md:    '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        lg:    '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        focus: '0 0 0 3px rgb(0 102 255 / 0.25)',
      },
      spacing: {
        sidebar:           '260px',
        'sidebar-collapsed': '80px',
        header:            '64px',
      },
    },
  },
  plugins: [
    animate,
    rtl,
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
```

---

## Source References

- `colors.txt` — Clinical Precision palette
- `design.txt` — Full design system specification (MedPrecision)
- `fonts.txt` — Manrope + IBM Plex Sans Arabic typography
- `shadows.txt` — Soft layered shadow style
- `spaces.txt` — Sidebar 260/80, header 64, card padding 24, button heights 32/44/56

---

## Adaptation Notes for Einaya

The source system is "MedPrecision." For Einaya:
- **Brand color stays `#0066FF`** — universally trustworthy in medical contexts; matches Einaya's professional positioning
- **Arabic font is `IBM Plex Sans Arabic`** — perfect for Palestinian clinic UI
- **8px radius** is kept — modern but not playful, appropriate for medical SaaS
- **Manrope** is kept — excellent for both data density (table cells, form labels) and headings
- **No structural changes** — the system was designed for the same use case

If after Phase 6 you want a more "Einaya-distinct" identity, the only token to change is `--primary` (and update `--ring`, `--info`, `--status-confirmed` to match). Everything else is universal.