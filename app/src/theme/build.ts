/**
 * "Build your own" theme: every screen starts in neutral grey, then each part of the screen gets any colour.
 *
 * How it maps to the token layer
 *  - The grey base is a full 65-role scheme (all 6 modes) generated with Material Color Utilities from
 *    chroma-0 palettes, so the screens keep their tonal hierarchy with no hue at all. It becomes COLORS
 *    like any other theme, through setActiveColors() and the --antz-<role> stylesheet.
 *  - A part is a set of rules. Each rule re-declares one or more --antz-<role> variables on the elements
 *    that make up the part (optionally only where the element itself paints that role as its background,
 *    text or border). Screens keep painting through var(--antz-<role>), so nothing in the screens changes.
 *    Rules with no selector sit on the screen root (.scr), so they act like a theme-wide token.
 *  - Every selector is wrapped in :where(), so all rules have the same specificity; no two parts declare the
 *    same role on the same element, and the nearest element that declares a role wins, as CSS inheritance does.
 *    ownerOf() mirrors exactly that, so clicking a phone finds the part that really colours what was clicked.
 *  - Icons are the one direct property: when the Icons part has a colour, standalone icons take it; icons inside
 *    buttons, chips, bars and panels keep following that part's content colour.
 */
import { DynamicScheme, Hct, MaterialDynamicColors, SchemeTonalSpot, TonalPalette, hexFromArgb } from '@material/material-color-utilities';
import { BASE_ROLES, EXT_ROLE_GROUPS, SCHEME_KEYS, varName, type Colors, type Role, type SchemeKey } from './library';

/* ---------- Grey base ---------- */

let greyCache: Colors | null = null;

/** All 65 roles in neutral grey, for all 6 modes. Extended colours (success, warning, …) mirror the grey primary group. */
export function greyColors(): Colors {
  if (greyCache) return greyCache;
  const grey = TonalPalette.fromHueAndChroma(0, 0);
  const variant = new SchemeTonalSpot(Hct.fromInt(0xff808080), false, 0).variant;
  type DC = typeof MaterialDynamicColors.primary;
  const dc = (r: Role) => (MaterialDynamicColors as unknown as Record<string, DC>)[r];
  const out = {} as Colors;
  for (const k of SCHEME_KEYS) {
    const isDark = k.startsWith('dark');
    const contrastLevel = k.includes('high') ? 1 : k.includes('medium') ? 0.5 : 0;
    const scheme = new DynamicScheme({
      sourceColorArgb: 0xff808080, variant, contrastLevel, isDark,
      primaryPalette: grey, secondaryPalette: grey, tertiaryPalette: grey, neutralPalette: grey, neutralVariantPalette: grey,
    });
    scheme.errorPalette = grey;
    const flat = {} as Record<Role, string>;
    for (const r of BASE_ROLES) flat[r] = hexFromArgb(dc(r).getArgb(scheme)).toUpperCase();
    for (const g of EXT_ROLE_GROUPS) {
      const [c, on, cc, onc] = g.roles;
      flat[c] = flat.primary; flat[on] = flat.onPrimary; flat[cc] = flat.primaryContainer; flat[onc] = flat.onPrimaryContainer;
    }
    out[k] = flat;
  }
  greyCache = out;
  return out;
}

/* ---------- Parts ---------- */

export type BuildMode = 'light' | 'dark';
export interface PartRule {
  /** Elements inside a screen. Empty: the screen root (.scr), i.e. theme-wide. */
  sel: string;
  roles: Role[];
  /** Only where the element itself paints the role as this attribute (bg also matches the second gradient stop). */
  on?: 'bg' | 'fg' | 'bd';
}
export type GroupId = 'structure' | 'text' | 'controls' | 'chips' | 'containers' | 'media' | 'status';
export interface Part {
  id: string;
  group: GroupId;
  label: string;
  hint: string;
  /** Role whose grey is shown as the part's colour until it is set. */
  swatch: Role;
  rules: PartRule[];
  /** Icons inside this part follow the part's content colour, not the Icons part. */
  ownsIcons?: boolean;
}

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: 'structure', label: 'Screen structure' },
  { id: 'text', label: 'Text and icons' },
  { id: 'controls', label: 'Buttons and inputs' },
  { id: 'chips', label: 'Chips and tabs' },
  { id: 'containers', label: 'Cards and panels' },
  { id: 'media', label: 'Photos and placeholders' },
  { id: 'status', label: 'Avatars, badges and status' },
];

