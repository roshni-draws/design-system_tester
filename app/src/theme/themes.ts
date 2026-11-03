/**
 * Colour themes built only from the ANTZ key colours.
 *
 * Each theme picks which key colour feeds the primary, secondary, tertiary, neutral and neutral-variant
 * tonal palettes, and a scheme style. The full 49-role scheme is generated for all 6 modes with
 * Material Color Utilities (DynamicScheme, contrast levels 0 / 0.5 / 1), the same recipe that produced
 * ANTZ_colour_library.json: HCT tonal palettes, error palette from the ANTZ error colour, role tones
 * rounded to whole numbers. Error and the extended colours (success, warning, caution, info) are fixed:
 * every theme takes them from the JSON unchanged. "ANTZ Library" is the JSON itself, untouched.
 */
import { DynamicScheme, Hct, MaterialDynamicColors, SchemeFidelity, SchemeTonalSpot, SchemeVibrant, TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import { contrast } from './contrast';
import { BASE_ROLES, EXT_ROLES, LIBRARY_COLORS, LIBRARY_THEME, SCHEME_KEYS, library, type ActiveTheme, type Colors, type Role, type SchemeKey } from './library';

export const KEY_COLOURS = [
  { id: 'green', name: 'Green', hex: library.coreColors.primary },
  { id: 'aqua', name: 'Aqua', hex: library.coreColors.secondary },
  { id: 'navy', name: 'Navy', hex: library.coreColors.tertiary },
  { id: 'grey', name: 'Grey', hex: library.coreColors.neutral },
  { id: 'sage', name: 'Sage', hex: library.coreColors.neutralVariant },
] as const;
export type KeyId = (typeof KEY_COLOURS)[number]['id'];
export const keyById = (id: KeyId) => KEY_COLOURS.find((k) => k.id === id)!;
export const isKeyId = (v: string | undefined): v is KeyId => KEY_COLOURS.some((k) => k.id === v);

export const STYLES = [
  { id: 'fidelity', name: 'Fidelity', hint: 'Each palette keeps its key colour at full chroma; neutrals are capped at chroma 16 so surfaces stay calm. The library uses this.' },
  { id: 'tonal', name: 'Tonal spot', hint: 'Softer: every palette at half its key colour’s chroma, so picks still show but quieter.' },
  { id: 'vibrant', name: 'Vibrant', hint: 'Louder: primary at the strongest chroma its hue allows, secondary and tertiary 30% stronger than their key colours.' },
] as const;
export type StyleId = (typeof STYLES)[number]['id'];
export const isStyleId = (v: string | undefined): v is StyleId => STYLES.some((s) => s.id === v);

export const SLOTS = [
  { id: 'p', name: 'Primary' },
  { id: 's', name: 'Secondary' },
  { id: 't', name: 'Tertiary' },
  { id: 'n', name: 'Neutral' },
  { id: 'nv', name: 'Neutral variant' },
] as const;
export type SlotId = (typeof SLOTS)[number]['id'];
/** Pinned shade per slot: the tone picked for the slot's main role in light mode, standard contrast. */
export type Pins = Partial<Record<SlotId, number>>;
export type ThemeSpec = Record<SlotId, KeyId> & { style: StyleId; pins?: Pins };

export interface ThemeDef { id: string; name: string; spec: ThemeSpec; library?: boolean }

export const LIBRARY_SPEC: ThemeSpec = { p: 'green', s: 'aqua', t: 'navy', n: 'grey', nv: 'sage', style: 'fidelity' };
const spec = (p: KeyId, s: KeyId, t: KeyId, style: StyleId = 'fidelity', n: KeyId = 'grey', nv: KeyId = 'sage'): ThemeSpec => ({ p, s, t, n, nv, style });

/**
 * The six arrangements of green / aqua / navy (the library is green, aqua, navy), plus two style variants.
 * Some presets also take a different neutral source so their surfaces differ, not only their accents.
 */
export const PRESETS: ThemeDef[] = [
  { id: 'antz-library', name: 'ANTZ Library', spec: LIBRARY_SPEC, library: true },
  { id: 'green-navy', name: 'Green and navy', spec: spec('green', 'navy', 'aqua') },
  { id: 'aqua-led', name: 'Aqua led', spec: spec('aqua', 'green', 'navy', 'fidelity', 'sage', 'grey') },
  { id: 'aqua-navy', name: 'Aqua and navy', spec: spec('aqua', 'navy', 'green') },
  { id: 'navy-led', name: 'Navy led', spec: spec('navy', 'green', 'aqua', 'fidelity', 'navy', 'grey') },
  { id: 'navy-aqua', name: 'Navy and aqua', spec: spec('navy', 'aqua', 'green', 'fidelity', 'grey', 'navy') },
  { id: 'soft-green', name: 'Soft green', spec: spec('green', 'aqua', 'navy', 'tonal', 'green', 'sage') },
  { id: 'vivid-aqua', name: 'Vivid aqua', spec: spec('aqua', 'navy', 'green', 'vibrant', 'aqua', 'navy') },
];
export const presetById = (id: string) => PRESETS.find((t) => t.id === id);

/**
 * Palette chroma per style, always relative to the picked key colour, so every pick stays visible.
 * (MCU's own SchemeTonalSpot / SchemeVibrant use fixed chromas such as neutral 6–10. That would make a
 * Neutral pick of aqua identical to grey, which shares its hue at chroma 10, so picks would vanish.)
 */
function styleChroma(style: Exclude<StyleId, 'fidelity'>, slot: SlotId, keyChroma: number): number {
  if (style === 'tonal') return keyChroma * 0.5;
  if (slot === 'p') return 200; // clamped by HCT to the most saturated colour at that hue and tone
  if (slot === 's' || slot === 't') return keyChroma * 1.3;
  return keyChroma; // vibrant neutrals keep the key's chroma
}
// The package does not export the Variant enum, so read it off the scheme classes.
type Variant = DynamicScheme['variant'];
const probe = Hct.fromInt(0xff000000);
const VARIANT: Record<StyleId, Variant> = {
  fidelity: new SchemeFidelity(probe, false, 0).variant,
  tonal: new SchemeTonalSpot(probe, false, 0).variant,
  vibrant: new SchemeVibrant(probe, false, 0).variant,
};

/** Neutral palettes are capped so a saturated key (aqua 54, green 62) tints surfaces without turning them vivid. */
const NEUTRAL_CAP: Record<StyleId, number> = { fidelity: 16, tonal: 16, vibrant: 24 };

export function palette(slot: SlotId, key: KeyId, style: StyleId) {
  const argb = argbFromHex(keyById(key).hex);
  const hct = Hct.fromInt(argb);
  const neutral = slot === 'n' || slot === 'nv';
  if (style === 'fidelity') {
    // Grey (10.4) and sage (13.1) sit under the cap, so the library's neutral palettes are untouched.
    if (neutral && hct.chroma > NEUTRAL_CAP.fidelity) return TonalPalette.fromHueAndChroma(hct.hue, NEUTRAL_CAP.fidelity);
    return TonalPalette.fromInt(argb);
  }
  const c = styleChroma(style, slot, hct.chroma);
  return TonalPalette.fromHueAndChroma(hct.hue, neutral ? Math.min(c, NEUTRAL_CAP[style]) : c);
}

const MODES: Record<SchemeKey, [boolean, number]> = Object.fromEntries(
  SCHEME_KEYS.map((k) => [k, [k.startsWith('dark'), k.includes('high') ? 1 : k.includes('medium') ? 0.5 : 0]]),
) as Record<SchemeKey, [boolean, number]>;

/** Roles that stay fixed in every theme (error + extended), always taken from the JSON. */
export const FIXED_ROLES: Role[] = ['error', 'onError', 'errorContainer', 'onErrorContainer', ...EXT_ROLES];

const cache = new Map<string, Colors>();
export const pinList = (s: ThemeSpec) => SLOTS.filter((x) => s.pins?.[x.id] !== undefined).map((x) => [x.id, s.pins![x.id]!] as const);
export const specKey = (s: ThemeSpec) => `${s.p}.${s.s}.${s.t}.${s.n}.${s.nv}.${s.style}${pinList(s).map(([k, v]) => `.${k}${v}`).join('')}`;

/** The tone steps of the JSON palettes block. */
export const TONES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100];

