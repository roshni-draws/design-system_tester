# ANTZ Theme Tester

A previewer for the ANTZ design system colours. It renders 12 screens recreated from the ANTZ mobile app in all six colour modes: light and dark at standard, medium and high contrast. It is laid out like Google's Material Theme Builder but uses only ANTZ colours.

## Run

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in app/dist/, can be hosted anywhere
```

The app reads `ANTZ_colour_library.json` from this folder, so editing the JSON updates the app.

## Features

- **Themes:** 8 presets plus custom primary, secondary, tertiary, neutral and neutral-variant picks. Picks are limited to the ANTZ key colours. Error, success, warning, caution and info stay fixed.
- **Shades:** pin any role to a tone of its palette.
- **Gradients:** the 5 ANTZ gradients follow the active theme. Apply them to buttons or to any element, scoped to one element, all elements like it, or every element using a role.
- **Views:** light and dark side by side, all 6 modes, or all themes.
- **Contrast:** an AA/AAA audit of every text and icon pair, checked live.
- **Inspect drawer:** role list, role mapping per screen, and an element inspector.
- **Export:** CSS variables, Tailwind v4, JSON and Flutter.
- **Colour rules and Colour scale:** two top-bar sheets: draft usage rules with live Do/Don't examples, and the whole JSON (key colours, tonal palettes, all 6 schemes, gradients) shown visually, with click-to-copy hex values. Deep links: `#panel=rules`, `#panel=scale`.
- **Shareable links:** the URL hash holds the full state, for example `#theme=navy-led&compare=themes`.

## Folder

| Path | Contents |
|---|---|
| `app/` | Vite + React + TypeScript app |
| `ANTZ_colour_library.json`, `antz-colour-library.md` | Colour source of truth |
| `screen samples/` | Original app screenshots the screens were recreated from |
| `wireframe/` | First low-fidelity wireframe |
| `app/public/images/CREDITS.md` | Image sources and licences |
