import { useState, type ComponentProps, type KeyboardEvent } from 'react';
import { readableOn } from '../theme/contrast';
import { library, schemeLabel, type Colors, type Role, type SchemeKey } from '../theme/library';
import { BUILD_THEME, KEY_COLOURS, PIN_ROLES, PRESETS, SLOTS, STYLES, colorsOf, defaultTone, keyById, pinContrast, presetById, shadesOf, themeForSpec, type Pins, type SlotId, type StyleId, type ThemeDef, type ThemeSpec } from '../theme/themes';
import { Ms, Segmented } from './Segmented';
import { auditTheme, type ScreenSpecs } from './themeAudit';
import type { Fills } from './inspect';
import { gradientCss, type Gradient } from '../theme/gradients';
import { labelOf, type GFill } from '../theme/gfill';
import { usePopover } from './usePopover';
import { BuildPanel } from './BuildPanel';
import { greyColors } from '../theme/build';
import { FontPanel } from './FontPanel';
import type { FontMode } from '../theme/fonts';
import { ExportSection } from './ExportSection';
import type { ThemeFileState } from './ThemeFileDialog';

const HELP: Record<SlotId, string> = {
  p: 'Buttons, links and active states',
  s: 'Chips, avatars and tonal fills',
  t: 'Titles and selected chips',
  n: 'Backgrounds and surfaces',
  nv: 'Outlines and secondary text',
};
const TILE: Role[] = ['primary', 'secondaryContainer', 'tertiary'];

function ThemeTile({ theme, scheme, active, onPick }: { theme: ThemeDef; scheme: SchemeKey; active: boolean; onPick: () => void }) {
  const s = colorsOf(theme)[scheme];
  return (
    <li>
      <button type="button" className="tile" aria-pressed={active} onClick={onPick} title={`${theme.name}: ${theme.spec.p}, ${theme.spec.s}, ${theme.spec.t}${theme.spec.style !== 'fidelity' ? `, ${theme.spec.style}` : ''}`}>
        <span className="tile-chip" aria-hidden="true">
          {TILE.map((r) => <i key={r} style={{ background: s[r] }} />)}
          {active && <span className="tile-check"><Ms n="check" size={16} /></span>}
        </span>
        <span className="tile-name">{theme.name}</span>
      </button>
    </li>
  );
}

/** The "Build your own" tile: grey stripes and a brush, since the theme starts grey. */
function BuildTile({ scheme, active, onPick }: { scheme: SchemeKey; active: boolean; onPick: () => void }) {
  const g = greyColors()[scheme];
  return (
    <li>
      <button type="button" className="tile" aria-pressed={active} onClick={onPick} title="Build your own: start from grey and colour each part of the screens with any colour">
        <span className="tile-chip build" aria-hidden="true">
          {(['surfaceContainerHigh', 'surfaceContainerLowest', 'outline'] as const).map((r) => <i key={r} style={{ background: g[r] }} />)}
          <span className="tile-brush"><Ms n={active ? 'check' : 'brush'} size={20} /></span>
        </span>
        <span className="tile-name">Build your own</span>
      </button>
    </li>
  );
}

/** Font option tile: "Aa" in Inter for the template, mixed faces and a pen for building your own. */
function FontTile({ build, active, onPick }: { build: boolean; active: boolean; onPick: () => void }) {
  return (
    <li>
      <button type="button" className="tile" aria-pressed={active} onClick={onPick}
        title={build ? 'Build your own font family: pick any Google Font for each text style' : 'Template: Inter only, exactly as designed'}>
        <span className={`tile-chip font${build ? ' build' : ''}`} aria-hidden="true">
          {build ? <span className="tile-aa mixed"><span>A</span><span>a</span></span> : <span className="tile-aa">Aa</span>}
          {active && <span className="tile-check"><Ms n="check" size={16} /></span>}
          {build && !active && <span className="tile-pen"><Ms n="edit" size={14} /></span>}
        </span>
        <span className="tile-name">{build ? 'Build your own font family' : 'Template'}</span>
      </button>
    </li>
  );
}

export interface FontSectionProps {
  mode: FontMode; onMode: (m: FontMode) => void;
  /** Which build editor the side panel shows (and phone clicks follow) when colours and fonts are both being built. */
  editing: 'colour' | 'font'; onEditing: (e: 'colour' | 'font') => void;
  panel: ComponentProps<typeof FontPanel>;
}

const EDITORS = [
  { value: 'colour' as const, label: <><Ms n="palette" size={16} />Colours</> },
  { value: 'font' as const, label: <><Ms n="text_fields" size={16} />Fonts</> },
];

