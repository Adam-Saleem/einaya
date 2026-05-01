# Stitch Screens

Drop your Stitch HTML/CSS exports here.

## What goes here

- HTML files exported from Google Stitch
- Their accompanying CSS files
- Any image assets they reference

## Suggested screens to generate

For Einaya's design language to be locked in, generate at minimum:

1. **Dashboard** (`dashboard.html`) — sets stat cards, layout proportions, sidebar styling
2. **Patient form** (`patient-form.html`) — sets form input styling, modal styling
3. **Appointments calendar** (`appointments.html`) — sets calendar look, status colors
4. **Patient profile** (`patient-profile.html`) — sets tabs, header card, content layout

Optional:
5. **Forms list / builder** (`form-builder.html`)
6. **Login** (`login.html`) — sets auth page identity

## What we use them for

- **Visual reference only** — we do NOT copy Stitch code into the project
- Extract colors → fill `tokens-worksheet.md`
- Extract typography scale → fill `tokens-worksheet.md`
- Extract proportions and spacing → inform shadcn customization
- Compare implemented pages back to Stitch to verify visual consistency

## Why we don't copy Stitch code

- Stitch outputs static HTML/CSS, not React components
- Stitch doesn't know about shadcn, Tailwind logical properties, RTL, dark mode
- Re-implementing in shadcn produces cleaner, maintainable code

## Naming convention

```
stitch-screens/
  dashboard.html
  dashboard.css
  patient-form.html
  patient-form.css
  appointments.html
  appointments.css
  ...
```

If a screen has multiple states (e.g. dashboard light + dark), suffix:
```
dashboard-light.html
dashboard-dark.html
```
