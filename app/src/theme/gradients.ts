/**
 * The 5 ANTZ gradients from ANTZ_colour_library.json. Each stop names a palette and a tone, so under any theme
 * a gradient is rebuilt from the active theme's palette at the same tone. Primary, secondary and tertiary follow
 * the theme's key colours and style; error, info, warning and caution are fixed palettes in every theme.
 * Under ANTZ Library the JSON's exact stop colours are used. Pins do not change gradients: a pin moves a role's
 * tone, not the palette, and gradient stops sit at fixed tones.
 */
import { TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import { contrast } from './contrast';
import { library } from './library';
import { palette, type SlotId, type ThemeDef } from './themes';

export interface GradientStop { palette: string; tone: number; hex: string }
export interface Gradient { id: string; name: string; stops: GradientStop[] }

/** CSS angle for every gradient; the JSON gives none, and 135deg matches the module tiles. */
export const GRADIENT_ANGLE = 135;
export const gradientId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const GRADIENT_IDS = library.gradients.map((g) => gradientId(g.name));

const THEMED: Record<string, SlotId> = { primary: 'p', secondary: 's', tertiary: 't' };
const fixedKey = (name: string) => (name === 'error' ? library.coreColors.error : library.extendedColors.find((e) => e.name.toLowerCase() === name)?.color);

export function gradientsOf(theme: ThemeDef): Gradient[] {
  return library.gradients.map((g) => ({
    id: gradientId(g.name),
    name: g.name,
    stops: g.stops.map((s) => {
      if (theme.library) return { palette: s.palette, tone: s.tone, hex: s.color };
      const slot = THEMED[s.palette];
      const pal = slot ? palette(slot, theme.spec[slot], theme.spec.style) : TonalPalette.fromInt(argbFromHex(fixedKey(s.palette) ?? s.color));
      return { palette: s.palette, tone: s.tone, hex: hexFromArgb(pal.tone(s.tone)).toUpperCase() };
    }),
  }));
}

export const gradientCss = (g: Gradient) => `linear-gradient(${GRADIENT_ANGLE}deg, ${g.stops.map((s) => s.hex).join(', ')})`;

/** Text/icon colour for a button filled with this gradient: white or the darkest tone of the first stop's palette, whichever has the best worst-case contrast over all stops. */
export function onGradient(g: Gradient): { hex: string; worst: number } {
  const dark = hexFromArgb(TonalPalette.fromInt(argbFromHex(g.stops[0].hex)).tone(10)).toUpperCase();
  return ['#FFFFFF', dark]
    .map((hex) => ({ hex, worst: Math.min(...g.stops.map((s) => contrast(hex, s.hex))) }))
    .sort((a, b) => b.worst - a.worst)[0];
}

/** :root block with one --antz-gradient-<id> per gradient, for the page and the CSS export. */
export function buildGradientCss(gs: Gradient[]): string {
  return `:root {\n${gs.map((g) => `  --antz-gradient-${g.id}: ${gradientCss(g)};`).join('\n')}\n}`;
}

/** Gradients of the active theme, for exports. */
export let ACTIVE_GRADIENTS: Gradient[] = [];

/** Kept in its own <style> so the theme stylesheet (#antz-theme) is unchanged by gradients. */
export function applyGradientCss(gs: Gradient[]) {
  ACTIVE_GRADIENTS = gs;
  if (typeof document === 'undefined') return;
  let el = document.getElementById('antz-gradients');
  if (!el) { el = document.createElement('style'); el.id = 'antz-gradients'; document.head.appendChild(el); }
  const css = buildGradientCss(gs);
  if (el.textContent !== css) el.textContent = css;
}
