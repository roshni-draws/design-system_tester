import { themeVars } from '../theme/css';
import { schemeLabel, type SchemeKey } from '../theme/library';
import { PRESETS, colorsOf, sourcesLine, type ThemeDef } from '../theme/themes';
import type { ScreenDef } from '../screens';

import { auditTheme, type ScreenSpecs } from './themeAudit';

/** The same screen in the same mode, once per preset theme (plus the custom theme when one is active). */
export function ThemeCompareGrid({ screen, scheme, active, specs, onOpen }: { screen: ScreenDef; scheme: SchemeKey; active: ThemeDef; specs: ScreenSpecs | null; onOpen: (t: ThemeDef) => void }) {
  const S = screen.Component;
  const themes = active.id === 'custom' ? [...PRESETS, active] : PRESETS;
  return (
    <section className="compare themes" aria-label={`${screen.label} in ${schemeLabel(scheme)}, every theme`}>
      {themes.map((t) => {
        const colors = colorsOf(t);
        const s = colors[scheme];
        const fails = specs ? auditTheme(colors, specs).byScreen[screen.id]?.[scheme] ?? 0 : null;
        return (
          <button key={t.id} type="button" className={`cmp-card${t.id === active.id ? ' on' : ''}`} onClick={() => onOpen(t)} aria-label={`Preview ${t.name}`}>
            <span className="cmp-h">
              {t.name}
              <span className="sub">{sourcesLine(t.spec)}</span>
            </span>
            <span className="cmp-body" aria-hidden="true">
              <span className="cmp-scale screen-host" data-scheme={scheme} data-screen={screen.id} style={themeVars(s)}><S /></span>
            </span>
            <span className="cmp-foot">
              {(['primary', 'secondaryContainer', 'tertiary', 'surfaceContainerHigh', 'onSurface'] as const).map((r) => (
                <i key={r} className="mini-sw" style={{ background: s[r] }} title={`${r} ${s[r]}`} />
              ))}
              <span className="pass">{fails === null ? 'Checking…' : fails ? `${fails} below AA on this screen` : 'All text passes AA'}</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
