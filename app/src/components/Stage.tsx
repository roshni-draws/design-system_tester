import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react';
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
/**
 * A build editor on the phones (colour parts or text styles): clicks pick (never navigate or inspect), hover shows what a
 * click would pick, and everything the selection covers is outlined on every frame. Only one is active at a time.
 */
export interface PhonePick {
  kind: 'part' | 'type';
  selected: string | null;
  /** What is under a point, nearest first; clicking the same spot again steps through the list. */
  hits: (target: Element, x: number, y: number) => { id: string; el: HTMLElement }[];
  /** Every element the selection covers. */
  elements: (id: string, roots: Element[]) => HTMLElement[];
  onPick: (id: string, scheme: SchemeKey) => void;
}

export function Stage({ screen, schemes, themeKey, fills, device, highlight, selected, inspecting, hostRef, onSelect, onUsage, onAudit, build }: {
  screen: ScreenDef; schemes: SchemeKey[]; themeKey: string; fills: Fills | null; device: Device; highlight: Role | null; selected: HTMLElement | null; inspecting: boolean;
  hostRef: RefObject<HTMLDivElement>; onSelect: (el: HTMLElement | null) => void; onUsage: (m: Map<Role, number>) => void; onAudit: (a: AuditItem[]) => void;
  build?: PhonePick | null;
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

  // Build mode: outline every element the selected part colours, on both phones.
  const buildSel = build?.selected ?? null;
  const pickKind = build?.kind;
  const elementsFor = build?.elements;
  const lastClick = useRef<{ el: Element | null; i: number; kind?: string }>({ el: null, i: 0 });
  useLayoutEffect(() => {
    const root = row.current;
    if (!root) return;
    root.querySelectorAll('.cx-sel').forEach((e) => e.classList.remove('cx-sel'));
    if (buildSel && elementsFor) elementsFor(buildSel, [...root.querySelectorAll('.screen-host')]).forEach((e) => e.classList.add('cx-sel'));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- elementsFor is stable per kind
  }, [buildSel, pickKind, screen, schemes, device]);
  const hoverEl = useRef<HTMLElement | null>(null);
  const setHover = (el: HTMLElement | null) => {
    if (hoverEl.current === el) return;
    hoverEl.current?.classList.remove('cx-hover');
    el?.classList.add('cx-hover');
    hoverEl.current = el;
  };
  const onMove = (e: PointerEvent) => {
    if (!build) return;
    const hits = build.hits(e.target as Element, e.clientX, e.clientY);
    setHover(hits[0]?.el ?? null);
  };
  useEffect(() => { if (!build) setHover(null); });

  const onClick = (e: MouseEvent) => {
    if (build) {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as Element;
      const host = target.closest<HTMLElement>('.screen-host');
      const hits = build.hits(target, e.clientX, e.clientY);
      if (!host || !hits.length) return;
      // Clicking the same spot again steps to the next part under it.
      const again = lastClick.current.el === target && lastClick.current.kind === build.kind && hits.some((h) => h.id === build.selected);
      const i = again ? (lastClick.current.i + 1) % hits.length : 0;
      lastClick.current = { el: target, i, kind: build.kind };
      setHover(hits[i].el);
      build.onPick(hits[i].id, host.dataset.scheme as SchemeKey);
      return;
    }
    // Alt/Option-click selects an element and opens the Element tab even when Inspect is closed.
    if (!inspecting && !e.altKey) return;
    const el = (e.target as Element).closest(PAINT_SELECTOR) as HTMLElement | null;
    if (el && row.current?.contains(el)) onSelect(el);
  };

  return (
    <div className="fit" ref={fit} style={{ height: natural.h ? natural.h * scale : undefined }}>
      <div className={`phones${inspecting ? ' inspecting' : ''}${build ? ' building' : ''}`} ref={row} style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
        onClick={onClick} onPointerMove={build ? onMove : undefined} onPointerLeave={() => setHover(null)}>
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

