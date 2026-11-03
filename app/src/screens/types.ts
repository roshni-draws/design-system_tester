import type { ComponentType } from 'react';
import type { Role } from '../theme/library';

export interface MapRow {
  /** Region of the screen, as a reviewer would name it. */
  region: string;
  /** Roles used, background first. */
  roles: Role[];
  /** What the colour looks like in the screenshot today. */
  today?: string;
  /** How this differs from the approved wireframe mapping, if it does. */
  change?: string;
}

export interface ScreenDef {
  id: string;
  file: string;
  label: string;
  icon: string;
  url: string;
  Component: ComponentType;
  map: MapRow[];
}
