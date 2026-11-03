import { useEffect, useRef } from 'react';
import { SCHEME_KEYS, kebab, schemeLabel, type Colors, type SchemeKey } from '../theme/library';
import { SCREENS } from '../screens';
import { collectSpecs, fillOf, resolveLayers, specRatio, type Fills, type PaintSpec } from './inspect';
import { CATALOG, FILLABLE } from '../theme/gfill';
import { isRole, type Role } from '../theme/library';

/** screen id -> text/icon elements of that screen, reduced to roles. The structure does not depend on the theme. */
export type ScreenSpecs = Map<string, PaintSpec[]>;

export interface ThemeAudit {
  /** Distinct role pairs (text role on its background layers) below AA in at least one mode, across all screens. */
  fails: number;
  /** Failing elements per screen per mode. */
  byScreen: Record<string, Record<SchemeKey, number>>;
  /** Plain-language list for a tooltip. */
  detail: string[];
  /** Text and icon elements checked per mode, across all screens. */
  checked: number;
}

const cache = new WeakMap<Colors, Map<string, ThemeAudit>>();

export function auditTheme(colors: Colors, specs: ScreenSpecs, fl?: Fills | null): ThemeAudit {
  const gk = fl && fl.fills.length ? JSON.stringify(fl) : '';
  const hit = cache.get(colors)?.get(gk);
  if (hit) return hit;
  const failing = new Map<string, { label: string; modes: Set<SchemeKey> }>();
  const byScreen: ThemeAudit['byScreen'] = {};
  for (const [id, list] of specs) {
    byScreen[id] = Object.fromEntries(SCHEME_KEYS.map((k) => [k, 0])) as Record<SchemeKey, number>;
    for (const k of SCHEME_KEYS) {
      const s = colors[k];
      for (const p of list) {
        if (specRatio(p, s, fl) >= p.need) continue;
        byScreen[id][k]++;
        const f = failing.get(p.sig) ?? { label: fillOf(p, fl) ? `text on a gradient fill` : `${kebab(p.fg)} on ${resolveLayers(p.layers, s).roles.map(kebab).join(' over ')}`, modes: new Set() };
        f.modes.add(k);
        failing.set(p.sig, f);
      }
    }
  }
  const detail = [...failing.values()].map((f) => `${f.label} (${[...f.modes].map((m) => schemeLabel(m)).join(', ')})`);
  const checked = [...specs.values()].reduce((n, l) => n + l.length, 0);
  const out = { fails: failing.size, byScreen, detail, checked };
  if (specs.size) { if (!cache.has(colors)) cache.set(colors, new Map()); cache.get(colors)!.set(gk, out); }
  return out;
}

/** Renders every screen once, off screen and unstyled by any theme, to read their role structure. */
export function SpecProbe({ onSpecs }: { onSpecs: (s: ScreenSpecs) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const m: ScreenSpecs = new Map();
      ref.current?.querySelectorAll<HTMLElement>('[data-probe]').forEach((host) => {
        m.set(host.dataset.probe!, collectSpecs(host));
        // Catalogue of fillable elements, so gradient-fill labels resolve for screens that are not on show.
        const items: { cls: string; bg: Role | '' }[] = [];
        host.querySelectorAll(FILLABLE).forEach((node) => {
          const bg = (node as HTMLElement).dataset.bg ?? '';
          items.push({ cls: node.classList[0] ?? '', bg: isRole(bg) ? bg : '' });
        });
        CATALOG.set(host.dataset.probe!, items);
      });
      onSpecs(m);
    });
    return () => cancelAnimationFrame(id);
  }, [onSpecs]);
  return (
    <div ref={ref} className="probe" aria-hidden="true" hidden>
      {SCREENS.map((s) => <div key={s.id} data-probe={s.id} className="screen-host"><s.Component /></div>)}
    </div>
  );
}
