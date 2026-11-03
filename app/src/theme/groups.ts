import { EXT_ROLE_GROUPS, type Role } from './library';

/** Each role row: [role, the role it is tested against (or null)]. */
export type RoleRow = [Role, Role | null];
export interface RoleGroup { name: string; icon: string; rows: RoleRow[]; ext?: boolean }

export const ROLE_GROUPS: RoleGroup[] = [
  { name: 'Primary', icon: 'counter_1', rows: [['primary', 'onPrimary'], ['onPrimary', 'primary'], ['primaryContainer', 'onPrimaryContainer'], ['onPrimaryContainer', 'primaryContainer'], ['primaryFixed', 'onPrimaryFixed'], ['primaryFixedDim', 'onPrimaryFixedVariant'], ['onPrimaryFixed', 'primaryFixed'], ['onPrimaryFixedVariant', 'primaryFixedDim'], ['surfaceTint', 'surface']] },
  { name: 'Secondary', icon: 'counter_2', rows: [['secondary', 'onSecondary'], ['onSecondary', 'secondary'], ['secondaryContainer', 'onSecondaryContainer'], ['onSecondaryContainer', 'secondaryContainer'], ['secondaryFixed', 'onSecondaryFixed'], ['secondaryFixedDim', 'onSecondaryFixedVariant'], ['onSecondaryFixed', 'secondaryFixed'], ['onSecondaryFixedVariant', 'secondaryFixedDim']] },
  { name: 'Tertiary', icon: 'counter_3', rows: [['tertiary', 'onTertiary'], ['onTertiary', 'tertiary'], ['tertiaryContainer', 'onTertiaryContainer'], ['onTertiaryContainer', 'tertiaryContainer'], ['tertiaryFixed', 'onTertiaryFixed'], ['tertiaryFixedDim', 'onTertiaryFixedVariant'], ['onTertiaryFixed', 'tertiaryFixed'], ['onTertiaryFixedVariant', 'tertiaryFixedDim']] },
  { name: 'Error', icon: 'error', rows: [['error', 'onError'], ['onError', 'error'], ['errorContainer', 'onErrorContainer'], ['onErrorContainer', 'errorContainer']] },
  { name: 'Surface & containers', icon: 'layers', rows: [['background', 'onBackground'], ['onBackground', 'background'], ['surface', 'onSurface'], ['onSurface', 'surface'], ['surfaceVariant', 'onSurfaceVariant'], ['onSurfaceVariant', 'surface'], ['surfaceDim', 'onSurface'], ['surfaceBright', 'onSurface'], ['surfaceContainerLowest', 'onSurface'], ['surfaceContainerLow', 'onSurface'], ['surfaceContainer', 'onSurface'], ['surfaceContainerHigh', 'onSurface'], ['surfaceContainerHighest', 'onSurface']] },
  { name: 'Outline', icon: 'border_style', rows: [['outline', 'surface'], ['outlineVariant', 'surface']] },
  { name: 'Inverse', icon: 'contrast', rows: [['inverseSurface', 'inverseOnSurface'], ['inverseOnSurface', 'inverseSurface'], ['inversePrimary', 'inverseSurface']] },
  { name: 'Utility', icon: 'tune', rows: [['shadow', null], ['scrim', null]] },
  ...EXT_ROLE_GROUPS.map((g): RoleGroup => ({
    name: `${g.name} (extended)`,
    icon: { success: 'check_circle', warning: 'warning', caution: 'emergency_home', info: 'info' }[g.key as string] ?? 'palette',
    ext: true,
    rows: [[g.roles[0], g.roles[1]], [g.roles[1], g.roles[0]], [g.roles[2], g.roles[3]], [g.roles[3], g.roles[2]]],
  })),
];

/** On-colour pairs that carry text in the app. Used for the "key pairs" counts and the AA audit. */
export const KEY_PAIRS: [Role, Role][] = [
  ['primary', 'onPrimary'], ['primaryContainer', 'onPrimaryContainer'],
  ['secondary', 'onSecondary'], ['secondaryContainer', 'onSecondaryContainer'],
  ['tertiary', 'onTertiary'], ['tertiaryContainer', 'onTertiaryContainer'],
  ['error', 'onError'], ['errorContainer', 'onErrorContainer'],
  ['primaryFixed', 'onPrimaryFixed'], ['secondaryFixed', 'onSecondaryFixed'], ['tertiaryFixed', 'onTertiaryFixed'],
  ['background', 'onBackground'], ['surface', 'onSurface'], ['surfaceVariant', 'onSurfaceVariant'],
  ['surfaceContainerHighest', 'onSurface'], ['surfaceContainerHighest', 'onSurfaceVariant'],
  ['inverseSurface', 'inverseOnSurface'], ['inverseSurface', 'inversePrimary'],
  ...EXT_ROLE_GROUPS.flatMap((g): [Role, Role][] => [[g.roles[0], g.roles[1]], [g.roles[2], g.roles[3]]]),
];
