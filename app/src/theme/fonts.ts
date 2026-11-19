/**
 * Font picker: "Template" (Inter only, the screens exactly as designed) or "Build your own font family" (any Google Font per
 * type role). Independent of the colour theme.
 *
 * How it maps onto the screens
 *  - The screens have no type tokens: each class sets its own size and weight (screens.css) and everything inherits Inter
 *    from .screen-host. So the roles are derived from the M3 type scale: every element on a phone that holds text of its own
 *    is tagged data-ty="<role>" by its size and weight as designed (see classify()). Tagging measures with the font
 *    stylesheet switched off, so a picked weight never changes which role an element belongs to. Icons, the ANTZ mark and
 *    the phone status bar are left out.
 *  - "All text" (URL key a) sets one family for every role; a role's own pick overrides it.
 *  - One stylesheet (#antz-font) gives each changed role its family (and weight, when one is picked) on
 *    html[data-font] .screen-host [data-ty="<role>"]. It only targets .screen-host, so the tester's own UI keeps Inter.
 *  - Chosen families load from fonts.googleapis.com/css2, one link per family with only the weights the tagged text uses.
 *  - The picker's previews load a subset of each family (only the letters of its name) under a private alias (gfp-<name>),
 *    so a preview never stands in for the full font on the phones.
 */

/* ---------- Roles ---------- */

export type TypeRole = 'display' | 'headline' | 'title' | 'body' | 'label';
export interface TypeRoleDef { id: TypeRole; key: string; label: string; hint: string; rule: string }

export const TYPE_ROLES: TypeRoleDef[] = [
  { id: 'display', key: 'd', label: 'Display', hint: 'Big numbers on insight and sick-animal banners', rule: '34 px and up' },
  { id: 'headline', key: 'h', label: 'Headline', hint: 'Stat numbers and large headings', rule: '20 to 33 px' },
  { id: 'title', key: 't', label: 'Title', hint: 'App bar titles, names, card and section titles', rule: '17 to 19 px, or 15 to 16 px at weight 500 and up' },
  { id: 'body', key: 'b', label: 'Body', hint: 'Paragraphs, supporting text, values, captions', rule: 'Up to 16 px, regular weight' },
  { id: 'label', key: 'l', label: 'Label', hint: 'Buttons, chips, tabs, badges, small bold text', rule: 'Under 15 px at weight 500 and up' },
];
/** "All text": one family for every role at once. A role with its own pick overrides it. */
export type FontTarget = 'all' | TypeRole;
export interface FontTargetDef { id: FontTarget; key: string; label: string; hint: string; rule: string }
export const ALL_TEXT: FontTargetDef = { id: 'all', key: 'a', label: 'All text', hint: 'The whole family: every text style at once. A style picked below overrides it', rule: 'Every size' };
export const FONT_TARGETS: FontTargetDef[] = [ALL_TEXT, ...TYPE_ROLES];
export const typeRoleById = (id: string | null | undefined): FontTargetDef | undefined => FONT_TARGETS.find((r) => r.id === id);

/** The M3 type role for text of this size and weight. */
export function classify(px: number, weight: number): TypeRole {
  if (px >= 34) return 'display';
  if (px >= 20) return 'headline';
  if (px >= 17 || (px >= 15 && weight >= 500)) return 'title';
  if (weight >= 500) return 'label';
  return 'body';
}

/* ---------- Font list ---------- */

export type FontCategory = 's' | 'r' | 'd' | 'h' | 'm';
export const CATEGORIES: { id: FontCategory; label: string; generic: string }[] = [
  { id: 's', label: 'Sans serif', generic: 'sans-serif' },
  { id: 'r', label: 'Serif', generic: 'serif' },
  { id: 'd', label: 'Display', generic: 'sans-serif' },
  { id: 'h', label: 'Handwriting', generic: 'cursive' },
  { id: 'm', label: 'Monospace', generic: 'monospace' },
];
export interface FontFamily { name: string; cat: FontCategory; weights: number[]; italic: boolean }

