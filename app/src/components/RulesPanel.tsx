import type { CSSProperties, ReactNode } from 'react';
import { contrast } from '../theme/contrast';
import { KEY_PAIRS } from '../theme/groups';
import { COLORS, LIBRARY_COLORS, SCHEME_KEYS, cssVar as v, schemeLabel, type Role, type SchemeKey } from '../theme/library';
import { gradientsOf, onGradient } from '../theme/gradients';
import { PRESETS, type ThemeDef } from '../theme/themes';
import { Ms } from './Segmented';
import { Sheet } from './Sheet';

/** Where a rule comes from. Shown as quiet text, never a badge. */
type Src = 'md' | 'm3' | 'measured' | 'rec';
const SRC: Record<Src, string> = { md: 'Library notes', m3: 'Material 3', measured: 'Measured in this tool', rec: 'Recommendation' };
const Rule = ({ src, children }: { src: Src[]; children: ReactNode }) => (
  <li><span>{children}</span> <small className="src">{src.map((x) => SRC[x]).join(' · ')}</small></li>
);
const fmt = (n: number) => n.toFixed(2);
const range = (xs: number[]) => `${fmt(Math.min(...xs))}–${fmt(Math.max(...xs))}:1`;

/** One live Do or Don't example, drawn with the role variables of the active theme in one mode. */
function Example({ ok, title, ratio, note, scheme, children }: { ok: boolean; title: string; ratio?: number; note?: string; scheme: SchemeKey; children: ReactNode }) {
  return (
    <figure className={`ex ${ok ? 'do' : 'dont'}`}>
      <div className="ex-stage screen-host" data-scheme={scheme} style={{ background: v('surface'), color: v('onSurface') }}>{children}</div>
      <figcaption>
        <b><Ms n={ok ? 'check' : 'close'} size={16} />{ok ? 'Do' : 'Don’t'}</b> {title}
        <span className="ex-ratio">{ratio !== undefined ? `${fmt(ratio)}:1` : note}</span>
      </figcaption>
    </figure>
  );
}

