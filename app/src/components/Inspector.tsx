import { useState } from 'react';
import { contrast, readableOn } from '../theme/contrast';
import { COLORS, SCHEME_KEYS, kebab, mdName, schemeLabel, varName, type Role, type SchemeKey } from '../theme/library';
import { effectiveBackground, effectiveForeground, rolesOf, type Fills } from './inspect';
import { gradientCss, type Gradient } from '../theme/gradients';
import { ANGLES, FILLABLE, fillIndex, keyOf, labelOf, targetFor, type FillScope, type GFill } from '../theme/gfill';
import { Badge } from './RolePanel';
import { Ms } from './Segmented';

/** Fill controls for the selected element: a gradient (or solid), its angle, and how widely it applies. */
function FillControls({ el, gradients, fills, resolved, onFills }: { el: HTMLElement; gradients: Gradient[]; fills: GFill[]; resolved: Fills | null; onFills: (f: GFill[]) => void }) {
  const [scope, setScope] = useState<FillScope>('e');
  const owner = el.closest(FILLABLE) as HTMLElement | null;
  const host = owner?.closest('.screen-host');
  const k = owner && host ? keyOf(owner, host) : null;
  if (!k) return null;
  const target = targetFor(scope, k);
  const current = fills.find((f) => f.scope === scope && f.target === target);
  const angle = current?.angle ?? 135;
  const others = fills.filter((f) => !(f.scope === scope && f.target === target));
  const put = (grad: string | null, a = angle) => onFills(grad ? [...others, { scope, target, grad, angle: a }] : others);
  const eff = fillIndex(fills, k);
  const g = eff >= 0 ? resolved?.grads[fills[eff].grad] : null;
  const worst = g ? Math.min(...g.stops.map((b) => contrast(g.on, b))) : null;
  const scopes: { id: FillScope; label: string }[] = [
    { id: 'e', label: 'This element' },
    { id: 'l', label: 'All like this' },
    ...(k.bg ? [{ id: 'r' as FillScope, label: `Everything using ${kebab(k.bg)}` }] : []),
  ];
  return (
    <div className="fillc">
      <h3>Fill</h3>
      <div className="fill-scope" role="radiogroup" aria-label="Apply to">
        {scopes.map((x) => (
          <label key={x.id} className="check"><input type="radio" name="fill-scope" checked={scope === x.id} onChange={() => setScope(x.id)} /> {x.label}</label>
        ))}
      </div>
      <div className="fill-sw" role="radiogroup" aria-label="Fill">
        <button type="button" role="radio" aria-checked={!current} className="fsw solid" title="Solid, as designed" onClick={() => put(null)}><span>Solid</span></button>
        {gradients.map((gr) => (
          <button key={gr.id} type="button" role="radio" aria-checked={current?.grad === gr.id} className="fsw" title={gr.name} aria-label={gr.name}
            style={{ backgroundImage: gradientCss(gr).replace('135deg', `${angle}deg`) }} onClick={() => put(gr.id)} />
        ))}
      </div>
      <label className="field">
        <span>Angle</span>
        <select value={angle} disabled={!current} onChange={(e) => current && put(current.grad, +e.target.value)}>
          {ANGLES.map((a) => <option key={a} value={a}>{a}°</option>)}
        </select>
      </label>
      <p className="muted">
        {current ? `${labelOf(current)}. ` : ''}
        {worst !== null ? <>Text on this fill: <b className="mono">{worst.toFixed(2)}:1</b> worst case over both stops <Badge ratio={worst} /></> : 'No gradient on this element.'}
        {eff >= 0 && fills[eff] !== current ? ` On this element “${labelOf(fills[eff])}” is in effect, because a more specific fill wins.` : ''}
      </p>
    </div>
  );
}

/** Remount fill controls (and reset their scope) when another element is selected. */
const keyFor = (el: HTMLElement) => { const h = el.closest('.screen-host'); return h ? `${(h as HTMLElement).dataset.screen}.${[...h.querySelectorAll('*')].indexOf(el)}` : 'x'; };

const LABEL = { bg: 'Background', bg2: 'Gradient end', fg: 'Text / icon', bd: 'Border' } as const;
const PROP = { bg: 'background-color', bg2: 'background-image', fg: 'color', bd: 'border-color' } as const;

