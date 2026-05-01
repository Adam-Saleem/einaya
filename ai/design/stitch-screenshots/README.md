# Stitch Screenshots

Drop PNG / JPG screenshots of your Stitch screens here.

## What goes here

- Screenshots of full pages from Stitch
- Cropped detail shots (e.g. just the sidebar, just a button group)
- Component states (hover, active, disabled, error)

## Naming convention

```
stitch-screenshots/
  dashboard-full.png
  dashboard-sidebar-detail.png
  dashboard-stat-card.png
  patient-form-empty.png
  patient-form-filled.png
  patient-form-error.png
  appointments-calendar.png
  appointments-day-view.png
  ...
```

## Why screenshots in addition to HTML/CSS

- HTML can be visually noisy to read
- Screenshots are a fast visual reference for Claude (you can paste them directly into the chat)
- Detail crops let you reference specific elements without context noise

## How to use during development

When asking Claude to build a specific component:

> "Build the patient stat card for the dashboard. Match the visual style in `stitch-screenshots/dashboard-stat-card.png` (paste the image)."

Claude can see the image and implement to match.

## Light + Dark mode

If you generate dark-mode variants, suffix:
```
dashboard-full-light.png
dashboard-full-dark.png
```

This helps lock the dark mode token values when filling `tokens-worksheet.md`.
