/**
 * "ANTZ theme file" export: the colour theme (Build your own parts, or a preset) and the font family as one JSON file,
 * <slug>.antz-theme.json, read by the foundation site's importer.
 *
 * The shape is a fixed contract shared with that importer (format "antz-theme", version 1). Do not rename or drop keys;
 * add new ones only with a version bump.
 */
import { ALL_ROLES, type Role } from './library';
import { GROUPS, PARTS, greyColors, type BuildColours, type BuildMode, type Part } from './build';
import { colorsOf, type ThemeDef } from './themes';
import { CATEGORIES, DEFAULT_FAMILY, FONT_TARGETS, TYPE_ROLES, familyByName, fontOf, loadFontList, roleWeights, type FontMode, type TypeFonts, type TypeRole } from './fonts';
import type { ExportFile } from './exporters';

type Hex = string;
interface FontPick { family: string; weight: number | null }
export interface AntzThemeFile {
  format: 'antz-theme';
  version: 1;
  name: string;
  slug: string;
  createdAt: string;
  source: { app: 'design-system-previewer'; hash: string };
  colors: {
    base: string;
    parts: Record<BuildMode, Record<string, Hex>>;
    partCatalog: { id: string; label: string; group: string; roles: Role[]; scope: 'element' | 'screen' }[];
    roles: Record<BuildMode, Record<string, Hex>>;
  };
  fonts: {
    mode: FontMode;
    allText: FontPick | null;
    roles: Record<TypeRole, FontPick | null>;
    resolved: Record<TypeRole, { family: string; weights: number[] }>;
    categories: Record<string, string>;
  };
}

/** Lowercase, hyphenated: "Sunset at 6!" -> "sunset-at-6". */
export const slugify = (name: string) =>
  name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'theme';

const up = (h: string) => `#${h.replace(/^#/, '').toUpperCase()}`;

/** A part acts theme-wide when one of its rules sits on the screen root (sel ''): it re-declares the role for the whole screen. */
const isScreenWide = (p: Part) => p.rules.some((r) => !r.sel);
const rolesOf = (p: Part) => [...new Set(p.rules.flatMap((r) => r.roles))];

/**
 * One primary owner per role for element-scoped parts, used only for the flattened M3 `roles` map.
 * Screen-wide parts (Page background, the text parts, Dividers, Status colours) always win for their roles, so they are
 * not listed. Where several element parts share a role, the owner is the part whose elements best match what that role
 * means in M3:
 *  - surfaceContainerLowest -> cards (the M3 card surface; status bar, app bar, chips, tabs also use it, but cards dominate)
 *  - surfaceContainerLow    -> sections
 *  - surfaceContainerHighest-> inputs (M3 filled text fields and search bars sit on it)
 *  - surfaceVariant         -> images
 *  - primaryContainer / onPrimaryContainer     -> btnPrimary / btnPrimaryContent (the FAB, as in M3)
 *  - secondaryContainer / onSecondaryContainer -> avatars / avatarContent (tonal tiles; the swatch role of that part)
 *  - secondary -> modTiles (first colour of the module tiles); onPrimary -> modTileContent
 *  - tertiaryContainer / onTertiary -> chipSelected / chipSelectedContent (the pair M3 uses for a selected tertiary chip)
 *  - inverseSurface / inverseOnSurface / inversePrimary -> feature / featureContent (feature panels, not photo overlays)
 *  - errorContainer, cautionContainer (+ their on- roles) -> alert / alertContent (banners, the larger surface)
 *  - infoContainer, warningContainer (+ on- roles), onSecondary -> badges / badgeContent
 *  - scrim -> scrim
 * Any other role an element part sets falls back to the first element part in PARTS order that lists it.
 */
const ROLE_OWNERS: Partial<Record<Role, string>> = {
  surfaceContainerLowest: 'cards',
  surfaceContainerLow: 'sections',
  surfaceContainerHighest: 'inputs',
  surfaceVariant: 'images',
  primaryContainer: 'btnPrimary',
  onPrimaryContainer: 'btnPrimaryContent',
  secondaryContainer: 'avatars',
  onSecondaryContainer: 'avatarContent',
  secondary: 'modTiles',
  onPrimary: 'modTileContent',
  tertiaryContainer: 'chipSelected',
  onTertiary: 'chipSelectedContent',
  inverseSurface: 'feature',
  inverseOnSurface: 'featureContent',
  inversePrimary: 'featureContent',
  errorContainer: 'alert',
  onErrorContainer: 'alertContent',
  cautionContainer: 'alert',
  onCautionContainer: 'alertContent',
  infoContainer: 'badges',
  onInfoContainer: 'badgeContent',
  warningContainer: 'badges',
  onWarningContainer: 'badgeContent',
  onSecondary: 'badgeContent',
  scrim: 'scrim',
};

