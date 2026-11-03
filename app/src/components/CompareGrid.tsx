import { contrast } from '../theme/contrast';
import { KEY_PAIRS } from '../theme/groups';
import { COLORS, SCHEME_KEYS, schemeLabel, type SchemeKey } from '../theme/library';
import type { ScreenDef } from '../screens';
import { Ms } from './Segmented';

export function CompareGrid({ screen, onOpen }: { screen: ScreenDef; themeKey: string; onOpen: (k: SchemeKey) => void }) {
  const S = screen.Component;
  return (
    <section className="compare" aria-label={`${screen.label} in all 6 modes`}>
      {SCHEME_KEYS.map((k) => {
        const s = COLORS[k];
        const pass = KEY_PAIRS.filter(([a, b]) => contrast(s[a], s[b]) >= 4.5).length;
        return (
          <button key={k} type="button" className="cmp-card" onClick={() => onOpen(k)} aria-label={`Open ${schemeLabel(k)} full size`}>
            <span className="cmp-h">
              <Ms n={k.startsWith('dark') ? 'dark_mode' : 'light_mode'} />
              {schemeLabel(k)}
              <span className="sub mono">{k}</span>
            </span>
            <span className="cmp-body" aria-hidden="true">
              <span className="cmp-scale screen-host" data-scheme={k} data-screen={screen.id}><S /></span>
            </span>
            <span className="cmp-foot">
              {(['primary', 'secondary', 'tertiary', 'error', 'surface', 'outline'] as const).map((r) => (
                <i key={r} className="mini-sw" style={{ background: s[r] }} title={`${r} ${s[r]}`} />
              ))}
              <span className={`pass${pass < KEY_PAIRS.length ? ' warn' : ''}`}>{pass}/{KEY_PAIRS.length} key pairs ≥ 4.5:1</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