const BTN1 = '.fab, .fround[data-bg="secondaryContainer"], .sq-act[data-bg="secondaryContainer"]';
const BTN2 = '.square-btn, .sq-act:not([data-bg="secondaryContainer"]), .fpill, .fround:not([data-bg="secondaryContainer"]), .top-pill, .dial-mini, .dial-label';
const INPUT = '.search-field, .search-filled, .adm-filters';
const CHIP = '.chip:not(.chip-sel), .tchip, .aid-chip, .date:not(.sel)';
const CHIP_SEL = '.chip-sel, .date.sel';
const FEATURE = '.insights-top, .sick-banner, .records';
const ALERT = '.ticker, .pending';
const AVATAR = '.avatar, .act-ic, .req-ic';
const BADGE = '.announce, .announce-ic, .crit, .g20, .adm-badge, .sb-batt-fill';
const CARD = '.post, .note-card, .req-card, .adm-card, .insights, .stat-card, .lab-summary, .rec-tile, .act-tile, .grid-card, .lrow, .pending-row, .st-tile';

export const ICONS_ID = 'icons';

export const PARTS: Part[] = [
  // Screen structure
  { id: 'page', group: 'structure', label: 'Page background', hint: 'Behind everything on each screen', swatch: 'background',
    rules: [{ sel: '', on: 'bg', roles: ['background', 'surfaceContainer', 'surfaceContainerHigh'] }] },
  { id: 'sections', group: 'structure', label: 'Section backgrounds', hint: 'Home header, feed, notes section, chip band', swatch: 'surfaceContainerHigh',
    rules: [{ sel: '.home-head, .feed, .notes-sec, .chip-band, .scr-scroll > div:not([class])', on: 'bg', roles: ['surfaceContainerHigh', 'surfaceContainer', 'surfaceContainerLow', 'surfaceContainerLowest'] }] },
  { id: 'statusbar', group: 'structure', label: 'Status bar', hint: 'Strip with the time and battery', swatch: 'surfaceContainerLowest',
    rules: [{ sel: '.statusbar', on: 'bg', roles: ['surfaceContainerLowest'] }] },
  { id: 'statusbarContent', group: 'structure', label: 'Status bar icons', hint: 'Time, signal, wifi, battery outline', swatch: 'onSurface', ownsIcons: true,
    rules: [{ sel: '.statusbar', roles: ['onSurface', 'outline'] }] },
  { id: 'appbar', group: 'structure', label: 'App bar', hint: 'Top bar with the screen title', swatch: 'surfaceContainerLowest',
    rules: [{ sel: '.appbar', on: 'bg', roles: ['surfaceContainerLowest', 'surfaceContainerHigh'] }] },
  { id: 'appbarTitle', group: 'structure', label: 'App bar title', hint: 'Lab, Medical, Collections…', swatch: 'tertiary',
    rules: [{ sel: '.appbar-title', on: 'fg', roles: ['tertiary'] }] },
  { id: 'appbarContent', group: 'structure', label: 'App bar icons and actions', hint: 'Back arrow, search, site picker', swatch: 'onSurface', ownsIcons: true,
    rules: [{ sel: '.appbar', on: 'fg', roles: ['onSurface'] }, { sel: '.appbar > [data-fg]:not(.appbar-title), .appbar-action, .appbar-action [data-fg]', on: 'fg', roles: ['tertiary'] }] },

  // Text and icons
  { id: 'textPrimary', group: 'text', label: 'Primary text', hint: 'Body text, labels, values', swatch: 'onSurface',
    rules: [{ sel: '', roles: ['onSurface', 'onBackground'] }] },
  { id: 'textSecondary', group: 'text', label: 'Secondary text', hint: 'Supporting text, dates, captions', swatch: 'onSurfaceVariant',
    rules: [{ sel: '', roles: ['onSurfaceVariant'] }] },
  { id: 'textHeading', group: 'text', label: 'Headings and IDs', hint: 'Names, animal IDs, numbers, filters', swatch: 'tertiary',
    rules: [{ sel: '', roles: ['tertiary'] }] },
  { id: 'textAccent', group: 'text', label: 'Links and highlights', hint: 'Post titles, section actions, accent labels', swatch: 'primary',
    rules: [{ sel: '', roles: ['primary'] }] },
  { id: ICONS_ID, group: 'text', label: 'Icons', hint: 'Standalone icons. Icons in buttons, chips and bars follow those parts', swatch: 'onSurfaceVariant',
    rules: [] },
  { id: 'dividers', group: 'text', label: 'Dividers and outlines', hint: 'Card borders, rules, field outlines', swatch: 'outlineVariant',
    rules: [{ sel: '', roles: ['outlineVariant', 'outline'] }] },

  // Buttons and inputs
  { id: 'btnPrimary', group: 'controls', label: 'Primary buttons', hint: 'FAB, add and chat buttons', swatch: 'primaryContainer',
    rules: [{ sel: BTN1, on: 'bg', roles: ['primaryContainer', 'secondaryContainer'] }] },
  { id: 'btnPrimaryContent', group: 'controls', label: 'Primary button icons', hint: 'Icon on the FAB, add and chat buttons', swatch: 'onPrimaryContainer', ownsIcons: true,
    rules: [{ sel: BTN1, on: 'fg', roles: ['onPrimaryContainer', 'onSecondaryContainer'] }] },
  { id: 'btnSecondary', group: 'controls', label: 'Secondary buttons', hint: 'Icon buttons, floating pills, FAB menu items', swatch: 'surfaceContainerHigh',
    rules: [{ sel: BTN2, on: 'bg', roles: ['surfaceContainerLowest', 'surfaceContainerHigh'] }] },
  { id: 'btnSecondaryContent', group: 'controls', label: 'Secondary button content', hint: 'Labels and icons on those buttons', swatch: 'onSurface', ownsIcons: true,
    rules: [{ sel: BTN2, on: 'fg', roles: ['onSurface', 'tertiary', 'primary'] }] },
  { id: 'inputs', group: 'controls', label: 'Search fields and filters', hint: 'Search boxes and the filter bar', swatch: 'surfaceContainerLowest',
    rules: [{ sel: INPUT, on: 'bg', roles: ['surfaceContainerLowest', 'surfaceContainerHighest'] }] },
  { id: 'inputContent', group: 'controls', label: 'Search and filter text', hint: 'Placeholder text and icons in fields', swatch: 'onSurfaceVariant', ownsIcons: true,
    rules: [{ sel: `${INPUT}, :is(${INPUT}) [data-fg]`, on: 'fg', roles: ['tertiary', 'onSurfaceVariant', 'onSurface'] }] },

  // Chips and tabs
  { id: 'chips', group: 'chips', label: 'Chips', hint: 'Site chips, test chips, date pills, animal chip', swatch: 'surfaceContainerHigh',
    rules: [{ sel: CHIP, on: 'bg', roles: ['surfaceContainerHigh', 'surfaceContainerLowest'] }] },
  { id: 'chipContent', group: 'chips', label: 'Chip text', hint: 'Labels and icons on chips', swatch: 'onSurface', ownsIcons: true,
    rules: [{ sel: `${CHIP}, :is(.aid-chip, .date:not(.sel)) [data-fg]`, on: 'fg', roles: ['onSurface', 'onSurfaceVariant', 'tertiary'] }] },
  { id: 'chipSelected', group: 'chips', label: 'Selected chip', hint: '“All sites” chip and the selected date', swatch: 'tertiary',
    rules: [{ sel: CHIP_SEL, roles: ['tertiary', 'tertiaryContainer'] }] },
  { id: 'chipSelectedContent', group: 'chips', label: 'Selected chip text', hint: 'Label on the selected chip and date', swatch: 'onTertiary', ownsIcons: true,
    rules: [{ sel: CHIP_SEL, roles: ['onTertiary'] }] },
  { id: 'tabs', group: 'chips', label: 'Tab bars', hint: 'Tab strip and segmented control', swatch: 'surfaceContainerLowest',
    rules: [{ sel: '.tabs-m, .segm', on: 'bg', roles: ['surfaceContainerLowest', 'surfaceContainerHighest'] }] },
  { id: 'tabActive', group: 'chips', label: 'Active tab', hint: 'Selected tab label and underline, selected segment', swatch: 'primary',
    rules: [{ sel: '.tab-m.on', roles: ['primary'] }, { sel: '.segm > .on', on: 'bg', roles: ['surfaceContainerLowest'] }] },
  { id: 'tabLabels', group: 'chips', label: 'Tab labels', hint: 'Unselected tabs and segment labels', swatch: 'onSurfaceVariant',
    rules: [{ sel: '.tab-m:not(.on), .segm > span', on: 'fg', roles: ['onSurface', 'onSurfaceVariant'] }] },

  // Cards and panels
  { id: 'cards', group: 'containers', label: 'Cards', hint: 'Posts, notes, requests, records, list rows, tiles', swatch: 'surfaceContainerLowest',
    rules: [{ sel: CARD, on: 'bg', roles: ['surfaceContainerLowest'] }] },
  { id: 'cardInsets', group: 'containers', label: 'Card insets', hint: 'Test and dose strips inside cards', swatch: 'surfaceContainer',
    rules: [{ sel: '.tests, .dose', on: 'bg', roles: ['surfaceContainer'] }] },
  { id: 'feature', group: 'containers', label: 'Feature panels', hint: 'Insights header, sick-animal banner, records block', swatch: 'inverseSurface',
    rules: [{ sel: FEATURE, on: 'bg', roles: ['inverseSurface', 'tertiary', 'secondaryContainer'] }] },
  { id: 'featureContent', group: 'containers', label: 'Feature panel text', hint: 'Text, numbers and icons on those panels', swatch: 'inverseOnSurface', ownsIcons: true,
    rules: [{ sel: FEATURE, roles: ['inverseOnSurface', 'inversePrimary', 'onTertiary', 'onSecondaryContainer'] }] },
  { id: 'alert', group: 'containers', label: 'Alert banners', hint: 'Audit score ticker, Pending panel', swatch: 'cautionContainer',
    rules: [{ sel: ALERT, on: 'bg', roles: ['cautionContainer', 'errorContainer'] }] },
  { id: 'alertContent', group: 'containers', label: 'Alert banner text', hint: 'Text and icons on alert banners', swatch: 'onCautionContainer', ownsIcons: true,
    rules: [{ sel: ALERT, roles: ['onCautionContainer', 'onErrorContainer'] }] },
  { id: 'modTiles', group: 'containers', label: 'Module tiles', hint: 'Taxonomy, Medical, Housing… (gradient becomes solid)', swatch: 'primary',
    rules: [{ sel: '.mod-tile', roles: ['secondary', 'primary', 'tertiary', 'info', 'surfaceContainerHighest', 'surfaceVariant'] }] },
  { id: 'modTileContent', group: 'containers', label: 'Module tile text', hint: 'Labels and icons on module tiles', swatch: 'onPrimary', ownsIcons: true,
    rules: [{ sel: '.mod-tile', roles: ['onPrimary', 'onTertiary', 'onSurfaceVariant'] }] },

  // Photos and placeholders
  { id: 'images', group: 'media', label: 'Image placeholders', hint: 'Behind photos and empty thumbnails', swatch: 'surfaceVariant',
    rules: [{ sel: '.photo, .lrow-thumb, .grid-card-img, .aid-thumb', on: 'bg', roles: ['surfaceVariant', 'surfaceContainerHigh'] }] },
  { id: 'imageMarks', group: 'media', label: 'Placeholder marks', hint: 'ANTZ “a” mark and animal glyphs', swatch: 'outline', ownsIcons: true,
    rules: [{ sel: '.antz-mark, .lrow-thumb [data-fg]', on: 'fg', roles: ['outline'] }, { sel: '.photo, .aid-thumb', on: 'fg', roles: ['onSurfaceVariant'] }] },
  { id: 'overlays', group: 'media', label: 'Photo overlays', hint: 'Shade behind text on photos, photo counters', swatch: 'inverseSurface',
    rules: [{ sel: '.shade', roles: ['inverseSurface'] }, { sel: '.photo-count, .car-count', on: 'bg', roles: ['inverseSurface'] }] },
  { id: 'overlayContent', group: 'media', label: 'Text on photos', hint: 'Captions, counters and carousel dots', swatch: 'inverseOnSurface', ownsIcons: true,
    rules: [{ sel: '.shade, .photo-count, .car-count, .car-dot', roles: ['inverseOnSurface'] }] },
  { id: 'scrim', group: 'media', label: 'Menu scrim', hint: 'Dimmed layer behind the open FAB menu', swatch: 'scrim',
    rules: [{ sel: '.dial-scrim', on: 'bg', roles: ['scrim'] }] },

  // Avatars, badges and status
  { id: 'avatars', group: 'status', label: 'Avatars and icon tiles', hint: 'Initials, icon squares on tiles and cards', swatch: 'secondaryContainer',
    rules: [{ sel: `${AVATAR}, .ticker-av`, on: 'bg', roles: ['secondaryContainer', 'surfaceContainerHigh', 'primaryContainer', 'surfaceContainerLowest'] }] },
  { id: 'avatarContent', group: 'status', label: 'Avatar initials and icons', hint: 'Content of avatars and icon tiles', swatch: 'onSecondaryContainer', ownsIcons: true,
    rules: [{ sel: AVATAR, on: 'fg', roles: ['onSecondaryContainer', 'onSurfaceVariant', 'onPrimaryContainer'] }] },
  { id: 'badges', group: 'status', label: 'Badges', hint: 'Announcement, critical, site, battery, status tiles, date dots', swatch: 'secondaryContainer',
    rules: [{ sel: `${BADGE}, .st-tile, .date-dot`, on: 'bg', roles: ['secondaryContainer', 'secondary', 'errorContainer', 'infoContainer', 'warningContainer', 'cautionContainer', 'error'] }] },
  { id: 'badgeContent', group: 'status', label: 'Badge text', hint: 'Text and icons on badges', swatch: 'onSecondaryContainer', ownsIcons: true,
    rules: [{ sel: `${BADGE}, .st-tile`, on: 'fg', roles: ['onSecondaryContainer', 'onSecondary', 'onErrorContainer', 'onInfoContainer', 'onWarningContainer', 'onCautionContainer'] }] },
  { id: 'status', group: 'status', label: 'Status colours', hint: 'Pending, in progress, completed, error, info', swatch: 'warning',
    rules: [{ sel: '', roles: ['warning', 'caution', 'success', 'error', 'info'] }] },
];

