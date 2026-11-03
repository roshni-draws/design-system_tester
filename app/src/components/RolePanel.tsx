import { useMemo, useState } from 'react';
import { contrast, grade } from '../theme/contrast';
import { ROLE_GROUPS } from '../theme/groups';
import { ACTIVE, COLORS, SCHEME_KEYS, kebab, schemeLabel, type Role, type SchemeKey } from '../theme/library';
import { Ms } from './Segmented';

/** Plain-text WCAG grade: no fills, failures in the one warning colour. */
export function Badge({ ratio }: { ratio: number }) {
  const g = grade(ratio);
  return <span className={`grade${g === 'Fail' ? ' fail' : ''}`}>{g}</span>;
}

export function RolePanel({ scheme, themeKey, highlight, onHighlight, usage }: { scheme: SchemeKey; themeKey: string; highlight: Role | null; onHighlight: (r: Role | null) => void; usage: Map<Role, number> | null }) {
  const [q, setQ] = useState('');
  const [failing, setFailing] = useState(false);
  const s = COLORS[scheme];

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase().replace(/\s+/g, '-');
    return ROLE_GROUPS.map((g) => ({
      ...g,
      rows: g.rows.filter(([r, p]) => {
        if (needle && !kebab(r).includes(needle) && !g.name.toLowerCase().includes(needle)) return false;
        if (failing) return p !== null && contrast(s[r], s[p]) < 4.5;
        return true;
      }),
    })).filter((g) => g.rows.length);
  }, [q, failing, s]);

  /** Pairs below AA in any of the 6 modes. */
  const anyModeFails = useMemo(() => {
    let n = 0;
    for (const g of ROLE_GROUPS) for (const [r, p] of g.rows) if (p && SCHEME_KEYS.some((k) => contrast(COLORS[k][r], COLORS[k][p]) < 4.5)) n++;
    return n;
    // themeKey: recount when the active theme changes (COLORS is a live binding)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeKey]);

  return (
    <div className="roles">
      <label className="search">
        <Ms n="search" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter roles" aria-label="Filter roles" />
      </label>
      <label className="check"><input type="checkbox" checked={failing} onChange={(e) => setFailing(e.target.checked)} /> Only pairs below AA in {schemeLabel(scheme)}</label>
      {groups.map((g) => (
        <details key={g.name} className="group" open={!g.ext || !!q || failing || g.rows.some(([r]) => r === highlight)}>
          <summary><Ms n="chevron_right" size={18} />{g.name}<span className="count">{g.rows.length}</span></summary>
          <ul className="dlist">
            {g.rows.map(([r, p]) => {
              const ratio = p ? contrast(s[r], s[p]) : null;
              const used = usage?.get(r) ?? 0;
              return (
                <li key={r} className={highlight === r ? 'hl' : ''}>
                  <button type="button" className="line" aria-pressed={highlight === r} onClick={() => onHighlight(highlight === r ? null : r)}
                    title={`${kebab(r)} ${s[r]}${p ? `, tested on ${kebab(p)}` : ''}. ${usage ? (used ? `Used ${used}× on this screen.` : 'Not on this screen.') : ''} Select to highlight.`}>
                    <i className="rchip" style={{ background: s[r] }} aria-hidden="true" />
                    <span className="grow ellip">{kebab(r)}</span>
                    <span className="hex">{s[r]}</span>
                    {ratio !== null ? <span className="num">{ratio.toFixed(1)} <Badge ratio={ratio} /></span> : <span className="num muted">—</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
      {!groups.length && <p className="muted">No roles match.</p>}
      <p className="muted note">
        Values from {ACTIVE.library ? 'ANTZ_colour_library.json' : `the ${ACTIVE.name} theme`}. Contrast is each role on its pair; {anyModeFails} paired {anyModeFails === 1 ? 'row falls' : 'rows fall'} below 4.5:1 in at least one mode.
      </p>
    </div>
  );
}