/**
 * Pinning: which roles a slot's shade moves, which role is its "main" one (the picked tone applies to it in
 * light standard), and which on-colours are re-chosen so text on it stays readable.
 * Neutral moves the whole surface ladder by the same offset so the steps between containers are kept.
 */
export const PIN_ROLES: Record<SlotId, { main: Role; moved: Role[]; on: Role[]; onLabel: string }> = {
  p: { main: 'primary', moved: ['primary', 'surfaceTint'], on: ['onPrimary'], onLabel: 'on-primary' },
  s: { main: 'secondary', moved: ['secondary'], on: ['onSecondary'], onLabel: 'on-secondary' },
  t: { main: 'tertiary', moved: ['tertiary'], on: ['onTertiary'], onLabel: 'on-tertiary' },
  n: {
    main: 'surface',
    moved: ['background', 'surface', 'surfaceDim', 'surfaceBright', 'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest'],
    on: ['onSurface', 'onBackground'], onLabel: 'on-surface',
  },
  nv: { main: 'outline', moved: ['outline', 'onSurfaceVariant'], on: [], onLabel: 'surface' },
};
/** Roles the 12 screens use as page or section backgrounds (Screen roots, Home header and feed, Medical, Lab, Administer, Collections). */
export const PAGE_ROLES: Role[] = ['background', 'surface', 'surfaceBright', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh'];
const ON_SOURCE: Partial<Record<Role, Role>> = { onPrimary: 'primary', onSecondary: 'secondary', onTertiary: 'tertiary', onSurface: 'surface', onBackground: 'background' };

type DC = typeof MaterialDynamicColors.primary;
const dcOf = (r: Role) => (MaterialDynamicColors as unknown as Record<string, DC>)[r];
const clampTone = (t: number) => Math.max(0, Math.min(100, Math.round(t)));

function schemeFor(s: ThemeSpec, palettes: Record<SlotId, TonalPalette>, isDark: boolean, contrastLevel: number) {
  const scheme = new DynamicScheme({
    sourceColorArgb: argbFromHex(keyById(s.p).hex), variant: VARIANT[s.style], contrastLevel, isDark,
    primaryPalette: palettes.p, secondaryPalette: palettes.s, tertiaryPalette: palettes.t, neutralPalette: palettes.n, neutralVariantPalette: palettes.nv,
  });
  scheme.errorPalette = TonalPalette.fromInt(argbFromHex(library.coreColors.error));
  return scheme;
}
const palettesOf = (s: ThemeSpec): Record<SlotId, TonalPalette> => ({ p: palette('p', s.p, s.style), s: palette('s', s.s, s.style), t: palette('t', s.t, s.style), n: palette('n', s.n, s.style), nv: palette('nv', s.nv, s.style) });

/** The default (unpinned) tone of a slot's main role in light mode, standard contrast: e.g. 40 for primary. */
export function defaultTone(s: ThemeSpec, slot: SlotId): number {
  const sch = schemeFor(s, palettesOf(s), false, 0);
  return Math.round(dcOf(PIN_ROLES[slot].main).getTone(sch));
}

const JSON_PALETTE: Record<KeyId, keyof typeof library.palettes> = { green: 'primary', aqua: 'secondary', navy: 'tertiary', grey: 'neutral', sage: 'neutral-variant' };
/** The shades shown in the picker: the slot's palette at the JSON tone steps (the JSON's exact hexes under Fidelity). */
export function shadesOf(slot: SlotId, key: KeyId, style: StyleId): { tone: number; hex: string }[] {
  const json = library.palettes[JSON_PALETTE[key]] as Record<string, string>;
  const pal = palette(slot, key, style);
  // The JSON's exact hexes only where this slot's palette is the JSON's palette (it is not once chroma is capped or styled).
  const same = json['50'] === hexFromArgb(pal.tone(50)).toUpperCase() && json['90'] === hexFromArgb(pal.tone(90)).toUpperCase();
  return TONES.map((tone) => ({ tone, hex: same && json[String(tone)] ? json[String(tone)] : hexFromArgb(pal.tone(tone)).toUpperCase() }));
}

export function generateColors(s: ThemeSpec): Colors {
  const key = specKey(s);
  const hit = cache.get(key);
  if (hit) return hit;
  const palettes = palettesOf(s);
  const pins = pinList(s);
  // Offset of each pin from its role's default tone in light standard; applied +delta in light, -delta in dark.
  const deltas = pins.map(([slot, tone]) => [slot, tone - defaultTone(s, slot)] as const);
  const std = schemeFor(s, palettes, false, 0);
  const lightStd = Object.fromEntries(BASE_ROLES.map((r) => [r, Math.round(dcOf(r).getTone(std))])) as Record<Role, number>;
  const out = {} as Colors;
  for (const k of SCHEME_KEYS) {
    const [isDark, contrastLevel] = MODES[k];
    const scheme = schemeFor(s, palettes, isDark, contrastLevel);
    const tones = {} as Record<Role, number>;
    const pals = {} as Record<Role, TonalPalette>;
    for (const r of BASE_ROLES) {
      const dc = dcOf(r);
      // Same rounding as the library export: whole-number tone, read from the role's palette.
      tones[r] = Math.round(dc.getTone(scheme));
      pals[r] = dc.palette(scheme);
    }
    for (const [slot] of deltas) {
      const spec = PIN_ROLES[slot];
      const T = s.pins![slot]!;
      if (slot === 'n') {
        // The picked shade is the page: every page and section background takes exactly T in light
        // (all contrast levels); cards and controls step away from it; dark mirrors around tone 52.
        const page = isDark ? clampTone(104 - T) : T;
        const darkish = page < 50;
        const away = (n: number) => clampTone(darkish ? page + n : page - n);
        const toward = (n: number) => clampTone(darkish ? page - n : page + n);
        for (const r of PAGE_ROLES) tones[r] = page;
        tones.surfaceContainerLowest = isDark ? toward(2) : (page >= 96 ? 100 : toward(4));
        tones.surfaceContainerHighest = away(8);
        tones.surfaceDim = away(10);
      } else {
        // Each moved role keeps its own offset, so in light standard every one of them is exactly T.
        for (const r of spec.moved) tones[r] = clampTone(tones[r] + (isDark ? -1 : 1) * (T - lightStd[r]));
      }
      // Re-choose each on-colour from its own palette: whichever standard on-tone reads better on the pinned colour.
      for (const on of spec.on) {
        const bg = hexFromArgb(pals[ON_SOURCE[on]!].tone(tones[ON_SOURCE[on]!]));
        const pick = (cands: number[]) => cands.map((t) => ({ t, c: contrast(hexFromArgb(pals[on].tone(t)), bg) })).sort((a, b) => b.c - a.c)[0];
        const light = slot === 'n' || slot === 'nv' ? [10, 90] : [100, 10];
        let best = pick(light);
        if (best.c < 4.5) best = pick([0, 100]);
        tones[on] = best.t;
      }
    }
    const flat = {} as Record<Role, string>;
    for (const r of BASE_ROLES) flat[r] = hexFromArgb(pals[r].tone(tones[r])).toUpperCase();
    for (const r of FIXED_ROLES) flat[r] = LIBRARY_COLORS[k][r];
    out[k] = flat;
  }
  cache.set(key, out);
  return out;
}

/** Lowest contrast, across the 6 modes, of a pinned slot's main role against its on-colour (or surface for outlines). */
export function pinContrast(s: ThemeSpec, slot: SlotId): { ratio: number; scheme: SchemeKey } {
  const c = generateColors(s);
  const spec = PIN_ROLES[slot];
  const fg: Role = slot === 'nv' ? 'onSurfaceVariant' : spec.on[0];
  const bg: Role = slot === 'nv' ? 'surface' : spec.main;
  return SCHEME_KEYS.map((k) => ({ ratio: contrast(c[k][fg], c[k][bg]), scheme: k })).sort((a, b) => a.ratio - b.ratio)[0];
}

export function colorsOf(t: ThemeDef): Colors {
  return t.library ? LIBRARY_COLORS : generateColors(t.spec);
}

export function metaOf(t: ThemeDef): ActiveTheme {
  if (t.library) return LIBRARY_THEME;
  const h = (id: KeyId) => keyById(id).hex;
  return {
    id: t.id, name: t.name, library: false,
    style: STYLES.find((x) => x.id === t.spec.style)!.name + pinList(t.spec).map(([k, v]) => `, ${SLOTS.find((x) => x.id === k)!.name.toLowerCase()} pinned to ${v}`).join(''),
    sources: { primary: h(t.spec.p), secondary: h(t.spec.s), tertiary: h(t.spec.t), neutral: h(t.spec.n), neutralVariant: h(t.spec.nv) },
  };
}

export function sameSpec(a: ThemeSpec, b: ThemeSpec) {
  return specKey(a) === specKey(b);
}

/** A custom theme, named after its arrangement. */
export function customTheme(s: ThemeSpec): ThemeDef {
  const n = (id: KeyId) => keyById(id).name.toLowerCase();
  return { id: 'custom', name: `Custom: ${n(s.p)}, ${n(s.s)}, ${n(s.t)}`, spec: s };
}

/** URL form: #theme=<preset id>, or #theme=custom&p=navy&s=green&t=aqua&n=grey&nv=sage&style=vibrant */
export function themeToHash(t: ThemeDef): string[] {
  if (t.id !== 'custom') return [`theme=${t.id}`];
  return ['theme=custom', ...SLOTS.map((x) => `${x.id}=${t.spec[x.id]}`), `style=${t.spec.style}`, ...pinList(t.spec).map(([k, v]) => `${k}t=${v}`)];
}

export function themeFromParams(q: Record<string, string | undefined>): ThemeDef | null {
  if (!q.theme) return null;
  if (q.theme !== 'custom') return presetById(q.theme) ?? null;
  const s = { ...LIBRARY_SPEC };
  for (const x of SLOTS) { const v = q[x.id]; if (isKeyId(v)) s[x.id] = v; }
  if (isStyleId(q.style)) s.style = q.style;
  // Pinned shades: &pt=60&st=…&tt=…&nt=…&nvt=…
  const pins: Pins = {};
  for (const x of SLOTS) {
    const v = q[`${x.id}t`];
    if (v !== undefined && /^\d{1,3}$/.test(v) && +v <= 100) pins[x.id] = +v;
  }
  if (Object.keys(pins).length) s.pins = pins;
  return customTheme(s);
}

/** "Green, aqua, navy": the primary, secondary and tertiary sources in words. */
export function sourcesLine(spec: ThemeSpec) {
  return `${keyById(spec.p).name}, ${keyById(spec.s).name.toLowerCase()}, ${keyById(spec.t).name.toLowerCase()}`;
}

/** Picks a preset if the spec matches one, so the URL stays short. */
export function themeForSpec(spec: ThemeSpec): ThemeDef {
  // Drop empty pin maps so an unpinned spec still matches its preset.
  const clean: ThemeSpec = pinList(spec).length ? spec : { p: spec.p, s: spec.s, t: spec.t, n: spec.n, nv: spec.nv, style: spec.style };
  return PRESETS.find((p) => sameSpec(p.spec, clean)) ?? customTheme(clean);
}
