import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CompareGrid } from './components/CompareGrid';
import { ComponentStrip } from './components/ComponentStrip';
import { Drawer, type DrawerTab } from './components/Drawer';
import { Inspector } from './components/Inspector';
import type { AuditItem } from './components/inspect';
import { RolePanel } from './components/RolePanel';
import { Ms } from './components/Segmented';
import { SidePanel } from './components/SidePanel';
import { MappingPanel, Stage, pickRow, type Device } from './components/Stage';
import { ThemeCompareGrid } from './components/ThemeCompareGrid';
import { SpecProbe, type ScreenSpecs } from './components/themeAudit';
import { TopBar, type Contrast, type Mode, type View } from './components/TopBar';
import { applyThemeCss } from './theme/css';
import { GRADIENT_IDS, applyGradientCss, gradientsOf } from './theme/gradients';
import { applyFills, fillsFromParam, fillsToParam, resolveGrad, type GFill } from './theme/gfill';
import type { Fills } from './components/inspect';
import { SCHEME_KEYS, schemeKeyFor, setActiveColors, type Role, type SchemeKey } from './theme/library';
import { PRESETS, colorsOf, metaOf, specKey, themeFromParams, themeToHash, type ThemeDef } from './theme/themes';
import { SCREENS, screenById } from './screens';

interface HashState { screen?: string; scheme?: SchemeKey; view: View; device?: Device; theme: ThemeDef | null; inspect?: DrawerTab; fills: GFill[] }

/**
 * Deep links (combine with &): #screen=<id>, #scheme=<mode key>, #device=mobile|tablet|desktop,
 * #compare (6 modes) or #compare=themes (every preset theme), #theme=<preset id>, or a custom theme:
 * #theme=custom&p=navy&s=green&t=aqua&n=grey&nv=sage&style=vibrant, #inspect=roles|mapping|element,
 * and gradient fills: #gf=<scope>:<target>:<gradient id>:<angle>,… (scope b buttons, e element, l all like this, r role).
 * The older #fill=gradient&grad=<id> still works and becomes the built-in Buttons and FABs fill.
 */
function readHash(): HashState {
  const q: Record<string, string | undefined> = {};
  for (const part of location.hash.replace(/^#/, '').split('&')) {
    const [k, v] = part.split('=');
    if (k) q[k] = v === undefined ? '' : decodeURIComponent(v);
  }
  const fills = fillsFromParam(q.gf, GRADIENT_IDS);
  if (!fills.length && q.fill === 'gradient') fills.push({ scope: 'b', target: 'buttons', grad: q.grad && GRADIENT_IDS.includes(q.grad) ? q.grad : GRADIENT_IDS[0], angle: 135 });
  const out: HashState = { view: 'single', theme: themeFromParams(q), fills };
  if ('compare' in q) out.view = q.compare === 'themes' ? 'themes' : 'modes';
  if (q.screen && screenById(q.screen)) out.screen = q.screen;
  if (q.scheme && (SCHEME_KEYS as string[]).includes(q.scheme)) out.scheme = q.scheme as SchemeKey;
  if (q.device === 'mobile' || q.device === 'tablet' || q.device === 'desktop') out.device = q.device;
  if (q.inspect === 'roles' || q.inspect === 'mapping' || q.inspect === 'element') out.inspect = q.inspect;
  return out;
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
  return { mode, contrast, screen: h.screen ?? SCREENS[0].id, view: h.view, device: h.device ?? ('mobile' as Device), theme, inspect: h.inspect, fills: h.fills };
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

  const scheme = schemeKeyFor(mode, contrast);
  const other = schemeKeyFor(mode === 'light' ? 'dark' : 'light', contrast);
  // Mobile shows light and dark side by side (light first); the current mode's frame drives the audit.
  const schemes: SchemeKey[] = device === 'mobile' ? [scheme, other] : [scheme];
  const order = device === 'mobile' && mode === 'dark' ? 'reverse' : 'normal';
  /** Changes whenever the colours change; components that memoise on colours depend on it. */
  const themeKey = theme.library ? 'library' : specKey(theme.spec);
  const setTheme = useCallback((t: ThemeDef) => { activate(t); setThemeState(t); }, []);
  const screen = screenById(screenId) ?? SCREENS[0];
  const gradients = useMemo(() => gradientsOf(theme), [theme]);
  /** Gradient fills in effect, resolved for the active theme. Feeds the CSS, the element tags and the AA audit. */
  const fills: Fills | null = useMemo(() => (fillList.length ? { fills: fillList, grads: Object.fromEntries(gradients.map((g) => [g.id, resolveGrad(gradients, g.id)])) } : null), [fillList, gradients]);
  // Re-tag elements after every render: screens, views and compare cards mount and unmount freely.
  useLayoutEffect(() => { applyFills(fillList, gradients); });
  const compare = view !== 'single';
  const inspecting = drawer !== null && !compare;

  // The tester chrome uses its own neutral ramp; it only follows light/dark.
  useEffect(() => { document.documentElement.dataset.chrome = mode; }, [mode]);

  // Keep the URL in sync so any view can be shared.
  useEffect(() => {
    const parts = [...themeToHash(theme), `screen=${screenId}`, `scheme=${scheme}`];
    if (device !== 'mobile') parts.push(`device=${device}`);
    if (drawer) parts.push(`inspect=${drawer}`);
    if (fillList.length) parts.push(`gf=${fillsToParam(fillList)}`);
    if (view === 'modes') parts.unshift('compare');
    if (view === 'themes') parts.unshift('compare=themes');
    const next = '#' + parts.join('&');
    if (location.hash !== next) history.replaceState(null, '', next);
  }, [screenId, scheme, view, device, theme, drawer, fillList]);

  useEffect(() => {
    const onHash = () => {
      const h = readHash();
      if (h.screen) setScreenId(h.screen);
      if (h.scheme) { const m = splitScheme(h.scheme); setMode(m.mode); setContrast(m.contrast); }
      setView(h.view);
      if (h.device) setDevice(h.device);
      if (h.theme) setTheme(h.theme);
      setDrawer(h.inspect ?? null);
      setFills(h.fills);
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
  const selScheme = ((selected?.closest('.screen-host') as HTMLElement | null)?.dataset.scheme as SchemeKey | undefined) ?? scheme;

  return (
    <div className={`shell${inspecting ? ' with-drawer' : ''}`}>
      <a className="skip" href="#preview">Skip to preview</a>
      <TopBar mode={mode} view={view} inspecting={drawer !== null} onMode={setMode}
        onView={(v) => { setView(v); setSelected(null); }}
        onInspect={() => (drawer ? setDrawer(null) : openTab(lastTab))} />
      <div className="body">
        <SidePanel theme={theme} scheme={scheme} specs={specs} onTheme={setTheme} gradients={gradients} fills={fillList} resolved={fills} onFills={setFills} />
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
                  hostRef={host} onSelect={select} onUsage={onUsage} onAudit={onAudit} />
              </div>
              {/* One strip per phone, in the same order, so each reads next to its frame's mode. */}
              <div className={`strips order-${order}`}>
                {schemes.map((k) => <ComponentStrip key={k} scheme={k} />)}
              </div>
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
    </div>
  );
}
