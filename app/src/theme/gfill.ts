/**
 * Gradient fills: any of the 5 ANTZ gradients assigned to elements on the phones.
 *
 * Scopes
 *  - b  "Buttons and FABs": the built-in button fill (filled buttons and FABs only).
 *  - e  "This element": one element on one screen, by its position among the screen's painted elements.
 *  - l  "All like this": every element of the same kind (same component class and background role) on every screen.
 *  - r  "Everything using <role>": every element whose background is that role.
 * The most specific matching assignment wins (element > all like this > role > buttons). Only the element's own background changes; photos inside keep showing,
 * and text and icons on the fill switch to the on-colour with the best worst-case contrast over both stops.
 */
import { kebab, isRole, type Role } from './library';
import { gradientId, onGradient, type Gradient } from './gradients';
import { screenById } from '../screens';

export type FillScope = 'b' | 'e' | 'l' | 'r';
export interface GFill { scope: FillScope; target: string; grad: string; angle: number }
export const ANGLES = [0, 45, 90, 135, 180];

/** Filled buttons and FABs (the built-in "Buttons and FABs" fill). Not chips, tonal buttons, cards or module tiles. */
export const BUTTON_TARGETS: string = ".fab, .fround[data-bg='secondaryContainer'], .sq-act[data-bg='secondaryContainer'], .g-target";

/** What identifies an element for the scopes above. */
export interface ElemKey { screen: string; index: number; cls: string; bg: Role | ''; button: boolean }

/** Elements a fill can go on inside a host: everything painted with a background, plus strip buttons. */
export const FILLABLE: string = '[data-bg], .g-target';

export function keyOf(el: Element, host: Element): ElemKey | null {
  const h = host as HTMLElement;
  const screen = h.dataset.screen ?? h.dataset.probe ?? '';
  const list = [...host.querySelectorAll(FILLABLE)];
  const index = list.indexOf(el);
  if (index < 0) return null;
  const bg = (el as HTMLElement).dataset.bg;
  return { screen, index, cls: el.classList[0] ?? '', bg: bg && isRole(bg) ? bg : '', button: el.matches(BUTTON_TARGETS) };
}

export const likeTarget = (k: ElemKey) => `${k.cls}~${k.bg}`;
export const elemTarget = (k: ElemKey) => `${k.screen}.${k.index}`;
export const targetFor = (scope: FillScope, k: ElemKey) => (scope === 'e' ? elemTarget(k) : scope === 'l' ? likeTarget(k) : scope === 'r' ? k.bg : 'buttons');

export function matches(f: GFill, k: ElemKey): boolean {
  if (f.scope === 'b') return k.button;
  if (f.scope === 'e') return f.target === elemTarget(k);
  if (f.scope === 'l') return f.target === likeTarget(k);
  return k.bg !== '' && f.target === k.bg;
}

/** The assignment that applies to an element, or -1: the most specific scope wins
 * (this element > all like this > role > buttons); within a scope, the latest one. */
const SPECIFICITY: FillScope[] = ['e', 'l', 'r', 'b'];
export function fillIndex(fills: GFill[], k: ElemKey | null): number {
  if (!k) return -1;
  for (const scope of SPECIFICITY) {
    for (let i = fills.length - 1; i >= 0; i--) if (fills[i].scope === scope && matches(fills[i], k)) return i;
  }
  return -1;
}

/** Friendly names for the component classes used by the screen recreations. */
const NAMES: Record<string, string> = {
  announce: 'Announcement chip', 'announce-ic': 'Announcement icon', 'sick-banner': 'Medical banner', 'home-head': 'Home header', feed: 'Feed section',
  post: 'Post card', ticker: 'Audit ticker', avatar: 'Avatar', fab: 'FAB', fround: 'Round button', chip: 'Chip', 'stat-card': 'Stat card',
  insights: 'Insights card', 'insights-top': 'Insights header', records: 'Medical records block', 'rec-tile': 'Record tile', 'act-tile': 'Action tile',
  'act-ic': 'Action icon', 'adm-card': 'Record card', 'req-card': 'Lab request card', appbar: 'App bar', statusbar: 'Status bar', 'note-card': 'Note card',
  crit: 'Critical badge', 'mod-tile': 'Module tile', pending: 'Pending panel', 'pending-row': 'Pending row', segm: 'Segmented control',
  'search-field': 'Search field', 'square-btn': 'Square button', lrow: 'List row', 'lrow-thumb': 'List thumbnail', 'grid-card': 'Grid card',
  'grid-card-img': 'Grid card image', 'tabs-m': 'Tab bar', 'st-tile': 'Status tile', date: 'Date tile', 'lab-summary': 'Lab summary', tests: 'Tests panel',
  tchip: 'Test chip', dose: 'Dose bar', photo: 'Photo', scr: 'Page', 'notes-sec': 'Notes section', 'chip-band': 'Chip band', 'sq-act': 'Square action',
  'aid-chip': 'Animal ID chip', 'aid-thumb': 'Animal thumbnail', 'photo-count': 'Photo count', 'car-count': 'Carousel count', 'adm-badge': 'ID badge',
  'req-ic': 'Request icon', g20: 'Group badge', 'dial-label': 'Menu label', 'dial-mini': 'Menu button', 'sb-batt-fill': 'Battery', 'fpill': 'Floating pill',
  'top-pill': 'Top pill', 'ins-ic': 'Insights icon', 'search-filled': 'Search field', 'm3-btn': 'Filled button', 'm3-fab': 'FAB',
};
const human = (cls: string) => NAMES[cls] ?? (cls ? cls.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : 'Element');

