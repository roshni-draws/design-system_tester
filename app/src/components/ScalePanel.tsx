import { useMemo, useState } from 'react';
import { TonalPalette, argbFromHex, hexFromArgb } from '@material/material-color-utilities';
import jsonUrl from '../../../ANTZ_colour_library.json?url';
import { readableOn } from '../theme/contrast';
import { ROLE_GROUPS } from '../theme/groups';
import { LIBRARY_COLORS, SCHEME_KEYS, kebab, library, schemeLabel, type Colors, type Role, type SchemeKey } from '../theme/library';
import { TONES, colorsOf, palette, type ThemeDef } from '../theme/themes';
import { gradientCss, gradientsOf } from '../theme/gradients';
import { PRESETS } from '../theme/themes';
import { Ms, Segmented } from './Segmented';
import { Sheet, Toast } from './Sheet';

type Source = 'library' | 'active';
const PALETTE_NAMES = Object.keys(library.palettes) as (keyof typeof library.palettes)[];
const EXT_KEY: Record<string, string> = Object.fromEntries(library.extendedColors.map((e) => [e.name.toLowerCase(), e.color]));

/** The 10 tonal palettes as tone -> hex. Library: the JSON itself. Active: the theme's generated palettes (fixed palettes stay the JSON's). */
function palettesFor(source: Source, theme: ThemeDef): { name: string; tones: { tone: number; hex: string }[] }[] {
  const slot: Record<string, 'p' | 's' | 't' | 'n' | 'nv'> = { primary: 'p', secondary: 's', tertiary: 't', neutral: 'n', 'neutral-variant': 'nv' };
  return PALETTE_NAMES.map((name) => {
    const json = library.palettes[name] as Record<string, string>;
    const sl = slot[name];
    if (source === 'library' || theme.library || !sl) return { name, tones: TONES.map((tone) => ({ tone, hex: json[String(tone)] })) };
    const pal = palette(sl, theme.spec[sl], theme.spec.style);
    return { name, tones: TONES.map((tone) => ({ tone, hex: hexFromArgb(pal.tone(tone)).toUpperCase() })) };
  });
}

/** Which palette and tone a scheme colour resolves to (searching every whole tone of the theme's palettes), or null. */
function resolver(source: Source, theme: ThemeDef) {
  const slot: Record<string, 'p' | 's' | 't' | 'n' | 'nv'> = { primary: 'p', secondary: 's', tertiary: 't', neutral: 'n', 'neutral-variant': 'nv' };
  const keyHex: Record<string, string> = { primary: library.coreColors.primary, secondary: library.coreColors.secondary, tertiary: library.coreColors.tertiary, neutral: library.coreColors.neutral, 'neutral-variant': library.coreColors.neutralVariant, error: library.coreColors.error, ...EXT_KEY };
  const pals = PALETTE_NAMES.map((name) => {
    const sl = slot[name];
    const pal = source === 'active' && !theme.library && sl ? palette(sl, theme.spec[sl], theme.spec.style) : TonalPalette.fromInt(argbFromHex(keyHex[name]));
    const map = new Map<string, number>();
    for (let t = 100; t >= 0; t--) map.set(hexFromArgb(pal.tone(t)).toUpperCase(), t);
    return { name, map };
  });
  return (hex: string): string | null => {
    for (const p of pals) { const t = p.map.get(hex); if (t !== undefined) return `${p.name} T${t}`; }
    return null;
  };
}