export const DEFAULT_FAMILY = 'Inter';
const INTER: FontFamily = { name: DEFAULT_FAMILY, cat: 's', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], italic: true };

let listPromise: Promise<FontFamily[]> | null = null;
let byName = new Map<string, FontFamily>([[DEFAULT_FAMILY, INTER]]);

/** Google Fonts families (src/data/googleFonts.json, made by scripts/fetch-google-fonts.mjs), most popular first. Loaded on demand. */
export function loadFontList(): Promise<FontFamily[]> {
  listPromise ??= import('../data/googleFonts.json').then((m) => {
    const rows = (m.default as unknown as { families: [string, string, string, number][] }).families;
    const list = rows.map(([name, cat, w, it]) => ({ name, cat: cat as FontCategory, weights: [...w].map((d) => Number(d) * 100), italic: it === 1 }));
    byName = new Map(list.map((f) => [f.name, f]));
    return list;
  });
  return listPromise;
}
export const familyByName = (name: string) => byName.get(name);

export const WEIGHT_NAMES: Record<number, string> = { 100: 'Thin', 200: 'Extra light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black' };

const nearest = (weights: number[], w: number) => weights.reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a), weights[0]);

/* ---------- State ---------- */

export interface RoleFont { family: string; weight?: number }
/** Target -> picked font. A role with no entry follows "all"; with neither it is Inter as designed. */
export type TypeFonts = Partial<Record<FontTarget, RoleFont>>;
export type FontMode = 'template' | 'build';

export const isDefault = (f: RoleFont | undefined) => !f || (f.family === DEFAULT_FAMILY && f.weight === undefined);
/** The font in effect for a role (its own pick, else All text, else Inter), or for All text itself. */
export const fontOf = (fonts: TypeFonts, t: FontTarget): RoleFont => fonts[t] ?? (t === 'all' ? undefined : fonts.all) ?? { family: DEFAULT_FAMILY };

/** CSS font-family value for a family: the family, then its generic fallback. */
export function stackOf(name: string): string {
  const generic = CATEGORIES.find((c) => c.id === (familyByName(name)?.cat ?? 's'))!.generic;
  return `"${name}", ${generic}`;
}

/* ---------- URL ---------- */

const NAME = /^[A-Za-z0-9 ]{1,64}$/;
/** font=build, and ff=<key>:<Family+Name>[:<weight>],… for All text (a) and the roles that have their own pick. */
export function fontsToHash(mode: FontMode, fonts: TypeFonts): string[] {
  if (mode !== 'build') return [];
  // A role may pick Inter on purpose (to keep it out of All text), so every entry is written.
  const pairs = FONT_TARGETS.filter((r) => fonts[r.id]).map((r) => {
    const f = fonts[r.id]!;
    return `${r.key}:${f.family.replace(/ /g, '+')}${f.weight ? `:${f.weight}` : ''}`;
  });
  return ['font=build', ...(pairs.length ? [`ff=${pairs.join(',')}`] : [])];
}

export function fontsFromParams(q: Record<string, string | undefined>): { mode: FontMode; fonts: TypeFonts } {
  const fonts: TypeFonts = {};
  for (const pair of (q.ff ?? '').split(',')) {
    const [k, fam, w] = pair.split(':');
    const role = FONT_TARGETS.find((r) => r.key === k);
    const family = (fam ?? '').replace(/\+/g, ' ');
    if (!role || !NAME.test(family)) continue;
    const weight = Number(w);
    fonts[role.id] = { family, ...(weight >= 100 && weight <= 900 && weight % 100 === 0 ? { weight } : {}) };
  }
  return { mode: q.font === 'build' ? 'build' : 'template', fonts };
}

/** Drop families that are not in the list and weights the family does not have (for links edited by hand). */
export function validFonts(fonts: TypeFonts): TypeFonts {
  const out: TypeFonts = {};
  for (const r of FONT_TARGETS) {
    const f = fonts[r.id];
    const fam = f && familyByName(f.family);
    if (!f || !fam) continue;
    out[r.id] = { family: f.family, ...(f.weight && fam.weights.includes(f.weight) ? { weight: f.weight } : {}) };
  }
  return out;
}

