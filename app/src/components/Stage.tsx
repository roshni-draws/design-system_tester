import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { COLORS, kebab, schemeLabel, type Role, type SchemeKey } from '../theme/library';
import type { ScreenDef } from '../screens';
import { PAINT_SELECTOR, auditScreen, countRoles, rolesOf, selectorFor, type AuditItem, type Fills } from './inspect';

export type Device = 'desktop' | 'tablet' | 'mobile';

/** Role mapping and contrast audit for the screen, shown in the Inspect drawer. Notes sit behind an expand. */
export function MappingPanel({ screen, scheme, highlight, onRow, audit, onPick }: { screen: ScreenDef; scheme: SchemeKey; highlight: Role | null; onRow: (roles: Role[]) => void; audit: AuditItem[]; onPick: (el: HTMLElement) => void }) {
  const s = COLORS[scheme];
  const fails = audit.filter((a) => a.ratio < a.need);
  const [notes, setNotes] = useState(false);
  return (
    <div className="mapping">
      <p className="muted">{audit.length - fails.length} of {audit.length} text and icon elements meet WCAG AA in {schemeLabel(scheme)}.</p>
      {fails.length > 0 && (
        <ul className="dlist">
          {fails.map((f, i) => (
            <li key={i}>
              <button type="button" className="line" onClick={() => onPick(f.el)} title={`${kebab(f.fg)} on ${f.bg.map(kebab).join(' over ')}, needs ${f.need}:1`}>
                <span className="grow ellip">{f.text}</span>
                <span className="num fail">{f.ratio.toFixed(2)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <h3>Role mapping</h3>
      <label className="check"><input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} /> Show roles and screenshot notes</label>
      <ul className="dlist">
        {screen.map.map((row) => (
          <li key={row.region} className={row.roles.includes(highlight as Role) ? 'hl' : ''}>
            <div className="line">
              <button type="button" className="line-main" onClick={() => onRow(row.roles)} title="Highlight on the phones and inspect">
                <span className="chips" aria-hidden="true">{row.roles.map((r) => <i key={r} style={{ background: s[r] }} />)}</span>
                <span className="grow ellip">{row.region}</span>
              </button>
            </div>
            {notes && (
              <div className="notes">
                <span className="mono-s">{row.roles.map(kebab).join(' / ')}</span>
                {row.today && <span>Screenshot: {row.today}</span>}
                {row.change && <span>{row.change}</span>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The selected screen, once per scheme (light and dark side by side on mobile, one frame on tablet and desktop).
 * The first scheme is the "current" one: its frame feeds the audit, the role usage counts and the mapping rows.
 */
export function Stage({ screen, schemes, themeKey, fills, device, highlight, selected, inspecting, hostRef, onSelect, onUsage, onAudit }: {
  screen: ScreenDef; schemes: SchemeKey[]; themeKey: string; fills: Fills | null; device: Device; highlight: Role | null; selected: HTMLElement | null; inspecting: boolean;
  hostRef: RefObject<HTMLDivElement>; onSelect: (el: HTMLElement | null) => void; onUsage: (m: Map<Role, number>) => void; onAudit: (a: AuditItem[]) => void;
}) {
  const S = screen.Component;
  const row = useRef<HTMLDivElement>(null);
  const fit = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  // live contrast audit of the current frame, recomputed per screen, mode and theme
  useEffect(() => {
    const root = hostRef.current;
    if (!root) return;
    const id = requestAnimationFrame(() => onAudit(auditScreen(root, schemes[0], fills)));
    return () => cancelAnimationFrame(id);
  }, [screen, schemes, themeKey, fills, hostRef, onAudit]);

  useEffect(() => { if (hostRef.current) onUsage(countRoles(hostRef.current)); }, [screen, hostRef, onUsage]);

  // scale the frames down to fit the column (never up)
  useLayoutEffect(() => {
    const r = row.current; const f = fit.current;
    if (!r || !f) return;
    const measure = () => {
      const w = r.scrollWidth; const h = r.scrollHeight;
      setNatural({ w, h });
      setScale(Math.min(1, f.clientWidth / w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    return () => ro.disconnect();
  }, [device, schemes.length]);

  // role highlight + selection outline, on every frame
  useLayoutEffect(() => {
    const root = row.current;
    if (!root) return;
    root.querySelectorAll('.is-hl, .is-sel').forEach((e) => e.classList.remove('is-hl', 'is-sel'));
    if (highlight) root.querySelectorAll(selectorFor(highlight)).forEach((e) => e.classList.add('is-hl'));
    if (selected && root.contains(selected)) selected.classList.add('is-sel');
  });

  const onClick = (e: MouseEvent) => {
    // Alt/Option-click selects an element and opens the Element tab even when Inspect is closed.
    if (!inspecting && !e.altKey) return;
    const el = (e.target as Element).closest(PAINT_SELECTOR) as HTMLElement | null;
    if (el && row.current?.contains(el)) onSelect(el);
  };

  return (
    <div className="fit" ref={fit} style={{ height: natural.h ? natural.h * scale : undefined }}>
      <div className={`phones${inspecting ? ' inspecting' : ''}`} ref={row} style={{ transform: scale < 1 ? `scale(${scale})` : undefined }} onClick={onClick}>
        {schemes.map((k, i) => (
          <figure key={k} className={`device ${device}`}>
            <div className="device-bar" aria-hidden="true">
              {device === 'desktop' ? <><i /><i /><i /><span className="url">{screen.url}</span></> : <b className="pill-notch" />}
            </div>
            <div id={i === 0 ? 'preview' : undefined} className="screen-host" data-scheme={k} data-screen={screen.id} ref={i === 0 ? hostRef : undefined}>
              <S />
            </div>
            <figcaption>{schemeLabel(k).replace(' · Standard', '')}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/** Highlight the first role of a mapping row and select the element that carries most of its roles. */
export function pickRow(root: HTMLElement | null, roles: Role[]): HTMLElement | null {
  const matches = [...(root?.querySelectorAll<HTMLElement>(selectorFor(roles[0])) ?? [])];
  const score = (e: HTMLElement) => { const own = Object.values(rolesOf(e)); return roles.filter((r) => own.includes(r)).length; };
  return matches.sort((a, b) => score(b) - score(a))[0] ?? null;
}

