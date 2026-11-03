/**
 * ANTZ colour library, loaded straight from the single source of truth:
 * ../ANTZ_colour_library.json (one folder above the app). Nothing here is hand-copied.
 */
import raw from '../../../ANTZ_colour_library.json';

export const library = raw;

export type SchemeKey = keyof typeof raw.schemes;
export type BaseRole = keyof typeof raw.schemes.light;
type ExtKey = keyof typeof raw.extendedSchemes.light;
type Cap<S extends string> = Capitalize<S>;
export type ExtRole = ExtKey | `on${Cap<ExtKey>}` | `${ExtKey}Container` | `on${Cap<ExtKey>}Container`;
export type Role = BaseRole | ExtRole;

export const SCHEME_KEYS = Object.keys(raw.schemes) as SchemeKey[];

export function schemeLabel(k: SchemeKey): string {
  const [mode, contrast] = k.split(/-(.*)/s);
  const m = mode.charAt(0).toUpperCase() + mode.slice(1);
  if (!contrast) return `${m} · Standard`;
  return `${m} · ${contrast.replace('-contrast', '').replace(/^./, (c) => c.toUpperCase())}`;
}

export function schemeKeyFor(mode: 'light' | 'dark', contrast: '' | 'medium' | 'high'): SchemeKey {
  return (contrast ? `${mode}-${contrast}-contrast` : mode) as SchemeKey;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Extended colour names as given in the JSON (e.g. success, warning). */
export const EXT_KEYS = Object.keys(raw.extendedSchemes.light) as ExtKey[];

export const EXT_ROLE_GROUPS: { name: string; key: ExtKey; roles: [ExtRole, ExtRole, ExtRole, ExtRole] }[] = EXT_KEYS.map((k) => ({
  name: cap(k),
  key: k,
  roles: [k, `on${cap(k)}`, `${k}Container`, `on${cap(k)}Container`] as [ExtRole, ExtRole, ExtRole, ExtRole],
}));

export const BASE_ROLES = Object.keys(raw.schemes.light) as BaseRole[];
export const EXT_ROLES: ExtRole[] = EXT_ROLE_GROUPS.flatMap((g) => g.roles);
export const ALL_ROLES: Role[] = [...BASE_ROLES, ...EXT_ROLES];

export type Colors = Record<SchemeKey, Record<Role, string>>;

/** Flattened hex lookup straight from the JSON: LIBRARY_COLORS[scheme][role] -> '#RRGGBB' for all 65 roles. */
export const LIBRARY_COLORS = Object.fromEntries(
  SCHEME_KEYS.map((k) => {
    const flat: Record<string, string> = { ...raw.schemes[k] };
    const ext = raw.extendedSchemes[k] as Record<string, { color: string; onColor: string; colorContainer: string; onColorContainer: string }>;
    for (const name of Object.keys(ext)) {
      const e = ext[name];
      flat[name] = e.color;
      flat[`on${cap(name)}`] = e.onColor;
      flat[`${name}Container`] = e.colorContainer;
      flat[`on${cap(name)}Container`] = e.onColorContainer;
    }
    return [k, flat as Record<Role, string>];
  }),
) as Colors;

/** What the active colours are, for labels and exports. */
export interface ActiveTheme { id: string; name: string; library: boolean; sources: Record<'primary' | 'secondary' | 'tertiary' | 'neutral' | 'neutralVariant', string>; style: string }

export const LIBRARY_THEME: ActiveTheme = {
  id: 'antz-library', name: 'ANTZ Library', library: true, style: 'Fidelity',
  sources: { primary: raw.coreColors.primary, secondary: raw.coreColors.secondary, tertiary: raw.coreColors.tertiary, neutral: raw.coreColors.neutral, neutralVariant: raw.coreColors.neutralVariant },
};

/**
 * The colours of the active theme. A live binding: every import sees the new value after setActiveColors().
 * Defaults to the JSON's exact values (the "ANTZ Library" theme).
 */
export let COLORS: Colors = LIBRARY_COLORS;
export let ACTIVE: ActiveTheme = LIBRARY_THEME;

export function setActiveColors(colors: Colors, meta: ActiveTheme) {
  COLORS = colors;
  ACTIVE = meta;
}

export const hex = (scheme: SchemeKey, role: Role): string => COLORS[scheme][role];

export const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
export const varName = (role: Role) => `--antz-${kebab(role)}`;
export const cssVar = (role: Role) => `var(${varName(role)})`;
export const isRole = (s: string): s is Role => (ALL_ROLES as string[]).includes(s);
export const isExtRole = (role: Role) => (EXT_ROLES as string[]).includes(role);

/** Material Theme Builder style name, used in the inspector snippet and exports. */
export function mdName(role: Role): string {
  const g = EXT_ROLE_GROUPS.find((x) => (x.roles as string[]).includes(role));
  if (!g) return `--md-sys-color-${kebab(role)}`;
  const suffix = ['color', 'on-color', 'color-container', 'on-color-container'][g.roles.indexOf(role as ExtRole)];
  return `--md-extended-color-${g.key}-${suffix}`;
}
