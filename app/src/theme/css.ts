import { ALL_ROLES, COLORS, SCHEME_KEYS, mdName, varName, type Role } from './library';

/**
 * Builds the theme stylesheet from the active colours (the JSON by default):
 * one [data-scheme="<mode>"] block per mode, each defining --antz-<role> for all 65 roles.
 */
export function buildThemeCss(opts: { md?: boolean } = {}): string {
  return SCHEME_KEYS.map((k) => {
    const lines = ALL_ROLES.map((r) => `  ${varName(r)}: ${COLORS[k][r]};`);
    if (opts.md) lines.push(...ALL_ROLES.map((r) => `  ${mdName(r)}: var(${varName(r)});`));
    const scheme = k.startsWith('dark') ? 'dark' : 'light';
    return `[data-scheme="${k}"] {\n  color-scheme: ${scheme};\n${lines.join('\n')}\n}`;
  }).join('\n\n');
}

/** Writes the active theme into the page stylesheet. */
export function applyThemeCss() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('antz-theme');
  if (!el) {
    el = document.createElement('style');
    el.id = 'antz-theme';
    document.head.appendChild(el);
  }
  const css = buildThemeCss();
  if (el.textContent !== css) el.textContent = css;
}

/** Inline custom properties for one scheme of any theme, so a preview can show a theme that is not active. */
export function themeVars(scheme: Record<Role, string>): Record<string, string> {
  return Object.fromEntries(ALL_ROLES.map((r) => [varName(r), scheme[r]]));
}

applyThemeCss();
