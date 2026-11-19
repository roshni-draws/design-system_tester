#!/usr/bin/env node
/**
 * Writes src/data/googleFonts.json: every Google Fonts family that covers Latin, with its category and upright weights.
 *
 * Source: https://fonts.google.com/metadata/fonts, the public JSON the Google Fonts site itself loads (no API key).
 * Run it again to refresh the list:  node scripts/fetch-google-fonts.mjs
 *
 * Output (kept small; only what the font picker needs), most popular first:
 *   { "source": "...", "generated": "YYYY-MM-DD", "families": [[name, category, weights, italic], ...] }
 *   category  s sans-serif, r serif, d display, h handwriting, m monospace
 *   weights   upright weights as hundreds, e.g. "47" = 400 and 700
 *   italic    1 when the family has italics
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://fonts.google.com/metadata/fonts';
const CATS = { 'Sans Serif': 's', Serif: 'r', Display: 'd', Handwriting: 'h', Monospace: 'm' };

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`${SOURCE}: HTTP ${res.status}`);
const text = (await res.text()).replace(/^\)\]\}'\s*/, '');
const { familyMetadataList: list } = JSON.parse(text);

const families = list
  .filter((f) => f.subsets.includes('latin') && CATS[f.category])
  .map((f) => {
    const keys = Object.keys(f.fonts);
    const weights = [...new Set(keys.filter((k) => /^\d+$/.test(k)).map(Number))].filter((w) => w % 100 === 0).sort((a, b) => a - b);
    return { f, weights, italic: keys.some((k) => k.endsWith('i')) };
  })
  .filter((x) => x.weights.length)
  .sort((a, b) => a.f.popularity - b.f.popularity)
  .map(({ f, weights, italic }) => [f.family, CATS[f.category], weights.map((w) => w / 100).join(''), italic ? 1 : 0]);

const out = fileURLToPath(new URL('../src/data/googleFonts.json', import.meta.url));
const json = `{"source":${JSON.stringify(SOURCE)},"generated":"${new Date().toISOString().slice(0, 10)}","families":[\n${families.map((x) => JSON.stringify(x)).join(',\n')}\n]}\n`;
writeFileSync(out, json);
console.log(`${families.length} families, ${(json.length / 1024).toFixed(1)} KB -> ${out}`);