/** The Font section: Template or Build your own, independent of the colour theme. */
function FontSection({ font, colourBuild, showPanel }: { font: FontSectionProps; colourBuild: boolean; showPanel: boolean }) {
  const both = colourBuild && font.mode === 'build';
  return (
    <>
      <h2>Font</h2>
      <ul className="tiles" aria-label="Font">
        <FontTile build={false} active={font.mode === 'template'} onPick={() => font.onMode('template')} />
        <FontTile build active={font.mode === 'build'} onPick={() => font.onMode('build')} />
      </ul>
      {both && (
        <div className="bd-head ed-switch">
          <span className="bd-head-lbl">Building</span>
          <Segmented label="Editor in the panel and for clicks on the phones" value={font.editing} options={EDITORS} onChange={font.onEditing} />
        </div>
      )}
      {font.mode === 'build' && showPanel && <FontPanel {...font.panel} />}
    </>
  );
}

/** Tonal shades of the selected key colour. Picking one pins the slot's main role to that tone. */
function ShadeStrip({ slot, spec, label, onPin }: { slot: SlotId; spec: ThemeSpec; label: string; onPin: (t: number | undefined) => void }) {
  const shades = shadesOf(slot, spec[slot], spec.style);
  const def = defaultTone({ ...spec, pins: undefined }, slot);
  const pinned = spec.pins?.[slot];
  const current = pinned ?? def;
  const [hover, setHover] = useState<number | null>(null);
  const shown = shades.find((x) => x.tone === (hover ?? current)) ?? shades.find((x) => x.tone === def);
  const warn = pinned !== undefined ? pinContrast(spec, slot) : null;
  const onLabel = PIN_ROLES[slot].onLabel;
  const move = (e: KeyboardEvent<HTMLButtonElement>) => {
    const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 9, ArrowUp: -9 }[e.key];
    if (!d) return;
    e.preventDefault();
    const all = [...e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('.shd')];
    all[Math.max(0, Math.min(all.length - 1, all.indexOf(e.currentTarget) + d))].focus();
  };
  return (
    <div className="shd-wrap">
      <div className="shd-head">
        <p className="menu-h">{slot === 'n' ? 'Page background' : slot === 'nv' ? 'Outline and secondary text' : 'Shade'} in light mode, standard contrast. Dark mirrors it.</p>
        {pinned !== undefined && <button type="button" className="text-btn small" onClick={() => onPin(undefined)}>Reset shade</button>}
      </div>
      <div className="shd-grid" role="radiogroup" aria-label={`${label} shade`}>
        {shades.map((x) => {
          const on = x.tone === current;
          return (
            <button key={x.tone} type="button" role="radio" aria-checked={on} className={`shd${x.tone === def ? ' def' : ''}`}
              style={{ background: x.hex, color: readableOn(x.hex) }} title={`Tone ${x.tone} ${x.hex}${x.tone === def ? ', default' : ''}`}
              aria-label={`Tone ${x.tone}, ${x.hex}${x.tone === def ? ', default' : ''}`} tabIndex={on ? 0 : -1}
              onClick={() => onPin(x.tone === def && slot !== 'n' ? undefined : x.tone)} onKeyDown={move}
              onMouseEnter={() => setHover(x.tone)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(x.tone)} onBlur={() => setHover(null)}>
              {on ? <Ms n="check" size={16} /> : x.tone}
            </button>
          );
        })}
      </div>
      <p className="shd-cap">
        <span>Tone {shown?.tone}{shown?.tone === def ? ' (default)' : ''}</span>
        <span className="hex">{shown?.hex}</span>
      </p>
      {warn && warn.ratio < 4.5 && (
        <p className="warn-line">{slot === 'nv' ? `${label} ${pinned}: secondary text on surface` : `${label} ${pinned} with ${onLabel}`}: {warn.ratio.toFixed(1)}, below AA ({schemeLabel(warn.scheme)})</p>
      )}
    </div>
  );
}

/** Fixed colour row (error, extended): a lock, no popover. */
function FixedRow({ label, help, hex }: { label: string; help: string; hex: string }) {
  return (
    <li className="crow fixed">
      <span className="dot" style={{ background: hex }} aria-hidden="true" />
      <span className="crow-txt"><span>{label}</span><small>{help}</small></span>
      <Ms n="lock" size={16} />
    </li>
  );
}

