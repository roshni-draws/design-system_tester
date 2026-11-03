import type { KeyboardEvent } from 'react';
import { ACTIVE, library } from '../theme/library';
import { download, exportCss, exportFlutter, exportJson, exportTailwind, type ExportFile } from '../theme/exporters';
import { Ms } from './Segmented';
import { usePopover } from './usePopover';

export type Mode = 'light' | 'dark';
export type Contrast = '' | 'medium' | 'high';
export type View = 'single' | 'modes' | 'themes';

const generated = library.description.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '';

const VIEWS: { value: View; label: string; icon: string }[] = [
  { value: 'single', label: 'Light and dark', icon: 'splitscreen_left' },
  { value: 'modes', label: 'All 6 modes', icon: 'grid_view' },
  { value: 'themes', label: 'All themes', icon: 'view_comfy' },
];
const EXPORTS: { icon: string; title: string; make: () => ExportFile }[] = [
  { icon: 'css', title: 'CSS variables', make: exportCss },
  { icon: 'air', title: 'Tailwind v4', make: exportTailwind },
  { icon: 'data_object', title: 'JSON', make: exportJson },
  { icon: 'flutter', title: 'Flutter', make: exportFlutter },
];

/** Arrow-key movement between the items of an open menu. */
function menuKeys(e: KeyboardEvent<HTMLDivElement>) {
  const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role^=menuitem]')];
  const i = items.indexOf(document.activeElement as HTMLButtonElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
}

function LayoutMenu({ view, onView }: { view: View; onView: (v: View) => void }) {
  const p = usePopover();
  const done = () => { p.setOpen(false); p.trigger.current?.focus(); };
  return (
    <div className="pop-wrap" ref={p.wrap}>
      <button ref={p.trigger} type="button" className="icon-btn" aria-haspopup="menu" aria-expanded={p.open} aria-label="Layout and export" title="Layout and export" onClick={() => p.setOpen((o) => !o)}>
        <Ms n="dashboard" size={20} />
      </button>
      {p.open && (
        <div className="menu" role="menu" aria-label="Layout and export" onKeyDown={menuKeys} ref={(el) => el?.querySelector<HTMLButtonElement>('[role^=menuitem]')?.focus()}>
          <p className="menu-h">Layout</p>
          {VIEWS.map((v) => (
            <button key={v.value} type="button" role="menuitemradio" aria-checked={view === v.value} onClick={() => { onView(v.value); done(); }}>
              <Ms n={v.icon} />{v.label}{view === v.value && <Ms n="check" />}
            </button>
          ))}
          <p className="menu-h">Export the active theme, 6 modes</p>
          {EXPORTS.map((x) => (
            <button key={x.title} type="button" role="menuitem" onClick={() => { download(x.make()); done(); }}>
              <Ms n={x.icon} />{x.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function About() {
  const p = usePopover();
  return (
    <div className="pop-wrap" ref={p.wrap}>
      <button ref={p.trigger} type="button" className="icon-btn" aria-expanded={p.open} aria-label="About this tool" title="About" onClick={() => p.setOpen((o) => !o)}>
        <Ms n="info" size={20} />
      </button>
      {p.open && (
        <div className="menu about" role="dialog" aria-label="About">
          <p>Previews ANTZ colour themes on 12 screens from the ANTZ mobile app, with live WCAG contrast checks.</p>
          <p className="muted">Library: ANTZ_colour_library.json, generated {generated}. Active theme: {ACTIVE.name}{ACTIVE.library ? '' : ` (${ACTIVE.style})`}.</p>
        </div>
      )}
    </div>
  );
}

export function TopBar({ mode, view, inspecting, onMode, onView, onInspect }: { mode: Mode; view: View; inspecting: boolean; onMode: (m: Mode) => void; onView: (v: View) => void; onInspect: () => void }) {
  const dark = mode === 'dark';
  return (
    <header className="topbar">
      <span className="brand">
        <svg className="mark" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" /><circle cx="10" cy="10" r="4" /></svg>
        ANTZ Theme Tester
      </span>
      <span className="spacer" />
      <button type="button" className="icon-btn" aria-pressed={inspecting} aria-label="Inspect roles and contrast" title="Inspect" onClick={onInspect}>
        <Ms n="frame_inspect" size={20} />
      </button>
      <LayoutMenu view={view} onView={onView} />
      <button type="button" className="icon-btn" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'} onClick={() => onMode(dark ? 'light' : 'dark')}>
        <Ms n={dark ? 'light_mode' : 'dark_mode'} size={20} />
      </button>
      <About />
    </header>
  );
}