export const partById = (id: string | null | undefined) => PARTS.find((p) => p.id === id);
export const ICONS_PART = partById(ICONS_ID)!;

/** Elements whose icons follow the element's own content colour rather than the Icons part. */
export const ICON_OWNERS = [...new Set(PARTS.filter((p) => p.ownsIcons).flatMap((p) => p.rules.map((r) => r.sel)).filter(Boolean))].join(', ');

/* ---------- State ---------- */

/** Per mode: part id -> '#RRGGBB'. A part with no entry is grey. Light overrides apply to light at every contrast level, dark likewise. */
export type BuildColours = Record<BuildMode, Record<string, string>>;
export const EMPTY_BUILD: BuildColours = { light: {}, dark: {} };

export const modeOf = (k: SchemeKey): BuildMode => (k.startsWith('dark') ? 'dark' : 'light');

/** The colour a part shows in a scheme: the picked colour, or the grey of its swatch role. */
export function partColour(b: BuildColours, part: Part, scheme: SchemeKey): string {
  return b[modeOf(scheme)][part.id] ?? greyColors()[scheme][part.swatch];
}

/* ---------- CSS ---------- */

const host = (scheme: string) => `html[data-build] .screen-host[data-scheme${scheme}]:not(.cmp-preset) .scr`;

