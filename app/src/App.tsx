import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CompareGrid } from './components/CompareGrid';
import { ComponentStrip } from './components/ComponentStrip';
import { Drawer, type DrawerTab } from './components/Drawer';
import { Inspector } from './components/Inspector';
import type { AuditItem } from './components/inspect';
import { RolePanel } from './components/RolePanel';
import { Ms, Segmented } from './components/Segmented';
import { SidePanel } from './components/SidePanel';
import { MappingPanel, Stage, pickRow, type Device, type PhonePick } from './components/Stage';
import { ThemeCompareGrid } from './components/ThemeCompareGrid';
import { SpecProbe, type ScreenSpecs } from './components/themeAudit';
import { TopBar, type Contrast, type Mode, type Panel, type View } from './components/TopBar';
import { RulesPanel } from './components/RulesPanel';
import { ScalePanel } from './components/ScalePanel';
import { applyThemeCss } from './theme/css';
import { GRADIENT_IDS, applyGradientCss, gradientsOf } from './theme/gradients';
import { applyFills, fillsFromParam, fillsToParam, resolveGrad, type GFill } from './theme/gfill';
import type { Fills } from './components/inspect';
import { SCHEME_KEYS, schemeKeyFor, setActiveColors, type Role, type SchemeKey } from './theme/library';
import { PRESETS, colorsOf, metaOf, specKey, themeFromParams, themeToHash, type ThemeDef } from './theme/themes';
import { SCREENS, screenById } from './screens';
import { EMPTY_BUILD, applyBuild, buildFromParams, buildToHash, elementsOf, modeOf, partsAt, type BuildColours } from './theme/build';
import {
  DEFAULT_FAMILY, applyFonts, countTypes, elementsOfType, familyByName, fontsFromParams, fontsToHash, loadFontList, tagTypes, typesAt, validFonts,
  type FontFamily, type FontMode, type FontTarget, type TypeFonts, type TypeRole,
} from './theme/fonts';
import { TypeProbe, type ScreenTypes } from './components/FontPanel';

interface HashState { screen?: string; scheme?: SchemeKey; view: View; device?: Device; theme: ThemeDef | null; inspect?: DrawerTab; fills: GFill[]; panel: Panel | null; build: BuildColours; fontMode: FontMode; fonts: TypeFonts }

/**
 * Deep links (combine with &): #screen=<id>, #scheme=<mode key>, #device=mobile|tablet|desktop,
 * #compare (6 modes) or #compare=themes (every preset theme), #theme=<preset id>, or a custom theme:
 * #theme=custom&p=navy&s=green&t=aqua&n=grey&nv=sage&style=vibrant, #inspect=roles|mapping|element,
 * and gradient fills: #gf=<scope>:<target>:<gradient id>:<angle>,… (scope b buttons, e element, l all like this, r role).
 * The older #fill=gradient&grad=<id> still works and becomes the built-in Buttons and FABs fill.
 * #panel=rules or #panel=scale opens the Colour rules or Colour scale sheet.
 * Build your own: #theme=build&bl=<part>:<RRGGBB>,…&bd=… (light and dark part colours; see theme/build.ts for part ids).
 * Font, independent of the theme: #font=build&ff=<role>:<Family+Name>[:<weight>],… (a all text, then roles d display, h headline, t title,
 * b body, l label, which override a; see theme/fonts.ts). No font param is the Inter template.
 */
