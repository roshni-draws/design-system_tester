import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { download } from '../theme/exporters';
import { exportAntzTheme, slugify } from '../theme/antzTheme';
import type { BuildColours } from '../theme/build';
import type { FontMode, TypeFonts } from '../theme/fonts';
import type { ThemeDef } from '../theme/themes';
import { Ms } from './Segmented';

export interface ThemeFileState { theme: ThemeDef; build: BuildColours; fontMode: FontMode; fonts: TypeFonts }

/** The name a theme file starts with: the preset's name, or empty for Build your own (the user names it). */
export const defaultThemeName = (state: ThemeFileState) => (state.theme.build ? '' : state.theme.name);

/** Non-blocking notes shown before exporting: missing light or dark parts, and Template fonts. */
export function themeFileWarnings(state: ThemeFileState): string[] {
  const building = !!state.theme.build;
  const noLight = building && !Object.keys(state.build.light).length;
  const noDark = building && !Object.keys(state.build.dark).length;
  const warnings: string[] = [];
  if (noLight || noDark) warnings.push(`No ${noLight && noDark ? 'light or dark' : noLight ? 'light' : 'dark'} parts are set: unset parts will use the foundation's ANTZ defaults on import.`);
  if (state.fontMode === 'template') warnings.push('Fonts are on Template, so the file sets Inter for every text style.');
  return warnings;
}

/** The validation message for a theme name, or '' when it is fine. */
export const themeNameError = (name: string) => (name.trim() ? '' : 'Enter a name for the theme.');

/**
 * Asks for a name, then downloads <slug>.antz-theme.json. Modal: focus starts in the name field, Tab stays inside,
 * Esc or Cancel closes, and focus goes back to `returnTo` (the menu trigger) on close.
 */
export function ThemeFileDialog({ state, onClose, returnTo }: { state: ThemeFileState; onClose: () => void; returnTo: HTMLElement | null }) {
  const ref = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [name, setName] = useState(() => defaultThemeName(state));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const slug = slugify(name);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')];
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!ref.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); returnTo?.focus(); };
  }, [onClose, returnTo]);

  const warnings = themeFileWarnings(state);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = themeNameError(name);
    if (invalid) { setError(invalid); input.current?.focus(); return; }
    setBusy(true);
    try {
      download(await exportAntzTheme({ ...state, name, hash: location.hash }));
      onClose();
    } catch (err) {
      setError(`Could not make the file: ${(err as Error).message}`);
      setBusy(false);
    }
  };

  return createPortal(
    <div className="sheet-scrim tf-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="tf" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`} ref={ref} onSubmit={submit}>
        <h2 id={`${id}-t`}>Export ANTZ theme file</h2>
        <p id={`${id}-d`} className="muted">Colours and fonts in one .json file, for importing into the ANTZ foundation site.</p>
        <label className="tf-field" htmlFor={`${id}-n`}>Theme name</label>
        <input id={`${id}-n`} ref={input} className="tf-input" type="text" value={name} maxLength={64} autoComplete="off" spellCheck={false}
          aria-invalid={!!error} aria-describedby={`${id}-f${error ? ` ${id}-e` : ''}`} onChange={(e) => { setName(e.target.value); setError(''); }} />
        <p id={`${id}-f`} className="tf-file muted">File: <code>{slug}.antz-theme.json</code></p>
        {error && <p id={`${id}-e`} className="warn-line" role="alert">{error}</p>}
        {warnings.length > 0 && (
          <ul className="tf-warn" aria-label="Before you export">
            {warnings.map((w) => <li key={w}><Ms n="info" size={18} />{w}</li>)}
          </ul>
        )}
        <div className="tf-actions">
          <button type="button" className="text-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn tf-go" disabled={busy}><Ms n="download" size={18} />{busy ? 'Exporting…' : 'Export'}</button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