/** One MTB-style colour row; opens a popover with the 5 ANTZ key colours and the shades of the chosen one. */
function ColourRow({ slot, label, help, spec, onSpec }: { slot: SlotId; label: string; help: string; spec: ThemeSpec; onSpec: (patch: Partial<ThemeSpec>) => void }) {
  const p = usePopover<HTMLLIElement>();
  const value = spec[slot];
  const pinned = spec.pins?.[slot];
  const hex = pinned !== undefined ? shadesOf(slot, value, spec.style).find((x) => x.tone === pinned)?.hex ?? keyById(value).hex : keyById(value).hex;
  const setPin = (t: number | undefined) => {
    const pins: Pins = { ...spec.pins };
    if (t === undefined) delete pins[slot]; else pins[slot] = t;
    onSpec({ pins });
  };
  return (
    <li className="pop-wrap" ref={p.wrap}>
      <button ref={p.trigger} type="button" className="crow" aria-haspopup="dialog" aria-expanded={p.open} onClick={() => p.setOpen((o) => !o)}>
        <span className="dot" style={{ background: hex }} aria-hidden="true" />
        <span className="crow-txt"><span>{label}</span><small>{help}</small></span>
        <span className="crow-val">{keyById(value).name}{pinned !== undefined ? ` · ${pinned}` : ''}</span>
        <Ms n="expand_more" size={20} />
      </button>
      {p.open && (
        <div className="menu keys" role="dialog" aria-label={`${label} source colour`}>
          <p className="menu-h">{label} source, ANTZ key colours only</p>
          <div className="keys-row" role="radiogroup" aria-label={`${label} source colour`}>
            {KEY_COLOURS.map((k) => (
              <button key={k.id} type="button" role="radio" aria-checked={value === k.id} className="key" autoFocus={value === k.id}
                onClick={() => onSpec({ [slot]: k.id } as Partial<ThemeSpec>)}
                onKeyDown={(e) => {
                  const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
                  if (!d) return;
                  e.preventDefault();
                  const all = [...e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('.key')];
                  all[(all.indexOf(e.currentTarget) + d + all.length) % all.length].focus();
                }}>
                <span className="dot" style={{ background: k.hex }} aria-hidden="true">{value === k.id && <Ms n="check" size={18} />}</span>
                <span>{k.name}</span>
                <small>{k.hex}</small>
              </button>
            ))}
          </div>
          <ShadeStrip slot={slot} spec={spec} label={label} onPin={setPin} />
        </div>
      )}
    </li>
  );
}

function AaLine({ colors, specs, grad }: { colors: Colors; specs: ScreenSpecs | null; grad: Fills | null }) {
  if (!specs) return null;
  const a = auditTheme(colors, specs, grad);
  if (!a.fails) return null;
  return <p className="muted aa-line" title={a.detail.join('\n')}>{a.fails} text {a.fails === 1 ? 'pair falls' : 'pairs fall'} below WCAG AA on these screens in at least one mode.</p>;
}

