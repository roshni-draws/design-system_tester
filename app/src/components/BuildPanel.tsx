import { useEffect, useRef, type KeyboardEvent } from 'react';
import { GROUPS, PARTS, partById, partColour, type BuildColours, type BuildMode } from '../theme/build';
import type { SchemeKey } from '../theme/library';
import { ColorPicker } from './ColorPicker';
import { Ms, Segmented } from './Segmented';

const MODES = [
  { value: 'light' as const, label: <><Ms n="light_mode" size={16} />Light</> },
  { value: 'dark' as const, label: <><Ms n="dark_mode" size={16} />Dark</> },
];

/**
 * Side-panel body for the "Build your own" theme: which mode is being edited, the free colour picker for the selected
 * part, and every part of the screens with its current colour. Selection is shared with the phones (click a part there).
 */
export function BuildPanel({ build, scheme, mode, selected, recents, onMode, onSelect, onColour, onCommit, onResetPart, onResetAll }: {
  build: BuildColours; scheme: SchemeKey; mode: BuildMode; selected: string | null; recents: string[];
  onMode: (m: BuildMode) => void; onSelect: (id: string) => void; onColour: (id: string, hex: string) => void; onCommit: (hex: string) => void;
  onResetPart: (id: string) => void; onResetAll: () => void;
}) {
  const part = partById(selected);
  const list = useRef<HTMLDivElement>(null);
  const hexOf = (id: string) => partColour(build, partById(id)!, scheme);
  const edited = (id: string) => build[mode][id] !== undefined;
  const count = Object.keys(build.light).length + Object.keys(build.dark).length;
  const modeName = mode === 'dark' ? 'dark' : 'light';

  // Keep the selected row in view when it was picked on a phone (not on first open, so the panel starts at the top).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!selected) return;
    const row = list.current?.querySelector<HTMLElement>(`[data-part="${selected}"]`);
    if (row && list.current && !list.current.contains(document.activeElement)) row.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  // Listbox: one tab stop; arrows, Home and End move the selection; Enter jumps to the hex field.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const ids = PARTS.map((p) => p.id);
    const i = Math.max(0, ids.indexOf(selected ?? ''));
    let n = -1;
    if (e.key === 'ArrowDown') n = Math.min(ids.length - 1, i + 1);
    else if (e.key === 'ArrowUp') n = Math.max(0, i - 1);
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = ids.length - 1;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.querySelector<HTMLInputElement>('.bd-editor .cp-hex-in')?.focus();
      return;
    }
    if (n < 0) return;
    e.preventDefault();
    onSelect(ids[n]);
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-part="${ids[n]}"]`)?.focus());
  };

  return (
    <>
      <h2>Build your own</h2>
      <p className="muted">
        Every screen starts in neutral grey. Pick a part below or click it on a phone, then give it any colour. Click the same spot again to step to the part behind it.
      </p>
      <div className="bd-head">
        <span className="bd-head-lbl" aria-hidden="true">Editing</span>
        <Segmented label="Mode being edited" value={mode} options={MODES} onChange={onMode} />
        <span className="spacer" />
        <button type="button" className="text-btn" onClick={onResetAll} disabled={!count}><Ms n="format_color_reset" />Reset all to grey</button>
      </div>

      <section className="bd-editor" aria-label={part ? `${part.label}, ${modeName} mode colour` : 'Part colour'}>
        {part ? (
          <>
            <div className="bd-ed-h">
              <span className="dot sm" style={{ background: hexOf(part.id) }} aria-hidden="true" />
              <span className="crow-txt">
                <span>{part.label}</span>
                <small title={part.hint}>{part.hint}</small>
              </span>
              <button type="button" className="text-btn small" onClick={() => onResetPart(part.id)} disabled={!edited(part.id)}
                aria-label={`Reset ${part.label} to grey in ${modeName} mode`}>
                <Ms n="restart_alt" size={16} />Reset to grey
              </button>
            </div>
            <ColorPicker value={hexOf(part.id)} label={part.label} recents={recents} onChange={(hex) => onColour(part.id, hex)} onCommit={onCommit} />
            <p className="muted bd-note">Applies to {modeName} mode at every contrast level. {edited(part.id) ? '' : 'Still grey.'}</p>
          </>
        ) : (
          <p className="muted">Pick a part to colour.</p>
        )}
      </section>

      <div className="bd-list" role="listbox" aria-label="Screen parts" aria-describedby="bd-list-help" ref={list} onKeyDown={onKey}>
        <p id="bd-list-help" className="sr-only">Arrow keys choose a part. Enter moves to its hex field.</p>
        {GROUPS.map((g) => (
          <div key={g.id} role="group" aria-labelledby={`bd-g-${g.id}`}>
            <p className="bd-group" id={`bd-g-${g.id}`}>{g.label}</p>
            {PARTS.filter((p) => p.group === g.id).map((p) => {
              const on = p.id === selected;
              const hex = hexOf(p.id);
              return (
                <div key={p.id} role="option" aria-selected={on} data-part={p.id} tabIndex={on || (!selected && p.id === PARTS[0].id) ? 0 : -1}
                  className={`bd-row${on ? ' on' : ''}`} onClick={() => onSelect(p.id)} title={p.hint}>
                  <span className="bd-sw" style={{ background: hex }} aria-hidden="true" />
                  <span className="bd-name">{p.label}</span>
                  {edited(p.id) && <span className="bd-edited" title="Coloured">
                    <span className="sr-only">, coloured</span></span>}
                  <span className="hex">{hex}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
