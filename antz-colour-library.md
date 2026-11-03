# ANTZ Colour Library: decisions (3 Nov 2026)

Figma file: Design system (rough), page "Colour library". Variables: "ANTZ Colour" (65 roles, 6 modes) and "ANTZ Palettes" (282 primitives, hidden from pickers). Gradient styles: "Gradients/Module/*" (5).

## Key colours
| Role | Key | Note |
|---|---|---|
| Primary | #37BD69 | brand green |
| Secondary | #00D9C7 | Master-Secondary teal |
| Tertiary | #1F415B | navy (replaces #B3C6D6 from the theme exports) |
| Error | #E93353 | |
| Neutral | #8F9E9C | Default grey |
| Neutral variant | #9FB2A7 | Primary (Green) sage |
| Success (ext) | hue 130, chroma 64, key #81B52E | hue shifted from neon #2FFF2A so it stays distinct from primary |
| Warning (ext) | #FA6140 | coral |
| Caution (ext) | #E4B819 | was "Alert" |
| Info (ext) | #00AFD6 | was "Sub-Secondary" |

## Filtered out
- Miscellaneous purple (#7D1BCA, #8479F9): 0 uses in the app.
- Neon success scale: replaced by the shifted hue.
- Near-duplicate shades (ΔE < 4) and the hand-picked 10-step scales: replaced by generated palettes.
- 17 gradients cut to 5: Green→Navy, Teal→Green, Cyan→Navy, Coral→Red, Yellow→Cyan.

## Generation
- Material Color Utilities 0.3.0, DynamicScheme with the Fidelity variant, contrast levels 0 / 0.5 / 1, light and dark. Each palette uses its key colour at full chroma.
- Brand colours appear as containers (e.g. Primary Container = #36BC69). Text and buttons use toned versions.
- Extended colours use the same role rules as primary (colour / on / container / on container).
- Role tones are rounded to whole numbers, and every role aliases a palette variable.
- Contrast: all 22 key pairs pass WCAG AA in all 6 modes. High contrast gives 9:1 or more on containers.
- Code syntax follows the Material Theme Builder CSS names: --md-sys-color-*, --md-extended-color-*, --md-ref-palette-*.

## Not done yet
- State layers (hover/pressed opacities).
- Typography, shape and elevation tokens.
- Components.
- Rebinding the earlier home-screen mockup, which still uses the "ANTZ MD3 · seed #37BD69" v1 collection.
- Removing the older collections ("material-theme", "ANTZ system design", v1) and the 1,593 paint styles from the Material Theme Builder plugin.
