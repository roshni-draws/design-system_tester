import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  CATEGORIES, DEFAULT_FAMILY, FONT_TARGETS, TYPE_ROLES, WEIGHT_NAMES, countTypes, familyByName, fontOf, loadPreview, previewFamily, stackOf, tagTypes,
  typeRoleById, type FontCategory, type FontFamily, type FontTarget, type TypeFonts, type TypeRole,
} from '../theme/fonts';
import { SCREENS } from '../screens';
import { Ms } from './Segmented';

const ROW = 40;
const VIEW = 280;

/**
 * Searchable list of Google Fonts for one role: a combobox (the search field) over a windowed listbox, so only the rows in
 * view exist. Each visible row loads a preview of its own name shortly after it appears.
 */
function FontChooser({ list, value, role, onPick }: { list: FontFamily[] | null; value: string; role: string; onPick: (name: string) => void }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<FontCategory | 'all'>('all');
  const [active, setActive] = useState(0);
  const [top, setTop] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list ?? []).filter((f) => (cat === 'all' || f.cat === cat) && (!q || f.name.toLowerCase().includes(q)));
  }, [list, query, cat]);

  const scrollTo = (i: number) => {
    const b = box.current;
    if (!b) return;
    if (i * ROW < b.scrollTop) b.scrollTop = i * ROW;
    else if ((i + 1) * ROW > b.scrollTop + VIEW) b.scrollTop = (i + 1) * ROW - VIEW;
    setTop(b.scrollTop);
  };
  // A new role, or a new filter: start at the role's current font when it is in the list, else at the top.
  useEffect(() => {
    const i = Math.max(0, items.findIndex((f) => f.name === value));
    setActive(i);
    const b = box.current;
    if (b) { b.scrollTop = Math.max(0, i * ROW - VIEW / 2 + ROW / 2); setTop(b.scrollTop); }
  }, [items, role]);

  const first = Math.max(0, Math.floor(top / ROW) - 4);
  const last = Math.min(items.length, Math.ceil((top + VIEW) / ROW) + 4);
  const rows = items.slice(first, last);

  // Previews for the rows in view, after scrolling settles for a moment.
  const inView = rows.map((f) => f.name).join('|');
  useEffect(() => {
    const t = setTimeout(() => rows.forEach((f) => loadPreview(f)), 120);
    return () => clearTimeout(t);
    // keyed on the names in view, not the array, so other re-renders do not restart the wait
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const page = Math.floor(VIEW / ROW) - 1;
    const d = { ArrowDown: 1, ArrowUp: -1, PageDown: page, PageUp: -page }[e.key];
    if (d) {
      e.preventDefault();
      const n = Math.max(0, Math.min(items.length - 1, active + d));
      setActive(n);
      scrollTo(n);
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      onPick(items[active].name);
    } else if (e.key === 'Escape' && query) {
      e.preventDefault();
      setQuery('');
    }
  };

  const optId = (i: number) => `fc-opt-${i}`;
  return (
    <div className="fc">
      <label className="search fc-search">
        <Ms n="search" size={20} />
        <span className="sr-only">Search Google Fonts</span>
        <input type="search" role="combobox" aria-expanded="true" aria-controls="fc-list" aria-autocomplete="list"
          aria-activedescendant={items[active] ? optId(active) : undefined} placeholder="Search Google Fonts"
          value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey} />
      </label>
      <div className="fc-cats" role="group" aria-label="Category">
        {[{ id: 'all' as const, label: 'All' }, ...CATEGORIES].map((c) => (
          <button key={c.id} type="button" className="fc-cat" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
      </div>
      <p className="fc-count muted" aria-live="polite">
        {list ? `${items.length} ${items.length === 1 ? 'family' : 'families'}${cat !== 'all' || query ? ' match' : ' from Google Fonts'}` : 'Loading the font list…'}
      </p>
      <div className="fc-box" ref={box} style={{ height: VIEW }} onScroll={(e) => setTop(e.currentTarget.scrollTop)}>
        <div id="fc-list" role="listbox" aria-label={`Font for ${role}`} style={{ height: items.length * ROW, position: 'relative' }}>
          {rows.map((f, j) => {
            const i = first + j;
            const on = f.name === value;
            return (
              <div key={f.name} id={optId(i)} role="option" aria-selected={on} className={`fc-row${i === active ? ' active' : ''}${on ? ' on' : ''}`}
                style={{ top: i * ROW }} onMouseDown={(e) => e.preventDefault()} onClick={() => { setActive(i); onPick(f.name); }}>
                <span className="fc-name" style={{ fontFamily: `${previewFamily(f.name)}, ${stackOf(f.name).split(', ').pop()}` }}>{f.name}</span>
                <span className="fc-meta">{CATEGORIES.find((c) => c.id === f.cat)!.label} · {f.weights.length} {f.weights.length === 1 ? 'weight' : 'weights'}</span>
                {on && <Ms n="check" size={18} />}
              </div>
            );
          })}
        </div>
        {list && !items.length && <p className="muted fc-empty">No fonts match. Try another name or category.</p>}
      </div>
    </div>
  );
}

/** Text styles per screen id: how many text elements of each role the screen has. */
export type ScreenTypes = Record<string, Record<TypeRole, number>>;

/**
 * Renders every screen once, hidden, tags its text and reports the counts per screen (like SpecProbe for colours). Lets the
 * panel name the screens that use a style which is not on the screen on show. Tagging these also records their weights, so
 * a chosen family loads every weight any screen needs.
 */
export function TypeProbe({ onTypes }: { onTypes: (t: ScreenTypes) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const root = ref.current;
      if (!root) return;
      tagTypes(root);
      const out: ScreenTypes = {};
      root.querySelectorAll<HTMLElement>('[data-type-probe]').forEach((h) => { out[h.dataset.typeProbe!] = countTypes(h); });
      onTypes(out);
    });
    return () => cancelAnimationFrame(id);
  }, [onTypes]);
  return (
    <div ref={ref} className="probe" aria-hidden="true" hidden>
      {SCREENS.map((s) => <div key={s.id} data-type-probe={s.id} className="screen-host"><s.Component /></div>)}
    </div>
  );
}

