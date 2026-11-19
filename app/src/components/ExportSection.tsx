import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { download } from '../theme/exporters';
import { exportAntzTheme, slugify } from '../theme/antzTheme';
import { DEFAULT_FAMILY, TYPE_ROLES, WEIGHT_NAMES, fontOf, loadFontList } from '../theme/fonts';
import { Ms } from './Segmented';
import { defaultThemeName, themeFileWarnings, themeNameError, type ThemeFileState } from './ThemeFileDialog';
import { EXPORTS, FORMATS_UNAVAILABLE } from './TopBar';

/** "Custom: 2 light parts, 1 dark part set", or the preset's name. */
function colourSource({ theme, build }: ThemeFileState) {
  if (!theme.build) return theme.name;
  const n = (k: number, m: string) => `${k} ${m} ${k === 1 ? 'part' : 'parts'}`;
  return `Custom: ${n(Object.keys(build.light).length, 'light')}, ${n(Object.keys(build.dark).length, 'dark')} set`;
}

/** Resolved family (and weight) per text style, grouped: [["Poppins", "Display, Headline, Body, Label"], ["Lora Bold", "Title"]]. */
function fontGroups({ fontMode, fonts }: ThemeFileState): [string, string][] | null {
  if (fontMode === 'template') return null;
  const groups = new Map<string, string[]>();
  for (const r of TYPE_ROLES) {
    const f = fontOf(fonts, r.id);
    const key = f.weight ? `${f.family} ${WEIGHT_NAMES[f.weight] ?? f.weight}` : f.family;
    groups.set(key, [...(groups.get(key) ?? []), r.label]);
  }
  return [...groups].map(([k, v]) => [k, v.join(', ')]);
}

/**
 * Side-panel "Export theme" section: what goes into the ANTZ theme file, an inline name field with the file name, and
 * download or copy of the same JSON the top-bar dialog makes. Presets also get the single-theme formats.
 */
export function ExportSection({ state }: { state: ThemeFileState }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const building = !!state.theme.build;
  // Follows the prefill (preset name, or empty for Build your own) until the user types; a new theme starts it again.
  const themeKey = building ? 'build' : state.theme.id;
  const [typed, setTyped] = useState<string | null>(null);
  useEffect(() => setTyped(null), [themeKey]);
  const name = typed ?? defaultThemeName(state);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // Warm the Google Fonts list (the file's font categories need it) so Copy stays inside the click's user activation.
  useEffect(() => { void loadFontList().catch(() => undefined); }, []);

  const say = (msg: string) => {
    setStatus(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), 4000);
  };

  /** Validates the name, then makes the file with the same builder as the top-bar dialog. */
  const make = async () => {
    const invalid = themeNameError(name);
    if (invalid) { setError(invalid); input.current?.focus(); return null; }
    return exportAntzTheme({ ...state, name, hash: location.hash });
  };
  const run = async (act: 'download' | 'copy') => {
    setBusy(true);
    try {
      const file = await make();
      if (!file) return;
      if (act === 'download') { download(file); say(`Downloaded ${file.name}.`); }
      else { await navigator.clipboard.writeText(file.body); say('Theme JSON copied to the clipboard.'); }
    } catch (err) {
      setError(act === 'copy' ? 'Could not copy: the browser blocked the clipboard. Use Download theme file instead.' : `Could not make the file: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); void run('download'); };

  const warnings = themeFileWarnings(state);
  const fonts = fontGroups(state);

  return (
    <section className="ex" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`}>Export theme</h2>
      <form className="ex-card" onSubmit={submit} noValidate>
        <dl className="ex-sum">
          <div><dt>Colours</dt><dd>{colourSource(state)}</dd></div>
          <div>
            <dt>Fonts</dt>
            <dd>
              {fonts ? (
                <ul className="ex-fonts">
                  {fonts.map(([f, roles]) => <li key={f}><span>{f}</span> <small>{roles}</small></li>)}
                </ul>
              ) : `Template (${DEFAULT_FAMILY})`}
            </dd>
          </div>
        </dl>
        {warnings.length > 0 && (
          <ul className="tf-warn ex-warn" aria-label="Before you export">
            {warnings.map((w) => <li key={w}><Ms n="info" size={18} />{w}</li>)}
          </ul>
        )}

        <label className="tf-field" htmlFor={`${id}-n`}>Theme name</label>
        <input id={`${id}-n`} ref={input} className="tf-input" type="text" value={name} maxLength={64} autoComplete="off" spellCheck={false}
          placeholder="Name your theme" aria-invalid={!!error} aria-describedby={`${id}-f${error ? ` ${id}-e` : ''}`}
          onChange={(e) => { setTyped(e.target.value); setError(''); }} />
        <p id={`${id}-f`} className="tf-file muted">File: <code>{slugify(name)}.antz-theme.json</code></p>
        {error && <p id={`${id}-e`} className="warn-line" role="alert">{error}</p>}

        <div className="ex-actions">
          <button type="submit" className="btn tf-go" disabled={busy}><Ms n="download" size={18} />Download theme file</button>
          <button type="button" className="btn" disabled={busy} onClick={() => void run('copy')}><Ms n="content_copy" size={18} />Copy to clipboard</button>
        </div>
        <p className="ex-status" role="status" aria-live="polite">{status && <><Ms n="check" size={16} />{status}</>}</p>
        <p className="muted">Import it on the Foundation site: Import theme.</p>

        <div className="ex-other" role="group" aria-labelledby={`${id}-o`} aria-describedby={building ? `${id}-r` : undefined}>
          <p id={`${id}-o`} className="ex-other-h">Other formats{building ? '' : ', active theme, 6 modes'}</p>
          <div className="ex-other-row">
            {EXPORTS.map((x) => (
              <button key={x.title} type="button" className="btn ex-mini" disabled={building} onClick={() => download(x.make())}
                aria-label={`Download ${x.title}`} title={building ? FORMATS_UNAVAILABLE : `Download ${x.title}`}>
                <Ms n={x.icon} size={16} />{x.title.replace(' variables', '')}
              </button>
            ))}
          </div>
          {building && <p id={`${id}-r`} className="muted">{FORMATS_UNAVAILABLE}.</p>}
        </div>
      </form>
    </section>
  );
}