function ruleCss(prefix: string, r: PartRule, value: (role: Role) => string): string {
  const base = r.sel ? `${prefix} :where(${r.sel})` : prefix;
  if (!r.on) return `${base} { ${r.roles.map((role) => `${varName(role)}: ${value(role)};`).join(' ')} }`;
  return r.roles.map((role) => {
    const when = r.on === 'bg' ? `[data-bg="${role}"], [data-bg2="${role}"]` : `[data-${r.on}="${role}"]`;
    return `${base}:where(${when}) { ${varName(role)}: ${value(role)}; }`;
  }).join('\n');
}

/**
 * Every part at its grey, per mode and contrast level. Written once: it pins each part to its own elements so a
 * colour picked for one part never leaks into elements inside it that belong to another part.
 */
function baseCss(): string {
  const g = greyColors();
  return SCHEME_KEYS.map((k) => PARTS.flatMap((p) => p.rules.map((r) => ruleCss(host(`="${k}"`), r, (role) => g[k][role])))).flat().join('\n');
}

/** The picked colours, one block per part per mode. Comes after the base, so it wins on the same elements. */
export function buildCss(b: BuildColours): string {
  const out: string[] = [];
  for (const mode of ['light', 'dark'] as const) {
    const prefix = host(`^="${mode}"`);
    for (const p of PARTS) {
      const hex = b[mode][p.id];
      if (!hex) continue;
      if (p.id === ICONS_ID) out.push(`${prefix} :where(.ms):not(.photo-glyph, :where(${ICON_OWNERS}) .ms) { color: ${hex}; }`);
      else out.push(...p.rules.map((r) => ruleCss(prefix, r, () => hex)));
    }
  }
  return out.join('\n');
}