/**
 * Side-panel body for "Build your own font family": All text (the whole family) and every type role with its font in
 * effect, then the font and weight for the selected one. Roles with no text on the screen on show are muted; picking one
 * says which screens use it. Selection is shared with the phones (click text there).
 */
export function FontPanel({ fonts, list, selected, counts, screenTypes, screenId, onSelect, onScreen, onFamily, onWeight, onResetRole, onResetAll }: {
  fonts: TypeFonts; list: FontFamily[] | null; selected: FontTarget; counts: Record<TypeRole, number> | null;
  screenTypes: ScreenTypes | null; screenId: string;
  onSelect: (r: FontTarget) => void; onScreen: (id: string) => void;
  onFamily: (r: FontTarget, family: string) => void; onWeight: (r: FontTarget, w: number | undefined) => void;
  onResetRole: (r: FontTarget) => void; onResetAll: () => void;
}) {
  const role = typeRoleById(selected)!;
  const isAll = selected === 'all';
  const cur = fontOf(fonts, selected);
  const fam = familyByName(cur.family);
  const listRef = useRef<HTMLDivElement>(null);
  const changed = FONT_TARGETS.filter((r) => fonts[r.id]).length;
  const desc = (r: FontTarget) => { const f = fontOf(fonts, r); return `${f.family}${f.weight ? ` ${f.weight}` : ''}`; };
  /** Where a role's font comes from, when it is not its own pick. */
  const fromAll = (r: FontTarget) => r !== 'all' && !fonts[r] && !!fonts.all;
  const countOf = (r: FontTarget) => (counts ? (r === 'all' ? TYPE_ROLES.reduce((n, x) => n + counts[x.id], 0) : counts[r]) : undefined);
  const absent = (r: FontTarget) => countOf(r) === 0;
  const elsewhere = isAll || !screenTypes ? [] : SCREENS.filter((s) => s.id !== screenId && (screenTypes[s.id]?.[selected as TypeRole] ?? 0) > 0);
  const inheritLabel = !isAll && fonts.all ? `All text (${desc('all')})` : DEFAULT_FAMILY;

  // Keep the selected row in view when it was picked on a phone.
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(`[data-role="${selected}"]`);
    if (row && listRef.current && !listRef.current.contains(document.activeElement)) row.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  // Listbox: one tab stop; arrows, Home and End move the selection; Enter jumps to the font search.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const ids = FONT_TARGETS.map((r) => r.id);
    const i = ids.indexOf(selected);
    let n = -1;
    if (e.key === 'ArrowDown') n = Math.min(ids.length - 1, i + 1);
    else if (e.key === 'ArrowUp') n = Math.max(0, i - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = ids.length - 1;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('.fp-editor .fc-search input')?.focus();
      return;
    }
    if (n < 0) return;
    e.preventDefault();
    onSelect(ids[n]);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-role="${ids[n]}"]`)?.focus());
  };

  return (
    <div className="fp">
      <p className="muted">
        Every text style starts in Inter, as designed. Pick All text to change the whole family, or a single style below (or click text on a phone), then choose any Google Font. Fonts apply to both phones.
      </p>
      <div className="bd-head">
        <span className="bd-head-lbl">Text styles, from the M3 type scale</span>
        <span className="spacer" />
        <button type="button" className="text-btn" onClick={onResetAll} disabled={!changed}><Ms n="restart_alt" />Reset all to Inter</button>
      </div>

      <div className="fp-roles" role="listbox" aria-label="Text styles" aria-describedby="fp-roles-help" ref={listRef} onKeyDown={onKey}>
        <p id="fp-roles-help" className="sr-only">Arrow keys choose a text style. Enter moves to the font search.</p>
        {FONT_TARGETS.map((r) => {
          const on = r.id === selected;
          const f = fontOf(fonts, r.id);
          const n = countOf(r.id);
          const off = absent(r.id);
          const where = n === undefined ? '' : off ? ' · not on this screen' : ` · ${n} on this screen`;
          return (
            <div key={r.id} role="option" aria-selected={on} data-role={r.id} tabIndex={on ? 0 : -1}
              className={`bd-row fp-row${on ? ' on' : ''}${off ? ' absent' : ''}${r.id === 'all' ? ' fp-all' : ''}`} onClick={() => onSelect(r.id)} title={`${r.hint}. ${r.rule}.`}>
              <span className="fp-aa" style={{ fontFamily: stackOf(f.family), fontWeight: f.weight }} aria-hidden="true">Aa</span>
              <span className="crow-txt">
                <span>{r.label}</span>
                <small>{desc(r.id)}{fromAll(r.id) ? ' (All text)' : ''}{where}</small>
              </span>
              {fonts[r.id] && <span className="bd-edited" title="Changed"><span className="sr-only">, changed</span></span>}
            </div>
          );
        })}
      </div>

      <section className="bd-editor fp-editor" aria-label={`${role.label} font`}>
        <div className="bd-ed-h">
          <span className="crow-txt">
            <span>{role.label}: {desc(selected)}{fromAll(selected) ? ' (from All text)' : ''}</span>
            <small title={`${role.hint}. ${role.rule}.`}>{role.hint}. {role.rule}.</small>
          </span>
          <button type="button" className="text-btn small" onClick={() => onResetRole(selected)} disabled={!fonts[selected]}
            aria-label={`Reset ${role.label} to ${inheritLabel}`}>
            <Ms n="restart_alt" size={16} />{!isAll && fonts.all ? 'Reset to All text' : 'Reset to Inter'}
          </button>
        </div>
        {absent(selected) && (
          <div className="fp-absent" role="note">
            <Ms n="info" size={18} />
            <p>
              No text on this screen uses {role.label}, so changing it will not show here.{' '}
              {elsewhere.length ? <>It is used on {elsewhere.map((s, i) => (
                <span key={s.id}>{i ? (i === elsewhere.length - 1 ? ' and ' : ', ') : ''}<button type="button" className="link-btn" onClick={() => onScreen(s.id)}>{s.label}</button></span>
              ))}.</> : screenTypes ? 'No screen uses it.' : 'Try another screen.'}
              {!isAll && <> To change every style at once, pick <button type="button" className="link-btn" onClick={() => onSelect('all')}>All text</button>.</>}
            </p>
          </div>
        )}
        <label className="field fp-weight">
          <span>Weight</span>
          <select value={cur.weight ?? ''} onChange={(e) => onWeight(selected, e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">As designed</option>
            {(fam?.weights ?? []).map((w) => <option key={w} value={w}>{w} {WEIGHT_NAMES[w] ?? ''}</option>)}
          </select>
        </label>
        <FontChooser list={list} value={cur.family} role={role.label} onPick={(name) => onFamily(selected, name)} />
        {cur.family !== DEFAULT_FAMILY && <p className="muted bd-note">Only the weights this text uses are loaded from Google Fonts.</p>}
      </section>
    </div>
  );
}
