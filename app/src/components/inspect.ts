/** DOM helpers shared by the stage, inspector and role highlight. */
import { contrast } from '../theme/contrast';
import { COLORS, isRole, type Role, type SchemeKey } from '../theme/library';
import { FILLABLE, fillIndex, keyOf, type ElemKey, type GFill, type ResolvedGrad } from '../theme/gfill';

export const PAINT_SELECTOR = '[data-bg],[data-fg],[data-bd]';
/** Gradient fills in effect: the assignments, and each gradient's stops and on-colour for the active theme. */
export interface Fills { fills: GFill[]; grads: Record<string, ResolvedGrad | null> }

/** The gradient an element's text sits on, if its nearest background carries a fill. */
export function fillOf(spec: { bk: ElemKey | null }, f?: Fills | null): ResolvedGrad | null {
  if (!f || !f.fills.length) return null;
  const i = fillIndex(f.fills, spec.bk);
  return i < 0 ? null : f.grads[f.fills[i].grad] ?? null;
}
const ATTRS = ['bg', 'bg2', 'fg', 'bd'] as const;
export type PaintAttr = (typeof ATTRS)[number];

export function rolesOf(el: Element): Partial<Record<PaintAttr, Role>> {
  const out: Partial<Record<PaintAttr, Role>> = {};
  for (const a of ATTRS) {
    const v = (el as HTMLElement).dataset?.[a];
    if (v && isRole(v)) out[a] = v;
  }
  return out;
}

export const usesRole = (el: Element, role: Role) => ATTRS.some((a) => (el as HTMLElement).dataset?.[a] === role);

export function selectorFor(role: Role) {
  return ATTRS.map((a) => `[data-${a}="${role}"]`).join(',');
}

/** Count how often each role is used inside a container. */
export function countRoles(root: Element): Map<Role, number> {
  const m = new Map<Role, number>();
  root.querySelectorAll('[data-bg],[data-bg2],[data-fg],[data-bd]').forEach((el) => {
    const seen = new Set(Object.values(rolesOf(el)));
    seen.forEach((r) => m.set(r, (m.get(r) ?? 0) + 1));
  });
  return m;
}