let baseText: string | null = null;
function sheet(id: string) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
  return el;
}

/** Turn build mode on (with these colours) or off (null). */
export function applyBuild(b: BuildColours | null) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (!b) {
    root.removeAttribute('data-build');
    document.getElementById('antz-build-base')?.remove();
    document.getElementById('antz-build')?.remove();
    return;
  }
  root.setAttribute('data-build', '');
  const base = sheet('antz-build-base');
  baseText ??= baseCss();
  if (base.textContent !== baseText) base.textContent = baseText;
  const user = sheet('antz-build');
  // keep the picked colours after the base
  if (user.previousElementSibling !== base) base.after(user);
  const css = buildCss(b);
  if (user.textContent !== css) user.textContent = css;
}

/* ---------- URL ---------- */

const HEX = /^[0-9a-f]{6}$/i;
/** bl=<part>:<RRGGBB>,… and bd=… for dark. */
export function buildToHash(b: BuildColours): string[] {
  const enc = (m: Record<string, string>) => Object.entries(m).map(([k, v]) => `${k}:${v.slice(1).toUpperCase()}`).join(',');
  const out: string[] = [];
  if (Object.keys(b.light).length) out.push(`bl=${enc(b.light)}`);
  if (Object.keys(b.dark).length) out.push(`bd=${enc(b.dark)}`);
  return out;
}