function readHash(): HashState {
  const q: Record<string, string | undefined> = {};
  for (const part of location.hash.replace(/^#/, '').split('&')) {
    const [k, v] = part.split('=');
    if (k) q[k] = v === undefined ? '' : decodeURIComponent(v);
  }
  const fills = fillsFromParam(q.gf, GRADIENT_IDS);
  if (!fills.length && q.fill === 'gradient') fills.push({ scope: 'b', target: 'buttons', grad: q.grad && GRADIENT_IDS.includes(q.grad) ? q.grad : GRADIENT_IDS[0], angle: 135 });
  const out: HashState = { view: 'single', theme: themeFromParams(q), fills, panel: q.panel === 'rules' || q.panel === 'scale' ? q.panel : null, build: buildFromParams(q), ...fontParams(q) };
  if ('compare' in q) out.view = q.compare === 'themes' ? 'themes' : 'modes';
  if (q.screen && screenById(q.screen)) out.screen = q.screen;
  if (q.scheme && (SCHEME_KEYS as string[]).includes(q.scheme)) out.scheme = q.scheme as SchemeKey;
  if (q.device === 'mobile' || q.device === 'tablet' || q.device === 'desktop') out.device = q.device;
  if (q.inspect === 'roles' || q.inspect === 'mapping' || q.inspect === 'element') out.inspect = q.inspect;
  return out;
}

function fontParams(q: Record<string, string | undefined>) {
  const f = fontsFromParams(q);
  return { fontMode: f.mode, fonts: f.fonts };
}

function splitScheme(k: SchemeKey): { mode: Mode; contrast: Contrast } {
  const mode: Mode = k.startsWith('dark') ? 'dark' : 'light';
  const contrast: Contrast = k.includes('high') ? 'high' : k.includes('medium') ? 'medium' : '';
  return { mode, contrast };
}

/** Make a theme the active one: the shared colour table and the page stylesheet. */
function activate(t: ThemeDef) {
  setActiveColors(colorsOf(t), metaOf(t));
  applyThemeCss();
  applyGradientCss(gradientsOf(t));
}

function initial() {
  const h = readHash();
  let mode: Mode = 'light';
  let contrast: Contrast = '';
  if (h.scheme) ({ mode, contrast } = splitScheme(h.scheme));
  else {
    try {
      if (matchMedia('(prefers-color-scheme: dark)').matches) mode = 'dark';
      if (matchMedia('(prefers-contrast: more)').matches) contrast = 'high';
    } catch { /* no matchMedia */ }
  }
  const theme = h.theme ?? PRESETS[0];
  activate(theme);
  return { mode, contrast, screen: h.screen ?? SCREENS[0].id, view: h.view, device: h.device ?? ('mobile' as Device), theme, inspect: h.inspect, fills: h.fills, panel: h.panel, build: h.build, fontMode: h.fontMode, fonts: h.fonts };
}

/** Contrast level glyph: a ring with its right half filled at increasing strength. */
const ContrastIcon = ({ level }: { level: number }) => (
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
    <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" opacity={[0.3, 0.6, 1][level]} />
  </svg>
);
const CONTRASTS: { value: Contrast; label: string }[] = [
  { value: '', label: 'Standard contrast' },
  { value: 'medium', label: 'Medium contrast' },
  { value: 'high', label: 'High contrast' },
];

export default function App() {
  const [init] = useState(initial);
  const [mode, setMode] = useState<Mode>(init.mode);
  const [contrast, setContrast] = useState<Contrast>(init.contrast);
  const [screenId, setScreenId] = useState(init.screen);
  const [view, setView] = useState<View>(init.view);
  const [theme, setThemeState] = useState<ThemeDef>(init.theme);
  const [specs, setSpecs] = useState<ScreenSpecs | null>(null);
  const [device, setDevice] = useState<Device>(init.device);
  const [drawer, setDrawer] = useState<DrawerTab | null>(init.inspect ?? null);
  const [lastTab, setLastTab] = useState<DrawerTab>(init.inspect ?? 'roles');
  const [highlight, setHighlight] = useState<Role | null>(null);
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [usage, setUsage] = useState<Map<Role, number>>(new Map());
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const host = useRef<HTMLDivElement>(null);
  const [fillList, setFills] = useState<GFill[]>(init.fills);
  const [panel, setPanel] = useState<Panel | null>(init.panel);
  const closePanel = useCallback(() => setPanel(null), []);
  /** Build your own: part colours per mode (kept for the session, also when another theme is picked), the selected part, recent picks. */
  const [build, setBuild] = useState<BuildColours>(init.build);
  const [buildSel, setBuildSel] = useState<string | null>('page');
  const [recents, setRecents] = useState<string[]>([]);
  const building = !!theme.build;
  /** Font: template (Inter as designed) or build your own, per type role. Independent of the colour theme. */
  const [fontMode, setFontModeState] = useState<FontMode>(init.fontMode);
  const [fonts, setFonts] = useState<TypeFonts>(init.fonts);
  const [typeSel, setTypeSel] = useState<FontTarget>('all');
  const [fontList, setFontList] = useState<FontFamily[] | null>(null);
  const [typeCounts, setTypeCounts] = useState<Record<TypeRole, number> | null>(null);
  /** Text styles per screen, measured once off screen, so the panel can say where a style that is not on show is used. */
  const [screenTypes, setScreenTypes] = useState<ScreenTypes | null>(null);
  const fontBuilding = fontMode === 'build';
  /** With colours and fonts both being built, one editor is active: it fills the side panel and owns clicks on the phones. */
  const [editing, setEditing] = useState<'colour' | 'font'>(init.fontMode === 'build' ? 'font' : 'colour');
  const editor: 'colour' | 'font' | null = building && fontBuilding ? editing : building ? 'colour' : fontBuilding ? 'font' : null;
  // Picking the colour "Build your own" theme makes colours the active editor (not on first load, which keeps the link's choice).
  const wasBuilding = useRef(building);
  useEffect(() => { if (building && !wasBuilding.current) setEditing('colour'); wasBuilding.current = building; }, [building]);

  const scheme = schemeKeyFor(mode, contrast);
  const other = schemeKeyFor(mode === 'light' ? 'dark' : 'light', contrast);
  // Mobile shows light and dark side by side (light first); the current mode's frame drives the audit.
  // Memoised: Stage re-runs its contrast audit (and App re-renders from it) whenever this array changes identity.
  const schemes: SchemeKey[] = useMemo(() => (device === 'mobile' ? [scheme, other] : [scheme]), [device, scheme, other]);
  const order = device === 'mobile' && mode === 'dark' ? 'reverse' : 'normal';
  /** Changes whenever the colours change; components that memoise on colours depend on it. */
  const themeKey = theme.build ? 'build' : theme.library ? 'library' : specKey(theme.spec);
  const setTheme = useCallback((t: ThemeDef) => { activate(t); setThemeState(t); }, []);
  const screen = screenById(screenId) ?? SCREENS[0];
  const gradients = useMemo(() => gradientsOf(theme), [theme]);
  /** Gradient fills in effect, resolved for the active theme. Feeds the CSS, the element tags and the AA audit. */
  const fills: Fills | null = useMemo(() => (fillList.length && !building ? { fills: fillList, grads: Object.fromEntries(gradients.map((g) => [g.id, resolveGrad(gradients, g.id)])) } : null), [fillList, gradients, building]);
  // Re-tag elements after every render: screens, views and compare cards mount and unmount freely.
  // Gradient fills are an ANTZ-theme feature; they are off while building your own.
  useLayoutEffect(() => { applyFills(building ? [] : fillList, gradients); });
  useLayoutEffect(() => { applyBuild(building ? build : null); }, [building, build]);
  // Fonts: tag text on every screen (new ones mount freely), then apply; both are cheap when nothing changed.
  useLayoutEffect(() => {
    if (fontBuilding) tagTypes(document);
    applyFonts(fontBuilding ? fonts : null);
  });
  useEffect(() => {
    if (!fontBuilding || fontList) return;
    let live = true;
    loadFontList().then((l) => { if (!live) return; setFontList(l); setFonts((f) => validFonts(f)); });
    return () => { live = false; };
  }, [fontBuilding, fontList]);
  const compare = view !== 'single';
  const inspecting = drawer !== null && !compare && !building && !fontBuilding;
  // Counts for the screen on show. On entering font build or switching screens, a selected style with no text here gives
  // way to All text, so the next pick always lands on the phones (a style picked on purpose afterwards stays picked).
  useEffect(() => {
    if (!fontBuilding || !host.current) return;
    const c = countTypes(host.current);
    setTypeCounts(c);
    setTypeSel((s) => (s !== 'all' && c[s] === 0 ? 'all' : s));
  }, [fontBuilding, screenId]);
  useEffect(() => { if (fontBuilding && host.current) setTypeCounts(countTypes(host.current)); }, [device, view]);

  // The tester chrome uses its own neutral ramp; it only follows light/dark.
  useEffect(() => { document.documentElement.dataset.chrome = mode; }, [mode]);

  // Keep the URL in sync so any view can be shared.
  useEffect(() => {
    const parts = [...themeToHash(theme), `screen=${screenId}`, `scheme=${scheme}`];
    if (device !== 'mobile') parts.push(`device=${device}`);
    if (drawer) parts.push(`inspect=${drawer}`);
    if (fillList.length) parts.push(`gf=${fillsToParam(fillList)}`);
    if (building) parts.push(...buildToHash(build));
    parts.push(...fontsToHash(fontMode, fonts));
    if (panel) parts.push(`panel=${panel}`);
    if (view === 'modes') parts.unshift('compare');
    if (view === 'themes') parts.unshift('compare=themes');
    const next = '#' + parts.join('&');
    if (location.hash !== next) history.replaceState(null, '', next);
  }, [screenId, scheme, view, device, theme, drawer, fillList, panel, building, build, fontMode, fonts]);

  useEffect(() => {
    const onHash = () => {
      const h = readHash();
      if (h.screen) setScreenId(h.screen);
      if (h.scheme) { const m = splitScheme(h.scheme); setMode(m.mode); setContrast(m.contrast); }
      setView(h.view);
      if (h.device) setDevice(h.device);
      if (h.theme) setTheme(h.theme);
      if (h.theme?.build) setBuild(h.build);
      setFontModeState(h.fontMode);
      setFonts(h.fonts);
      if (h.fontMode === 'build') loadFontList().then(() => setFonts(validFonts(h.fonts)));
      setDrawer(h.inspect ?? null);
      setFills(h.fills);
      setPanel(h.panel);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, [setTheme]);

  const pickScreen = (id: string) => { setScreenId(id); setSelected(null); setHighlight(null); };
  const onUsage = useCallback((m: Map<Role, number>) => setUsage(m), []);
  const onAudit = useCallback((a: AuditItem[]) => setAudit(a), []);
  const onSpecs = useCallback((m: ScreenSpecs) => setSpecs(m), []);
  const openTab = (t: DrawerTab) => { setDrawer(t); setLastTab(t); };
  const select = (el: HTMLElement | null) => { setSelected(el); if (el) openTab('element'); };
  const setPart = (id: string, hex: string | null) => setBuild((b) => {
    const m = { ...b[mode] };
    if (hex === null) delete m[id]; else m[id] = hex;
    return { ...b, [mode]: m };
  });
  const buildProps = {
    build, scheme, mode, selected: buildSel, recents,
    onMode: setMode, onSelect: setBuildSel,
    onColour: (id: string, hex: string) => setPart(id, hex),
    onCommit: (hex: string) => setRecents((r) => [hex, ...r.filter((x) => x !== hex)].slice(0, 8)),
    onResetPart: (id: string) => setPart(id, null),
    onResetAll: () => { if (confirm('Reset every part to grey, in light and dark mode?')) setBuild(EMPTY_BUILD); },
  };
  const setFontMode = (m: FontMode) => { setFontModeState(m); if (m === 'build') setEditing('font'); };
  const same = (a?: { family: string; weight?: number }, b?: { family: string; weight?: number }) =>
    (a?.family ?? DEFAULT_FAMILY) === (b?.family ?? DEFAULT_FAMILY) && a?.weight === b?.weight;
  const setRoleFont = (r: FontTarget, patch: { family?: string; weight?: number | undefined }) => setFonts((f) => {
    // A role with no pick of its own starts from All text; All text starts from Inter.
    const inherit = r === 'all' ? undefined : f.all;
    const cur = f[r] ?? inherit ?? { family: DEFAULT_FAMILY };
    const next = { ...cur, ...patch };
    // A weight the new family does not have goes back to "as designed".
    if (next.weight && !familyByName(next.family)?.weights.includes(next.weight)) delete next.weight;
    if (next.weight === undefined) delete next.weight;
    const out = { ...f };
    // An entry that matches what it would get anyway is dropped (a role may still pick Inter to stay out of All text).
    if (same(next, inherit)) delete out[r]; else out[r] = next;
    // All text changed: role picks that now match it are no longer overrides.
    if (r === 'all') for (const k of Object.keys(out) as FontTarget[]) if (k !== 'all' && same(out[k], out.all)) delete out[k];
    return out;
  });
  const fontProps = {
    mode: fontMode, onMode: setFontMode, editing, onEditing: setEditing,
    panel: {
      fonts, list: fontList, selected: typeSel, counts: typeCounts, screenTypes, screenId,
      onSelect: (r: FontTarget) => setTypeSel(r),
      onScreen: pickScreen,
      onFamily: (r: FontTarget, family: string) => setRoleFont(r, { family }),
      onWeight: (r: FontTarget, weight: number | undefined) => setRoleFont(r, { weight }),
      onResetRole: (r: FontTarget) => setFonts((f) => { const o = { ...f }; delete o[r]; return o; }),
      onResetAll: () => { if (confirm('Reset every text style to Inter?')) setFonts({}); },
    },
  };
  const phonePick: PhonePick | null = useMemo(() => {
    if (editor === 'colour') return {
      kind: 'part', selected: buildSel,
      hits: (t, x, y) => partsAt(t, x, y).map((h) => ({ id: h.part.id, el: h.el })),
      elements: elementsOf,
      onPick: (id, k) => { setBuildSel(id); if (modeOf(k) !== mode) setMode(modeOf(k)); },
    };
    if (editor === 'font') return {
      kind: 'type', selected: typeSel,
      hits: (t) => typesAt(t),
      elements: (id, roots) => { roots.forEach((r) => tagTypes(r)); return elementsOfType(id, roots); },
      onPick: (id) => setTypeSel(id as FontTarget),
    };
    return null;
  }, [editor, buildSel, typeSel, mode]);
  const themeFile = useMemo(() => ({ theme, build, fontMode, fonts }), [theme, build, fontMode, fonts]);
  const selScheme = ((selected?.closest('.screen-host') as HTMLElement | null)?.dataset.scheme as SchemeKey | undefined) ?? scheme;

  return (
    <div className={`shell${inspecting ? ' with-drawer' : ''}`}>
      <a className="skip" href="#preview">Skip to preview</a>
      <TopBar mode={mode} view={view} inspecting={drawer !== null && !building && !fontBuilding} building={building} fontBuilding={fontBuilding} panel={panel} onPanel={setPanel} onMode={setMode}
        themeFile={themeFile}
        onView={(v) => { setView(v); setSelected(null); }}
        onInspect={() => (drawer ? setDrawer(null) : openTab(lastTab))} />
      <div className="body">
        <SidePanel theme={theme} scheme={scheme} specs={specs} onTheme={setTheme} gradients={gradients} fills={fillList} resolved={fills} onFills={setFills} build={buildProps} font={fontProps} themeFile={themeFile} />
        <main className="centre">
          <div className="toolbar">
            <label className="select">
              <span className="sr-only">Screen</span>
              <select value={screenId} onChange={(e) => pickScreen(e.target.value)} aria-label="Screen">
                {SCREENS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <Ms n="expand_more" size={20} />
            </label>
            {view === 'single' && (
              <label className="select quiet">
                <select value={device} onChange={(e) => setDevice(e.target.value as Device)} aria-label="Device frame">
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                  <option value="desktop">Desktop</option>
                </select>
                <Ms n="expand_more" size={20} />
              </label>
            )}
            <span className="spacer" />
            {view === 'single' && building && fontBuilding && (
              <div className="bd-head">
                <span className="bd-head-lbl" aria-hidden="true">Clicks pick</span>
                <Segmented label="Clicks on the phones pick" value={editing} onChange={setEditing}
                  options={[{ value: 'colour', label: <><Ms n="palette" size={16} />Colours</> }, { value: 'font', label: <><Ms n="text_fields" size={16} />Fonts</> }]} />
              </div>
            )}
            {view !== 'modes' && (
              <div className="pill" role="group" aria-label="Contrast">
                {CONTRASTS.map((c, i) => (
                  <button key={c.label} type="button" className="icon-btn" aria-pressed={contrast === c.value} aria-label={c.label} title={c.label} onClick={() => setContrast(c.value)}>
                    <ContrastIcon level={i} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {view === 'modes' && (
            <CompareGrid screen={screen} themeKey={themeKey} onOpen={(k) => { const m = splitScheme(k); setMode(m.mode); setContrast(m.contrast); setView('single'); }} />
          )}
          {view === 'themes' && (
            <ThemeCompareGrid screen={screen} scheme={scheme} active={theme} specs={specs} onOpen={(t) => { setTheme(t); setView('single'); }} />
          )}
          {view === 'single' && (
            <>
              <div className={`stage order-${order}`}>
                <Stage screen={screen} schemes={schemes} themeKey={themeKey} fills={fills} device={device} highlight={highlight} selected={selected} inspecting={inspecting}
                  hostRef={host} onSelect={select} onUsage={onUsage} onAudit={onAudit} build={phonePick} />
              </div>
              {/* One strip per phone, in the same order, so each reads next to its frame's mode. */}
              {/* The M3 samples paint straight from the role tokens, so they would not follow per-part colours; hidden while building. */}
              {!building && (
                <div className={`strips order-${order}`}>
                  {schemes.map((k) => <ComponentStrip key={k} scheme={k} />)}
                </div>
              )}
            </>
          )}
        </main>
        <Drawer open={inspecting} tab={drawer ?? lastTab} onTab={openTab} onClose={() => setDrawer(null)}>
          {(drawer ?? lastTab) === 'roles' && <RolePanel scheme={scheme} themeKey={themeKey} highlight={highlight} onHighlight={setHighlight} usage={usage} />}
          {(drawer ?? lastTab) === 'mapping' && (
            <MappingPanel screen={screen} scheme={scheme} highlight={highlight} audit={audit}
              onRow={(roles) => { setHighlight(roles[0]); const el = pickRow(host.current, roles); setSelected(el); el?.scrollIntoView({ block: 'nearest' }); }}
              onPick={(el) => { select(el); el.scrollIntoView({ block: 'nearest' }); }} />
          )}
          {(drawer ?? lastTab) === 'element' && <Inspector el={selected} scheme={selScheme} screenLabel={screen.label} onClear={() => setSelected(null)} gradients={gradients} fills={fillList} resolved={fills} onFills={setFills} />}
        </Drawer>
      </div>
      {!specs && <SpecProbe onSpecs={onSpecs} />}
      {fontBuilding && !screenTypes && <TypeProbe onTypes={setScreenTypes} />}
      {panel === 'scale' && <ScalePanel theme={theme} onClose={closePanel} />}
      {panel === 'rules' && <RulesPanel theme={theme} scheme={scheme} onClose={closePanel} />}
    </div>
  );
}