function parseHex(h: string) {
  const n = parseInt(h.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
/** Source-over blend in sRGB, the same thing color-mix(in srgb, X a%, transparent) over a backdrop produces. */
export function blend(top: string, a: number, under: string) {
  const t = parseHex(top);
  const u = parseHex(under);
  return toHex(t.map((v, i) => v * a + u[i] * (1 - a)));
}

export interface Backdrop {
  /** Element that supplies the background. */
  el: HTMLElement | null;
  /** One stop for solid fills, two for gradients. Already composited for opacity. */
  stops: string[];
  roles: Role[];
}

/** The background an element's text actually sits on, walking up through ancestors and translucent fills. */
export function effectiveBackground(start: Element | null, scheme: SchemeKey, stopAt?: Element | null): Backdrop {
  let el = start as HTMLElement | null;
  while (el && el !== stopAt && !(el.dataset && el.dataset.bg && isRole(el.dataset.bg))) el = el.parentElement;
  if (!el || el === stopAt || !el.dataset.bg) return { el: null, stops: [COLORS[scheme].surface], roles: ['surface'] };
  const r = rolesOf(el);
  const bg = r.bg as Role;
  if (r.bg2) return { el, stops: [COLORS[scheme][bg], COLORS[scheme][r.bg2]], roles: [bg, r.bg2] };
  const a = el.dataset.a ? parseFloat(el.dataset.a) : 1;
  if (a >= 1) return { el, stops: [COLORS[scheme][bg]], roles: [bg] };
  const under = effectiveBackground(el.parentElement, scheme, stopAt);
  return { el, stops: under.stops.map((u) => blend(COLORS[scheme][bg], a, u)), roles: [bg, ...under.roles] };
}

/** The text colour role in effect for an element (own data-fg or inherited). */
export function effectiveForeground(start: Element | null, stopAt?: Element | null): { el: HTMLElement | null; role: Role | null } {
  let el = start as HTMLElement | null;
  while (el && el !== stopAt) {
    const v = el.dataset?.fg;
    if (v && isRole(v)) return { el, role: v };
    el = el.parentElement;
  }
  return { el: null, role: null };
}

export interface AuditItem { el: HTMLElement; fg: Role; bg: Role[]; ratio: number; need: number; text: string }

/** One background layer between a text element and the screen root (nearest first). */
export interface Layer { bg: Role; bg2?: Role; a: number }
/** A text or icon element reduced to roles only, so it can be checked against any theme without the DOM. */
export interface PaintSpec { el: HTMLElement; fg: Role; layers: Layer[]; need: number; text: string; sig: string; bk: ElemKey | null }

function layersOf(start: Element | null, stopAt: Element | null): Layer[] {
  const out: Layer[] = [];
  let el = start as HTMLElement | null;
  while (el && el !== stopAt) {
    const r = rolesOf(el);
    if (r.bg) {
      const a = el.dataset.a ? parseFloat(el.dataset.a) : 1;
      out.push({ bg: r.bg, bg2: r.bg2, a });
      if (r.bg2 || a >= 1) break;
    }
    el = el.parentElement;
  }
  return out;
}

/** Resolve layers to composited stops for one scheme of any theme (same maths as effectiveBackground). */
export function resolveLayers(layers: Layer[], s: Record<Role, string>): { stops: string[]; roles: Role[] } {
  const go = (i: number): { stops: string[]; roles: Role[] } => {
    const l = layers[i];
    if (!l) return { stops: [s.surface], roles: ['surface'] };
    if (l.bg2) return { stops: [s[l.bg], s[l.bg2]], roles: [l.bg, l.bg2] };
    if (l.a >= 1) return { stops: [s[l.bg]], roles: [l.bg] };
    const under = go(i + 1);
    return { stops: under.stops.map((u) => blend(s[l.bg], l.a, u)), roles: [l.bg, ...under.roles] };
  };
  return go(0);
}

export function specRatio(spec: PaintSpec, s: Record<Role, string>, f?: Fills | null): number {
  // On a gradient fill the text is the fill's on-colour, checked against every stop.
  const g = fillOf(spec, f);
  if (g) return Math.min(...g.stops.map((b) => contrast(g.on, b)));
  return Math.min(...resolveLayers(spec.layers, s).stops.map((b) => contrast(s[spec.fg], b)));
}

/**
 * Every element that draws text or an icon, with the background layers it actually sits on
 * (translucent fills composited, gradients checked at both stops). Photo placeholder glyphs, photos and the
 * decorative ANTZ mark are skipped because they stand in for imagery.
 */
export function collectSpecs(root: Element): PaintSpec[] {
  const out: PaintSpec[] = [];
  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    if (el.classList.contains('photo-glyph') || el.classList.contains('antz-mark') || el.tagName === 'IMG') return;
    const icon = el.classList.contains('ms');
    const ownText = icon || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
    if (!ownText) return;
    const fg = effectiveForeground(el, root);
    if (!fg.role) return;
    const layers = layersOf(el, root);
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = icon || px >= 24 || (bold && px >= 18.66);
    const text = icon ? `icon “${el.textContent}”` : el.textContent!.trim().slice(0, 32);
    const need = large ? 3 : 4.5;
    const sig = `${fg.role}|${layers.map((l) => `${l.bg}/${l.bg2 ?? ''}/${l.a}`).join(',')}|${need}`;
    const owner = el.closest(FILLABLE);
    const bk = owner && root.contains(owner) ? keyOf(owner, root) : null;
    out.push({ el, fg: fg.role, layers, need, text, sig: bk ? `${sig}|${bk.screen}.${bk.index}` : sig, bk });
  });
  return out;
}

export function auditScreen(root: Element, scheme: SchemeKey, f?: Fills | null): AuditItem[] {
  const s = COLORS[scheme];
  return collectSpecs(root).map((p) => {
    const g = fillOf(p, f);
    return { el: p.el, fg: p.fg, bg: g ? [] : resolveLayers(p.layers, s).roles, ratio: specRatio(p, s, f), need: p.need, text: p.text + (g ? ' (gradient fill)' : '') };
  });
}