/** Role -> owning part id, for every role some part sets. */
function roleOwners(): Map<Role, string> {
  const out = new Map<Role, string>();
  for (const p of PARTS) if (isScreenWide(p)) for (const r of rolesOf(p)) if (!out.has(r)) out.set(r, p.id);
  for (const [r, id] of Object.entries(ROLE_OWNERS) as [Role, string][]) if (!out.has(r)) out.set(r, id);
  for (const p of PARTS) if (!isScreenWide(p)) for (const r of rolesOf(p)) if (!out.has(r)) out.set(r, p.id);
  return out;
}

function catalog(): AntzThemeFile['colors']['partCatalog'] {
  return PARTS.map((p) => ({
    id: p.id, label: p.label, group: GROUPS.find((g) => g.id === p.group)!.label, roles: rolesOf(p),
    scope: isScreenWide(p) ? 'screen' : 'element',
  }));
}

/** Flattened M3 roles per mode (standard contrast): presets use their generated scheme; Build your own its parts on the grey base. */
function flatRoles(theme: ThemeDef, build: BuildColours): AntzThemeFile['colors']['roles'] {
  const out = { light: {}, dark: {} } as AntzThemeFile['colors']['roles'];
  if (!theme.build) {
    const c = colorsOf(theme);
    for (const m of ['light', 'dark'] as const) for (const r of ALL_ROLES) out[m][r] = up(c[m][r]);
    return out;
  }
  const grey = greyColors();
  const owners = roleOwners();
  for (const m of ['light', 'dark'] as const) {
    for (const r of ALL_ROLES) {
      const owner = owners.get(r);
      const picked = owner ? build[m][owner] : undefined;
      out[m][r] = up(picked ?? grey[m][r]);
    }
  }
  return out;
}

const categoryOf = (family: string) => {
  // Google Fonts category, as lowercase-hyphenated words: sans-serif, serif, display, handwriting, monospace.
  const c = CATEGORIES.find((x) => x.id === (familyByName(family)?.cat ?? 's'))!;
  return c.label.toLowerCase().replace(/\s+/g, '-');
};

export interface AntzThemeInput { name: string; theme: ThemeDef; build: BuildColours; fontMode: FontMode; fonts: TypeFonts; hash: string; now?: Date }

/** Builds the file. Async only because the Google Fonts list (for categories) loads on demand. */
export async function makeAntzTheme(i: AntzThemeInput): Promise<AntzThemeFile> {
  await loadFontList();
  const building = !!i.theme.build;
  const parts = { light: {}, dark: {} } as AntzThemeFile['colors']['parts'];
  if (building) for (const m of ['light', 'dark'] as const) for (const p of PARTS) { const v = i.build[m][p.id]; if (v) parts[m][p.id] = up(v); }

  const fontBuild = i.fontMode === 'build';
  const fonts: TypeFonts = fontBuild ? i.fonts : {};
  const pick = (f: { family: string; weight?: number } | undefined): FontPick | null => (f ? { family: f.family, weight: f.weight ?? null } : null);
  const roles = Object.fromEntries(TYPE_ROLES.map((r) => [r.id, fontBuild ? pick(fonts[r.id]) : null])) as Record<TypeRole, FontPick | null>;
  const resolved = Object.fromEntries(TYPE_ROLES.map((r) => [r.id, { family: fontOf(fonts, r.id).family, weights: roleWeights(fonts, r.id) }])) as AntzThemeFile['fonts']['resolved'];
  const families = new Set<string>(Object.values(resolved).map((x) => x.family));
  for (const t of FONT_TARGETS) if (fontBuild && fonts[t.id]) families.add(fonts[t.id]!.family);
  if (!families.size) families.add(DEFAULT_FAMILY);

  const name = i.name.trim() || 'Untitled theme';
  return {
    format: 'antz-theme',
    version: 1,
    name,
    slug: slugify(name),
    createdAt: (i.now ?? new Date()).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    source: { app: 'design-system-previewer', hash: i.hash },
    colors: { base: building ? 'build' : i.theme.id, parts, partCatalog: catalog(), roles: flatRoles(i.theme, i.build) },
    fonts: {
      mode: i.fontMode,
      allText: fontBuild ? pick(fonts.all) : null,
      roles,
      resolved,
      categories: Object.fromEntries([...families].sort().map((f) => [f, categoryOf(f)])),
    },
  };
}

export async function exportAntzTheme(i: AntzThemeInput): Promise<ExportFile> {
  const file = await makeAntzTheme(i);
  return { name: `${file.slug}.antz-theme.json`, mime: 'application/json', body: JSON.stringify(file, null, 2) + '\n' };
}