/** Element catalogue per screen (index -> class and role), filled by the probe so labels work for screens not on show. */
export const CATALOG = new Map<string, { cls: string; bg: Role | '' }[]>();

export function labelOf(f: GFill): string {
  if (f.scope === 'b') return 'Buttons and FABs';
  if (f.scope === 'r') return `Everything using ${kebab(f.target)}`;
  if (f.scope === 'l') {
    const [cls, bg] = f.target.split('~');
    return `${human(cls)} (${kebab(bg)}) · all like this`;
  }
  const [screen, idx] = f.target.split('.');
  const item = CATALOG.get(screen)?.[+idx];
  return `${item ? human(item.cls) : `Element ${idx}`} · this element, ${screenById(screen)?.label ?? screen}`;
}

/* ---------- URL: gf=<scope>:<target>:<gradId>:<angle>,… ---------- */
export function fillsToParam(fills: GFill[]): string {
  return fills.map((f) => `${f.scope}:${f.target}:${f.grad}:${f.angle}`).join(',');
}
export function fillsFromParam(v: string | undefined, gradIds: string[]): GFill[] {
  if (!v) return [];
  return v.split(',').flatMap((part) => {
    const [scope, target, grad, angle] = part.split(':');
    if (!['b', 'e', 'l', 'r'].includes(scope) || !target || !gradIds.includes(grad)) return [];
    const a = ANGLES.includes(+angle) ? +angle : 135;
    return [{ scope: scope as FillScope, target, grad, angle: a }];
  });
}

/* ---------- Rendering ---------- */
export interface ResolvedGrad { stops: string[]; on: string }
export function resolveGrad(gs: Gradient[], id: string): ResolvedGrad | null {
  const g = gs.find((x) => gradientId(x.name) === id);
  return g ? { stops: g.stops.map((s) => s.hex), on: onGradient(g).hex } : null;
}
const css = (r: ResolvedGrad, angle: number) => `linear-gradient(${angle}deg, ${r.stops.join(', ')})`;

/** One rule per assignment; elements are tagged with data-gfill="<index>" by markFills(). */
export function buildFillCss(fills: GFill[], gs: Gradient[]): string {
  return fills.map((f, i) => {
    const r = resolveGrad(gs, f.grad);
    if (!r) return '';
    return `[data-gfill="${i}"] { background-image: ${css(r, f.angle)} !important; background-color: ${r.stops[0]} !important; color: ${r.on} !important; border-color: transparent !important; }\n`
      + `[data-gfill-fg="${i}"] { color: ${r.on} !important; }`;
  }).filter(Boolean).join('\n');
}

/** Assignments of the active view, for exports. */
export let ACTIVE_FILLS: GFill[] = [];

export function applyFills(fills: GFill[], gs: Gradient[]) {
  ACTIVE_FILLS = fills;
  if (typeof document === 'undefined') return;
  let el = document.getElementById('antz-gfill');
  if (!el) { el = document.createElement('style'); el.id = 'antz-gfill'; document.head.appendChild(el); }
  const text = buildFillCss(fills, gs);
  if (el.textContent !== text) el.textContent = text;
  markFills(fills);
}

/** Tag every fillable element on every phone, compare card and strip with the assignment that applies to it. */
export function markFills(fills: GFill[]) {
  document.querySelectorAll<HTMLElement>('.screen-host[data-screen]').forEach((host) => {
    const list = [...host.querySelectorAll<HTMLElement>(FILLABLE)];
    list.forEach((el, index) => {
      const bg = el.dataset.bg;
      const k: ElemKey = { screen: host.dataset.screen!, index, cls: el.classList[0] ?? '', bg: bg && isRole(bg) ? bg : '', button: el.matches(BUTTON_TARGETS) };
      const i = fillIndex(fills, k);
      if (i < 0) el.removeAttribute('data-gfill');
      else if (el.dataset.gfill !== String(i)) el.dataset.gfill = String(i);
    });
    // Text and icons whose nearest background is a filled element take its on-colour; text on nested cards keeps its own.
    host.querySelectorAll<HTMLElement>('[data-fg]:not([data-bg])').forEach((t) => {
      const owner = (t.parentElement?.closest(FILLABLE) as HTMLElement | null | undefined);
      const i = owner && host.contains(owner) ? owner.dataset.gfill : undefined;
      if (i === undefined) t.removeAttribute('data-gfill-fg');
      else if (t.dataset.gfillFg !== i) t.dataset.gfillFg = i;
    });
  });
}