export function RulesPanel({ theme, scheme, onClose }: { theme: ThemeDef; scheme: SchemeKey; onClose: () => void }) {
  const s = COLORS[scheme];
  const c = (a: Role, b: Role) => contrast(s[a], s[b]);
  // Measured facts, recomputed live (library values where the rule is about the library).
  const libGrads = gradientsOf(PRESETS[0]).map((g) => ({ name: g.name, ...onGradient(g) }));
  const std = ['light', 'dark'] as SchemeKey[];
  const ovLib = std.map((k) => contrast(LIBRARY_COLORS[k].outlineVariant, LIBRARY_COLORS[k].surface));
  const ovHigh = (['light-high-contrast', 'dark-high-contrast'] as SchemeKey[]).map((k) => contrast(LIBRARY_COLORS[k].outlineVariant, LIBRARY_COLORS[k].surface));
  const outLib = std.map((k) => contrast(LIBRARY_COLORS[k].outline, LIBRARY_COLORS[k].surface));
  const pairsActive = SCHEME_KEYS.map((k) => KEY_PAIRS.filter(([a, b]) => contrast(COLORS[k][a], COLORS[k][b]) >= 4.5).length);
  const pairsAll = pairsActive.every((n) => n === KEY_PAIRS.length);
  const tealOn = gradientsOf(theme).find((g) => g.id === 'teal-to-green')!;
  const greenNavy = gradientsOf(theme).find((g) => g.id === 'green-to-navy')!;
  const g = (x: typeof tealOn) => ({ backgroundImage: `linear-gradient(135deg, ${x.stops.map((t) => t.hex).join(', ')})`, color: onGradient(x).hex } as CSSProperties);

  return (
    <Sheet title="Colour rules" returnFocus="btn-rules" onClose={onClose}
      sub={<>Draft for team review. Examples use {theme.name}, {schemeLabel(scheme)}; change the theme or mode to check them.</>}>
      <article className="rules">
        <p className="lead">How to use the ANTZ palette in product UI. Each rule says where it comes from: the library notes (antz-colour-library.md), Material 3 colour-role guidance, a measurement in this tool, or a recommendation that still needs the team’s agreement.</p>

        <h3>Roles, not hex</h3>
        <ul>
          <Rule src={['md']}>Every colour is a role token (--md-sys-color-*, --md-extended-color-*, or --antz-* here). Every role aliases a palette variable, so themes and modes switch without code changes.</Rule>
          <Rule src={['m3']}>Pair each colour with its on-colour: primary with on-primary, primary-container with on-primary-container, surface with on-surface. Never put text or icons on a role with anything other than its on-colour.</Rule>
          <Rule src={['md']}>Brand colours appear as containers (primary-container is the green key, #36BC69). Text and buttons use the toned versions (primary, on-primary).</Rule>
        </ul>

        <h3>What each key colour is for</h3>
        <ul>
          <Rule src={['md']}>The key colours: primary #37BD69 (brand green), secondary #00D9C7 (Master-Secondary teal), tertiary #1F415B (navy, replacing #B3C6D6 from the theme exports), neutral #8F9E9C, neutral variant #9FB2A7.</Rule>
          <Rule src={['m3', 'measured']}><b>Primary, green:</b> main actions and active states: links, the active tab, add and edit actions, post titles. FABs use primary-container.</Rule>
          <Rule src={['m3', 'measured']}><b>Secondary, aqua:</b> tonal fills: chips, avatars, the chat button, the Medical records block, action icons (secondary-container).</Rule>
          <Rule src={['m3', 'measured']}><b>Tertiary, navy:</b> titles and emphasis: app bar titles, names, key numbers, the selected site chip, the Medical banner.</Rule>
          <Rule src={['m3', 'measured']}><b>Neutral:</b> backgrounds and surfaces. <b>Neutral variant:</b> outlines and secondary text (outline, outline-variant, on-surface-variant).</Rule>
        </ul>

        <h3>Surfaces and elevation</h3>
        <ul>
          <Rule src={['m3']}>Use the surface-container ladder (lowest, low, container, high, highest) for depth instead of shadows or tints.</Rule>
          <Rule src={['measured']}>In the 12 screens: page and section backgrounds use surface-container or surface-container-high; cards use surface-container-lowest; segmented controls and filled search fields use surface-container-highest.</Rule>
          <Rule src={['rec']}>Keep one step between a card and its page (lowest on high, for example), so cards separate without a border.</Rule>
        </ul>

        <h3>Status colours</h3>
        <ul>
          <Rule src={['md']}>Error is a core role. Success, warning, caution and info are extended colours with the same four roles as primary: colour, on-colour, container, on-container. Success is hue-shifted (from #2FFF2A) so it stays distinct from primary green.</Rule>
          <Rule src={['measured']}>They are fixed in every theme here and mode-aware: each of the 6 modes has its own values.</Rule>
          <Rule src={['m3', 'rec']}>They carry meaning only. Always pair them with an icon or a word, never colour alone. Use the container variants for backgrounds and the on-container colour for their text.</Rule>
        </ul>

        <h3>Contrast</h3>
        <ul>
          <Rule src={['m3']}>WCAG AA: 4.5:1 for body text, 3:1 for large text (24 px, or 18.7 px bold) and for icons.</Rule>
          <Rule src={['md']}>The library has six modes: light and dark at standard, medium and high contrast. Its notes report all 22 key pairs passing AA in all six, and 9:1 or more on containers in high contrast.</Rule>
          <Rule src={['measured']}>Active theme: {pairsAll ? `all ${KEY_PAIRS.length} key pairs (with the extended colours) pass AA in all 6 modes.` : `key pairs passing AA per mode: ${pairsActive.join(', ')} of ${KEY_PAIRS.length}.`} Test all six modes; the audit in Inspect → Mapping does this per screen.</Rule>
          <Rule src={['measured']}>In standard contrast, outline-variant on surface is {range(ovLib)} (light, dark) in the library: too low for text or for a border that is the only cue, so treat it as decorative. It rises to {range(ovHigh)} in high contrast. outline is {range(outLib)} in standard contrast: use it where a border must be seen.</Rule>
        </ul>

        <h3>Gradients</h3>
        <ul>
          <Rule src={['md']}>The library keeps 5 gradients (Green to Navy, Teal to Green, Cyan to Navy, Coral to Red, Yellow to Cyan), each from two palette tones.</Rule>
          <Rule src={['measured']}>Best text colour per gradient, worst case over both stops: {libGrads.map((x) => `${x.name} ${fmt(x.worst)}:1`).join(', ')}.</Rule>
          <Rule src={['measured']}>So: {libGrads.filter((x) => x.worst < 3).map((x) => x.name).join(', ') || 'none'} can’t carry text or icons; {libGrads.filter((x) => x.worst >= 3 && x.worst < 4.5).map((x) => x.name).join(' and ') || 'none'} carry only large text or icons; {libGrads.filter((x) => x.worst >= 4.5).map((x) => x.name).join(' and ')} are safe for text.</Rule>
          <Rule src={['rec']}>Keep gradients to large, decorative surfaces (module tiles, hero banners) and off small text and dense UI.</Rule>
        </ul>

        <h3>Dark mode</h3>
        <ul>
          <Rule src={['m3']}>Use the dark scheme’s roles; don’t invert light colours. Dark surfaces get lighter as they rise, not darker.</Rule>
          <Rule src={['measured', 'rec']}>Check photos and scrims in dark mode: text over photos in these screens uses an inverse-surface shade, which turns light in dark mode, so check it reads in both.</Rule>
        </ul>

        <h3>Do and don’t</h3>
        <div className="ex-grid">
          <Example ok title="on-primary text on a primary button" ratio={c('onPrimary', 'primary')} scheme={scheme}>
            <span className="ex-btn" style={{ background: v('primary'), color: v('onPrimary') }}>Save record</span>
          </Example>
          <Example ok={false} title="grey outline text on primary" ratio={c('outline', 'primary')} scheme={scheme}>
            <span className="ex-btn" style={{ background: v('primary'), color: v('outline') }}>Save record</span>
          </Example>
          <Example ok title="status with an icon and a word" ratio={c('onErrorContainer', 'errorContainer')} scheme={scheme}>
            <span className="ex-chip" style={{ background: v('errorContainer'), color: v('onErrorContainer') }}><Ms n="error" size={18} />Overdue</span>
          </Example>
          <Example ok={false} title="status by colour alone" note="meaning by colour only" scheme={scheme}>
            <span className="ex-dot" style={{ background: v('error') }} /> <span style={{ color: v('onSurface') }}>Vaccination</span>
          </Example>
          <Example ok title="secondary text in on-surface-variant" ratio={c('onSurfaceVariant', 'surface')} scheme={scheme}>
            <span style={{ color: v('onSurfaceVariant') }}>Last updated 21 Sep</span>
          </Example>
          <Example ok={false} title="text in outline-variant" ratio={c('outlineVariant', 'surface')} scheme={scheme}>
            <span style={{ color: v('outlineVariant') }}>Last updated 21 Sep</span>
          </Example>
          <Example ok title="card one step off its page" ratio={c('surfaceContainerLowest', 'surfaceContainerHigh')} scheme={scheme}>
            <span className="ex-page" style={{ background: v('surfaceContainerHigh') }}><span className="ex-card" style={{ background: v('surfaceContainerLowest') }}>Card</span></span>
          </Example>
          <Example ok={false} title="card the same as its page" ratio={c('surfaceContainerHigh', 'surfaceContainerHigh')} scheme={scheme}>
            <span className="ex-page" style={{ background: v('surfaceContainerHigh') }}><span className="ex-card" style={{ background: v('surfaceContainerHigh') }}>Card</span></span>
          </Example>
          <Example ok title={`text on ${tealOn.name}`} ratio={onGradient(tealOn).worst} scheme={scheme}>
            <span className="ex-btn" style={g(tealOn)}>Save record</span>
          </Example>
          <Example ok={false} title={`small text on ${greenNavy.name}`} ratio={onGradient(greenNavy).worst} scheme={scheme}>
            <span className="ex-btn" style={g(greenNavy)}>Save record</span>
          </Example>
        </div>
        <p className="muted">Surface examples show the contrast between the two surfaces; separation comes from the tone step, not from a contrast target.</p>
      </article>
    </Sheet>
  );
}