export function buildFromParams(q: Record<string, string | undefined>): BuildColours {
  const dec = (v: string | undefined) => {
    const m: Record<string, string> = {};
    for (const pair of (v ?? '').split(',')) {
      const [k, hex] = pair.split(':');
      if (partById(k) && hex && HEX.test(hex)) m[k] = `#${hex.toUpperCase()}`;
    }
    return m;
  };
  return { light: dec(q.bl), dark: dec(q.bd) };
}

/* ---------- Finding parts on the phones ---------- */

type Attr = 'bg' | 'fg' | 'bd';

function ruleHits(r: PartRule, e: HTMLElement, role: Role): boolean {
  if (!r.roles.includes(role)) return false;
  if (r.on && !(e.dataset[r.on] === role || (r.on === 'bg' && e.dataset.bg2 === role))) return false;
  return r.sel ? e.matches(r.sel) : e.classList.contains('scr');
}

/** The part that colours `role` where `el` paints it: the nearest element (itself first) that a part's rule re-declares the role on. */
export function ownerOf(el: HTMLElement, role: Role): Part | null {
  for (let e: HTMLElement | null = el; e; e = e.parentElement) {
    for (const p of PARTS) if (p.rules.some((r) => ruleHits(r, e!, role))) return p;
    if (e.classList.contains('scr')) break;
  }
  return null;
}