/* ---------- Tagging the phones ---------- */

const ATTR = 'data-ty';
/** Styles used per role as designed: "400", "600", "400i"… Grows as screens are tagged; drives which weights load. */
const used: Record<TypeRole, Set<string>> = { display: new Set(), headline: new Set(), title: new Set(), body: new Set(), label: new Set() };

const ownText = (el: Element) => {
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent!.trim()) return true;
  return false;
};

/** Tag every untagged element that holds text of its own, in every screen under root. Cheap when everything is tagged. */
export function tagTypes(root: ParentNode = document) {
  const todo: HTMLElement[] = [];
  root.querySelectorAll<HTMLElement>(`.screen-host .scr *:not([${ATTR}])`).forEach((e) => {
    // Icons, the ANTZ mark and the phone's status bar (device chrome, not app text) keep their own fonts.
    if (e.closest('.ms, .antz-mark, svg, .statusbar') || !ownText(e)) return;
    todo.push(e);
  });
  if (!todo.length) return;
  const sheet = (document.getElementById(SHEET) as HTMLStyleElement | null)?.sheet;
  if (sheet) sheet.disabled = true;
  try {
    for (const e of todo) {
      const cs = getComputedStyle(e);
      const w = Number(cs.fontWeight) || 400;
      const role = classify(parseFloat(cs.fontSize), w);
      e.setAttribute(ATTR, role);
      used[role].add(`${w}${cs.fontStyle === 'normal' ? '' : 'i'}`);
    }
  } finally {
    if (sheet) sheet.disabled = false;
  }
}

/** Elements of a role on the given roots (none for All text, which would outline every word). */
export const elementsOfType = (role: string, roots: ParentNode[]) => role === 'all' ? [] :
  roots.flatMap((r) => [...r.querySelectorAll<HTMLElement>(`.scr [${ATTR}="${role}"]`)]);

/** Text elements under the target, nearest first, one per role (clicking again steps outwards). */
export function typesAt(target: Element): { id: TypeRole; el: HTMLElement }[] {
  const out: { id: TypeRole; el: HTMLElement }[] = [];
  for (let e: HTMLElement | null = target as HTMLElement; e && !e.classList.contains('scr'); e = e.parentElement) {
    const r = e.getAttribute(ATTR) as TypeRole | null;
    if (r && !out.some((o) => o.id === r)) out.push({ id: r, el: e });
  }
  return out;
}

/** How many text elements each role has under root. */
export function countTypes(root: ParentNode): Record<TypeRole, number> {
  const c = { display: 0, headline: 0, title: 0, body: 0, label: 0 };
  root.querySelectorAll<HTMLElement>(`.scr [${ATTR}]`).forEach((e) => { c[e.getAttribute(ATTR) as TypeRole]++; });
  return c;
}

/* ---------- Applying ---------- */

const SHEET = 'antz-font';
const API = 'https://fonts.googleapis.com/css2';
const enc = (name: string) => name.replace(/ /g, '+');

/** The stylesheet for the roles whose font in effect (own pick or All text) is not Inter as designed. */
export function fontCss(fonts: TypeFonts): string {
  return TYPE_ROLES.filter((r) => !isDefault(fontOf(fonts, r.id))).map((r) => {
    const f = fontOf(fonts, r.id);
    return `html[data-font] .screen-host [${ATTR}="${r.id}"] { font-family: ${stackOf(f.family)};${f.weight ? ` font-weight: ${f.weight} !important;` : ''} }`;
  }).join('\n');
}