export function SidePanel({ theme, scheme, specs, onTheme, gradients, fills, resolved, onFills, build, font, themeFile }: {
  theme: ThemeDef; scheme: SchemeKey; specs: ScreenSpecs | null; onTheme: (t: ThemeDef) => void;
  gradients: Gradient[]; fills: GFill[]; resolved: Fills | null; onFills: (f: GFill[]) => void;
  /** Props for the "Build your own" panel; shown instead of the ANTZ colour sections while that theme is active. */
  build: ComponentProps<typeof BuildPanel>;
  font: FontSectionProps;
  /** What the ANTZ theme file holds; drives the Export theme section at the bottom. */
  themeFile: ThemeFileState;
}) {
  const buttons = fills.find((f) => f.scope === 'b');
  const others = fills.filter((f) => f.scope !== 'b');
  const gradOf = (id: string) => gradients.find((g) => g.id === id) ?? gradients[0];
  const setButtons = (grad: string | null) => onFills(grad ? [...fills.filter((f) => f.scope !== 'b'), { scope: 'b', target: 'buttons', grad, angle: buttons?.angle ?? 135 }] : fills.filter((f) => f.scope !== 'b'));
  const [copied, setCopied] = useState(false);
  const spec = theme.spec;
  const set = (patch: Partial<ThemeSpec>) => onTheme(themeForSpec({ ...spec, ...patch }));
  const tiles = theme.id === 'custom' ? [...PRESETS, theme] : PRESETS;
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };
  const ext = library.extendedColors;
  const tileList = (
    <ul className="tiles" aria-label="Themes">
      {tiles.map((t) => <ThemeTile key={t.id} theme={t} scheme={scheme} active={t.id === theme.id} onPick={() => onTheme(t)} />)}
      <BuildTile scheme={scheme} active={!!theme.build} onPick={() => onTheme(BUILD_THEME)} />
    </ul>
  );
  if (theme.build) {
    return (
      <aside className="side" aria-label="Theme and font">
        <p className="intro">
          Build your own theme with any colours, not only the ANTZ palette. Your colours stay for this session and are kept in the link, so you can <button type="button" className="link" onClick={copy}>{copied ? 'link copied' : 'share it'}</button>.
        </p>
        <h2>Theme</h2>
        {tileList}
        {/* With both builders on, only one editor shows at a time; the switch under the Font tiles picks it. */}
        <FontSection font={font} colourBuild showPanel={font.mode === 'build' && font.editing === 'font'} />
        {!(font.mode === 'build' && font.editing === 'font') && <BuildPanel {...build} />}
        <ExportSection state={themeFile} />
      </aside>
    );
  }
  return (
    <aside className="side" aria-label="Theme and font">
      <p className="intro">
        Try arrangements of the ANTZ palette on real app screens. Every theme is built only from the ANTZ key colours, and error, success, warning, caution and info stay fixed.
      </p>
      <p className="intro">
        Pick a theme, or set each source colour below. The link always holds your choice, so you can <button type="button" className="link" onClick={copy}>{copied ? 'link copied' : 'share it'}</button>.
      </p>

      <h2>Theme</h2>
      {tileList}
      <AaLine colors={colorsOf(theme)} specs={specs} grad={resolved} />

      <FontSection font={font} colourBuild={false} showPanel />

      <h2>Core colors</h2>
      <ul className="rows">
        {SLOTS.map((x) => <ColourRow key={x.id} slot={x.id} label={x.name} help={HELP[x.id]} spec={spec} onSpec={set} />)}
        <FixedRow label="Error" help="Fixed in every theme" hex={library.coreColors.error} />
      </ul>
      <label className="field">
        <span>Style</span>
        <select value={spec.style} onChange={(e) => set({ style: e.target.value as StyleId })}>
          {STYLES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <p className="muted">{STYLES.find((x) => x.id === spec.style)!.hint}</p>

      <h2>Extended colors</h2>
      <ul className="rows">
        {ext.map((e) => <FixedRow key={e.name} label={e.name} help="Fixed in every theme" hex={e.color} />)}
      </ul>

      <h2>Gradients</h2>
      <ul className="rows">
        {gradients.map((g) => (
          <li key={g.id} className="grow-row">
            <span className="grad-strip" style={{ backgroundImage: gradientCss(g) }} aria-hidden="true" />
            <span className="crow-txt">
              <span>{g.name}</span>
              <small className="grad-stops">{g.stops.map((x) => `${x.palette} T${x.tone} ${x.hex}`).join(' → ')}</small>
            </span>
          </li>
        ))}
      </ul>
      <p className="muted">Follows the active theme: each stop is its palette at the same tone, so primary, secondary and tertiary stops change with the theme. Error, info, warning and caution stops are fixed.</p>
      <h3 className="sub-h">Gradient fills</h3>
      <ul className="rows">
        <li className="frow">
          <span className="grad-chip" style={{ backgroundImage: buttons ? gradientCss(gradOf(buttons.grad)) : undefined }} aria-hidden="true" />
          <span className="crow-txt"><span>Buttons and FABs</span><small>Filled buttons and FABs on every screen</small></span>
          <select className="mini-select" aria-label="Buttons and FABs fill" value={buttons?.grad ?? 'solid'} onChange={(e) => setButtons(e.target.value === 'solid' ? null : e.target.value)}>
            <option value="solid">Solid</option>
            {gradients.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </li>
        {others.map((f) => (
          <li key={`${f.scope}:${f.target}`} className="frow">
            <span className="grad-chip" style={{ backgroundImage: gradientCss(gradOf(f.grad)).replace('135deg', `${f.angle}deg`) }} aria-hidden="true" />
            <span className="crow-txt"><span>{labelOf(f)}</span><small>{gradOf(f.grad).name}, {f.angle}°</small></span>
            <button type="button" className="icon-btn" aria-label={`Remove gradient from ${labelOf(f)}`} title="Remove" onClick={() => onFills(fills.filter((x) => x !== f))}><Ms n="close" size={18} /></button>
          </li>
        ))}
      </ul>
      <p className="muted">{others.length ? '' : 'To fill any other element, open Inspect, select it on a phone (or Alt-click it), then pick a gradient under Fill. '}Text and icons on a fill switch to the colour that reads best over both stops.</p>
      {fills.length > 0 && <div className="text-btns"><button type="button" className="text-btn" onClick={() => onFills([])}><Ms n="format_color_reset" />Clear all gradient fills</button></div>}

      <h2>Share</h2>
      <div className="text-btns">
        <button type="button" className="text-btn" onClick={copy}><Ms n={copied ? 'check' : 'link'} />{copied ? 'Link copied' : 'Copy link'}</button>
        {!theme.library && <button type="button" className="text-btn" onClick={() => onTheme(presetById('antz-library')!)}><Ms n="restart_alt" />Reset to ANTZ Library</button>}
      </div>

      <ExportSection state={themeFile} />
    </aside>
  );
}