export function ScalePanel({ theme, onClose }: { theme: ThemeDef; onClose: () => void }) {
  const [source, setSource] = useState<Source>('library');
  const [mode, setMode] = useState<SchemeKey>('light');
  const [toast, setToast] = useState('');
  const shown: ThemeDef = source === 'library' ? PRESETS[0] : theme;
  const colors: Colors = source === 'library' ? LIBRARY_COLORS : colorsOf(theme);
  const palettes = useMemo(() => palettesFor(source, theme), [source, theme]);
  const resolve = useMemo(() => resolver(source, theme), [source, theme]);
  const gradients = gradientsOf(shown);
  const s = colors[mode];
  const copy = async (hex: string) => {
    try { await navigator.clipboard.writeText(hex); setToast(`Copied ${hex}`); } catch { setToast(`Could not copy ${hex}`); }
    setTimeout(() => setToast(''), 1600);
  };
  const Sw = ({ hex, label, big }: { hex: string; label?: string; big?: boolean }) => (
    <button type="button" className={`sw-btn${big ? ' big' : ''}`} style={{ background: hex, color: readableOn(hex) }} onClick={() => copy(hex)} title={`Copy ${hex}`} aria-label={`${label ? label + ', ' : ''}${hex}, copy`}>
      {label && <span>{label}</span>}
      <span className="mono">{hex}</span>
    </button>
  );
  const keys: { name: string; hex: string; note?: string }[] = [
    ...Object.entries(library.coreColors).map(([k, hex]) => ({ name: k === 'neutralVariant' ? 'Neutral variant' : k.charAt(0).toUpperCase() + k.slice(1), hex })),
    ...library.extendedColors.map((e) => ({ name: e.name, hex: e.color, note: e.description })),
  ];
  return (
    <Sheet title="Colour scale" returnFocus="btn-scale" onClose={onClose}
      sub={source === 'library' ? 'ANTZ_colour_library.json, exactly as exported.' : `${theme.name}: generated from the ANTZ key colours. Fixed palettes (error, success, warning, caution, info) are the library’s.`}
      actions={<>
        <Segmented<Source> label="Source" value={source} onChange={setSource} options={[{ value: 'library', label: 'Library (JSON)' }, { value: 'active', label: 'Active theme' }]} />
        <a className="text-btn" href={jsonUrl} download="ANTZ_colour_library.json"><Ms n="download" />Download JSON</a>
      </>}>
      <section className="sc-sec">
        <h3>Key colours</h3>
        <p className="muted">The source colours every palette is built from. Click any swatch to copy its hex.</p>
        <div className="sc-keys">
          {keys.map((k) => (
            <div key={k.name} className="sc-key">
              <Sw hex={k.hex} big />
              <span>{k.name}</span>
              {k.note && <small className="muted">{k.note}</small>}
            </div>
          ))}
        </div>
      </section>

      <section className="sc-sec">
        <h3>Tonal palettes</h3>
        <p className="muted">{PALETTE_NAMES.length} palettes × {library.palettes.primary && Object.keys(library.palettes.primary).length} tones. Tone 0 is black, 100 is white.</p>
        <div className="sc-pals">
          {palettes.map((p) => (
            <div key={p.name} className="sc-pal">
              <span className="sc-pal-name">{p.name}</span>
              <div className="sc-tones">
                {p.tones.map((t) => (
                  <button key={t.tone} type="button" className="tone" style={{ background: t.hex, color: readableOn(t.hex) }} onClick={() => copy(t.hex)} title={`${p.name} T${t.tone} ${t.hex}`} aria-label={`${p.name} tone ${t.tone}, ${t.hex}, copy`}>
                    <b>{t.tone}</b><span className="mono">{t.hex.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sc-sec">
        <div className="sc-row">
          <h3>Schemes</h3>
          <label className="select quiet">
            <select value={mode} onChange={(e) => setMode(e.target.value as SchemeKey)} aria-label="Mode">
              {SCHEME_KEYS.map((k) => <option key={k} value={k}>{schemeLabel(k)}</option>)}
            </select>
            <Ms n="expand_more" size={20} />
          </label>
        </div>
        <p className="muted">All {Object.keys(s).length} roles in {schemeLabel(mode)}. Where a colour matches a palette tone exactly, the palette and tone are shown.</p>
        <div className="sc-groups">
          {ROLE_GROUPS.map((g) => (
            <div key={g.name} className="sc-group">
              <h4>{g.name}</h4>
              <ul>
                {g.rows.map(([r]) => {
                  const hex = s[r as Role];
                  const at = resolve(hex);
                  return (
                    <li key={r}>
                      <button type="button" className="sc-role" onClick={() => copy(hex)} title={`Copy ${hex}`}>
                        <i style={{ background: hex }} aria-hidden="true" />
                        <span className="grow ellip">{kebab(r)}</span>
                        <span className="hex">{hex}</span>
                        <span className="sc-at">{at ?? '—'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="sc-sec">
        <h3>Gradients</h3>
        <div className="sc-grads">
          {gradients.map((g) => (
            <div key={g.id} className="sc-grad">
              <span className="sc-grad-strip" style={{ backgroundImage: gradientCss(g) }} aria-hidden="true" />
              <span>{g.name}</span>
              <span className="sc-stops">{g.stops.map((x) => <button key={x.palette + x.tone} type="button" className="text-btn small mono" onClick={() => copy(x.hex)}>{x.palette} T{x.tone} {x.hex}</button>)}</span>
            </div>
          ))}
        </div>
      </section>
      <Toast text={toast} />
    </Sheet>
  );
}