/** css2 URL per family, with only the styles the roles using it need. Inter as designed is already on the page. */
export function fontUrls(fonts: TypeFonts): Map<string, string> {
  const need = new Map<string, Set<string>>();
  for (const r of TYPE_ROLES) {
    const f = fontOf(fonts, r.id);
    if (isDefault(f)) continue;
    const fam = familyByName(f!.family);
    if (!fam) continue;
    const styles = used[r.id].size ? [...used[r.id]] : ['400'];
    const set = need.get(fam.name) ?? new Set<string>();
    for (const s of styles) {
      const w = nearest(fam.weights, f!.weight ?? parseInt(s, 10));
      const ital = s.endsWith('i') && fam.italic ? 1 : 0;
      set.add(`${ital},${w}`);
    }
    need.set(fam.name, set);
  }
  const out = new Map<string, string>();
  for (const [name, set] of need) {
    const tuples = [...set].map((t) => t.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const axes = tuples.some((t) => t[0]) ? `ital,wght@${tuples.map((t) => t.join(',')).join(';')}` : `wght@${tuples.map((t) => t[1]).join(';')}`;
    out.set(name, `${API}?family=${enc(name)}:${axes}&display=swap`);
  }
  return out;
}

/** Weights the text of a role loads, by the same logic as fontUrls(): its picked weight, else the weights tagging has recorded
 *  for it (snapped to the family's weights). Before any text of the role has been tagged: the picked weight, else 400 to 700. */
export function roleWeights(fonts: TypeFonts, role: TypeRole): number[] {
  const f = fontOf(fonts, role);
  if (f.weight) return [f.weight];
  const fam = familyByName(f.family);
  if (!used[role].size || !fam) return [400, 500, 600, 700];
  return [...new Set([...used[role]].map((s) => nearest(fam.weights, parseInt(s, 10))))].sort((a, b) => a - b);
}

const links = new Map<string, HTMLLinkElement>();

/** Turn the font build on (with these fonts) or off (null). Safe to call on every render. */
export function applyFonts(fonts: TypeFonts | null) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  let el = document.getElementById(SHEET);
  if (!fonts) {
    root.removeAttribute('data-font');
    el?.remove();
    return;
  }
  root.setAttribute('data-font', '');
  if (!el) { el = document.createElement('style'); el.id = SHEET; document.head.appendChild(el); }
  const css = fontCss(fonts);
  if (el.textContent !== css) el.textContent = css;

  // Links: add what is new; drop what is no longer used once its replacement has loaded (so text never flashes).
  const want = new Set(fontUrls(fonts).values());
  const fresh: HTMLLinkElement[] = [];
  for (const url of want) {
    if (links.has(url)) continue;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = url;
    l.dataset.antzFont = '';
    document.head.appendChild(l);
    links.set(url, l);
    fresh.push(l);
  }
  const stale = [...links.entries()].filter(([url]) => !want.has(url));
  if (!stale.length) return;
  const drop = () => stale.forEach(([url, l]) => { if (!want.has(url) && links.get(url) === l) { l.remove(); links.delete(url); } });
  if (!fresh.length) drop();
  else Promise.all(fresh.map((l) => new Promise((ok) => { l.onload = l.onerror = ok; }))).then(drop);
}

/* ---------- Previews in the picker ---------- */

const previews = new Set<string>();
let previewSheet: HTMLStyleElement | null = null;
export const previewFamily = (name: string) => `"gfp-${name}"`;

/** Load just the letters of a family's name, under the alias gfp-<name>, so the picker can show each name in its own font. */
export function loadPreview(f: FontFamily) {
  if (previews.has(f.name) || typeof document === 'undefined') return;
  previews.add(f.name);
  const w = f.weights.includes(400) ? 400 : nearest(f.weights, 400);
  const url = `${API}?family=${enc(f.name)}:wght@${w}&text=${encodeURIComponent(f.name)}&display=swap`;
  fetch(url)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then((css) => {
      if (!previewSheet) { previewSheet = document.createElement('style'); previewSheet.id = 'antz-font-previews'; document.head.appendChild(previewSheet); }
      previewSheet.append(css.replace(/font-family:\s*'[^']*'/g, `font-family: ${previewFamily(f.name)}`));
    })
    .catch(() => previews.delete(f.name));
}