function Strip({ role }: { role: Role }) {
  return (
    <div className="mode-strip">
      {SCHEME_KEYS.map((k) => {
        const h = COLORS[k][role];
        return (
          <div key={k} style={{ background: h, color: readableOn(h) }} title={`${k}: ${h}`}>
            <span>{schemeLabel(k).replace(' · ', ' ')}</span>
            <span className="mono">{h}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Inspector({ el, scheme, screenLabel, onClear, gradients, fills, resolved, onFills }: {
  el: HTMLElement | null; scheme: SchemeKey; screenLabel: string; onClear: () => void;
  gradients: Gradient[]; fills: GFill[]; resolved: Fills | null; onFills: (f: GFill[]) => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!el || !el.isConnected) {
    return (
      <div className="insp">
        <p className="muted">Click any element on the phones, or a row under Mapping, to see its roles, their values in all 6 modes and the contrast of the pair.</p>
      </div>
    );
  }

  const root = el.closest('.screen-host');
  const own = rolesOf(el);
  const fg = effectiveForeground(el, root);
  const back = effectiveBackground(own.bg ? el : el.parentElement, scheme, root);
  const s = COLORS[scheme];

  const rows = (Object.keys(own) as (keyof typeof own)[]).map((a) => ({ attr: a, role: own[a] as Role }));
  if (!own.fg && fg.role) rows.push({ attr: 'fg', role: fg.role });

  const textHex = fg.role ? s[fg.role] : null;
  const perStop = textHex ? back.stops.map((b) => contrast(textHex, b)) : [];
  const worst = perStop.length ? Math.min(...perStop) : null;
  const borderRatio = own.bd ? Math.min(...effectiveBackground(el.parentElement, scheme, root).stops.map((b) => contrast(s[own.bd!], b))) : null;

  /** The same pair in every mode, computed from the JSON. */
  const acrossModes = fg.role
    ? SCHEME_KEYS.map((k) => {
        const stops = effectiveBackground(own.bg ? el : el.parentElement, k, root).stops;
        return { k, r: Math.min(...stops.map((b) => contrast(COLORS[k][fg.role!], b))) };
      })
    : [];

  const snippet = rows
    .map(({ attr, role }) => {
      if (attr === 'bg' && own.bg2) return `background-image: linear-gradient(135deg, var(${varName(own.bg!)}), var(${varName(own.bg2)}));`;
      if (attr === 'bg2') return null;
      const a = attr === 'bg' && el.dataset.a ? parseFloat(el.dataset.a) : 1;
      const v = a < 1 ? `color-mix(in srgb, var(${varName(role)}) ${Math.round(a * 100)}%, transparent)` : `var(${varName(role)})`;
      return `${PROP[attr]}: ${v};${attr === 'fg' && !own.fg ? ' /* inherited */' : ''}`;
    })
    .filter(Boolean)
    .join('\n');

  const copy = async () => {
    try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  return (
      <div className="insp" aria-live="polite">
        <div>
          <h3>Element</h3>
          <p className="insp-el">&lt;{el.tagName.toLowerCase()}&gt; {el.textContent?.trim().slice(0, 40) ? <>“{el.textContent!.trim().slice(0, 40)}”</> : null} in <b>{screenLabel}</b></p>
        </div>
        <FillControls key={keyFor(el)} el={el} gradients={gradients} fills={fills} resolved={resolved} onFills={onFills} />
        <dl className="kv">
          {rows.map(({ attr, role }) => (
            <div key={attr + role} className="kv-row">
              <dt>{LABEL[attr]}{attr === 'fg' && !own.fg ? ' (inherited)' : ''}</dt>
              <dd>
                <span className="sw-mini" style={{ background: s[role] }} aria-hidden="true" />
                <span className="mono">{kebab(role)}</span>
                <span className="mono dim">{s[role]}{attr === 'bg' && el.dataset.a ? ` at ${Math.round(parseFloat(el.dataset.a) * 100)}%` : ''}</span>
              </dd>
            </div>
          ))}
          {!own.bg && (
            <div className="kv-row">
              <dt>Sits on</dt>
              <dd><span className="sw-mini" style={{ background: back.stops[0] }} aria-hidden="true" /><span className="mono">{back.roles.map(kebab).join(' over ')}</span><span className="mono dim">{back.stops.join(' → ')}</span></dd>
            </div>
          )}
        </dl>

        {worst !== null && (
          <div>
            <h3>Contrast, text on background</h3>
            <div className="contrast-big">
              <span className="contrast-demo" style={{ background: back.stops.length > 1 ? `linear-gradient(135deg, ${back.stops[0]}, ${back.stops[1]})` : back.stops[0], color: textHex! }}>Aa</span>
              <span><Badge ratio={worst} /> <b className="mono">{worst.toFixed(2)}:1</b>{back.stops.length > 1 && <small className="dim"> lowest of both gradient stops</small>}</span>
            </div>
            <table className="modes-table">
              <caption className="sr-only">Contrast of this pair in each mode</caption>
              <tbody>
                {acrossModes.map(({ k, r }) => (
                  <tr key={k} className={k === scheme ? 'cur' : ''}>
                    <th scope="row">{schemeLabel(k)}</th>
                    <td className="mono">{r.toFixed(2)}:1</td>
                    <td><Badge ratio={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {borderRatio !== null && (
          <div>
            <h3>Border against its backdrop</h3>
            <p className="mono"><Badge ratio={borderRatio} /> {borderRatio.toFixed(2)}:1 <small className="dim">(3:1 needed only if the border is the sole cue)</small></p>
          </div>
        )}

        {rows.map(({ role }) => (
          <div key={'strip' + role}>
            <h3>{kebab(role)} in all 6 modes</h3>
            <Strip role={role} />
          </div>
        ))}

        <div>
          <h3>Use in code</h3>
          <pre className="code">{snippet}</pre>
          <div className="row-btns">
            <button type="button" className="btn" onClick={copy}><Ms n={copied ? 'check' : 'content_copy'} />{copied ? 'Copied' : 'Copy CSS'}</button>
            <button type="button" className="btn" onClick={onClear}><Ms n="close" />Clear</button>
          </div>
          <p className="dim small-note">Material Theme Builder names: {rows.map(({ role }) => mdName(role)).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</p>
        </div>
      </div>
  );
}
