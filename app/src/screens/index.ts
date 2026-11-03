import { collectionScreens } from './collections';
import { homeScreens } from './home';
import { labScreens } from './lab';
import { medicalScreens } from './medical';
import type { ScreenDef } from './types';

const all = [...homeScreens, ...collectionScreens, ...medicalScreens, ...labScreens];
/** In sample order: IMG_1600 … IMG_1611. */
export const SCREENS: ScreenDef[] = all.sort((a, b) => a.file.localeCompare(b.file));
export const screenById = (id: string) => SCREENS.find((s) => s.id === id);
export type { ScreenDef, MapRow } from './types';