const isStandaloneIcon = (el: Element) => el.classList.contains('ms') && !el.classList.contains('photo-glyph') && !el.closest(ICON_OWNERS);

function roleOf(e: HTMLElement, a: Attr | 'bg2'): Role | null {
  const v = e.dataset[a];
  return v ? (v as Role) : null;
}

/** True when the point is over the element's own text or it is an icon glyph. */
function overContent(el: Element, x: number, y: number): boolean {
  if (el.closest('.ms')) return true;
  for (const n of el.childNodes) {
    if (n.nodeType !== 3 || !n.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const b of range.getClientRects()) if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return true;
  }
  return false;
}

export interface PartHit { part: Part; el: HTMLElement }

/**
 * Parts under a point, nearest first: over text or an icon, its content colour comes first; otherwise the fill behind it.
 * Clicking the same spot again steps through the list (fill, content, the card behind, the page…).
 */
export function partsAt(target: Element, x: number, y: number): PartHit[] {
  const scr = target.closest('.scr');
  if (!scr) return [];
  const out: PartHit[] = [];
  const add = (part: Part | null, el: HTMLElement) => { if (part && !out.some((o) => o.part.id === part.id)) out.push({ part, el }); };
  const start = target as HTMLElement;
  if (overContent(start, x, y)) {
    const icon = start.closest<HTMLElement>('.ms');
    if (icon && isStandaloneIcon(icon)) add(ICONS_PART, icon);
    for (let e: HTMLElement | null = start; e; e = e.parentElement) {
      const fg = roleOf(e, 'fg');
      if (fg) { add(ownerOf(e, fg), e); break; }
      if (e === scr) break;
    }
  }
  for (let e: HTMLElement | null = start; e; e = e.parentElement) {
    for (const a of ['bg', 'bg2', 'fg', 'bd'] as const) {
      const r = roleOf(e, a);
      if (r) add(ownerOf(e, r), e);
    }
    if (e === scr) break;
  }
  return out;
}

/** Every element on the given hosts that the part colours, for the selection outline. */
export function elementsOf(partId: string, roots: Element[]): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const root of roots) {
    if (partId === ICONS_ID) {
      root.querySelectorAll<HTMLElement>('.scr .ms').forEach((e) => { if (isStandaloneIcon(e)) out.push(e); });
      continue;
    }
    root.querySelectorAll<HTMLElement>('.scr, .scr [data-bg], .scr [data-bg2], .scr [data-fg], .scr [data-bd]').forEach((e) => {
      for (const a of ['bg', 'bg2', 'fg', 'bd'] as const) {
        const r = roleOf(e, a);
        if (r && ownerOf(e, r)?.id === partId) { out.push(e); return; }
      }
    });
  }
  return out;
}
