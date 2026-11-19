import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { readableOn } from '../theme/contrast';

/** HSV with h 0–360, s and v 0–100. */
export interface Hsv { h: number; s: number; v: number }

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function hexToHsv(hex: string, keepHue = 0): Hsv {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = keepHue;
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }
  return { h, s: max ? (d / max) * 100 : 0, v: max * 100 };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const S = s / 100, V = v / 100;
  const f = (k: number) => { const kk = (k + h / 60) % 6; return V - V * S * Math.max(0, Math.min(kk, 4 - kk, 1)); };
  return '#' + [f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** '#abc', 'abc', '#aabbcc' or 'aabbcc' -> '#AABBCC', or null. */
export function normaliseHex(raw: string): string | null {
  const t = raw.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(t)) return '#' + t.split('').map((c) => c + c).join('').toUpperCase();
  if (/^[0-9a-f]{6}$/i.test(t)) return '#' + t.toUpperCase();
  return null;
}

/**
 * Free colour picker: saturation/brightness area, hue slider, hex field and recent colours.
 * onChange fires live while dragging or typing; onCommit once a pick that changed the colour is finished
 * (pointer up, leaving the control after arrow keys, Enter or blur in the hex field), so recents only collect real picks.
 */
export function ColorPicker({ value, label, recents, onChange, onCommit }: {
  value: string; label: string; recents: string[]; onChange: (hex: string) => void; onCommit: (hex: string) => void;
}) {
  const id = useId();
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value));
  const [draft, setDraft] = useState(value);
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const latest = useRef(value);
  const dirty = useRef(false);
  const finish = () => { if (dirty.current) { dirty.current = false; onCommit(latest.current); } };

  // Follow outside changes (another part picked, reset, mode switch) without losing the hue of greys.
  useEffect(() => {
    latest.current = value;
    setHsv((cur) => (hsvToHex(cur) === value ? cur : hexToHsv(value, cur.h)));
    setDraft(value);
  }, [value]);

  const set = (next: Hsv) => {
    setHsv(next);
    const hex = hsvToHex(next);
    latest.current = hex;
    setDraft(hex);
    if (hex !== value) { dirty.current = true; onChange(hex); }
  };

  const fromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = area.current!.getBoundingClientRect();
    set({ h: hsv.h, s: clamp(((e.clientX - r.left) / r.width) * 100, 0, 100), v: clamp(100 - ((e.clientY - r.top) / r.height) * 100, 0, 100) });
  };

  const areaKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 1;
    const d: Record<string, [number, number]> = { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (e.key === 'Home') { e.preventDefault(); set({ ...hsv, s: 0 }); return; }
    if (e.key === 'End') { e.preventDefault(); set({ ...hsv, s: 100 }); return; }
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    set({ h: hsv.h, s: clamp(Math.round(hsv.s) + m[0], 0, 100), v: clamp(Math.round(hsv.v) + m[1], 0, 100) });
  };

  const commitDraft = () => {
    const hex = normaliseHex(draft);
    if (!hex) { setDraft(latest.current); return; }
    setDraft(hex);
    latest.current = hex;
    if (hex !== value) { dirty.current = true; onChange(hex); }
    setHsv((cur) => hexToHsv(hex, cur.h));
    finish();
  };

  const hueHex = hsvToHex({ h: hsv.h, s: 100, v: 100 });
  const invalid = normaliseHex(draft) === null;

  return (
    <div className="cp">
      <div
        ref={area}
        className="cp-sv"
        style={{ backgroundColor: hueHex }}
        role="slider"
        tabIndex={0}
        aria-label={`${label}: saturation and brightness`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s)}
        aria-valuetext={`Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%, ${hsvToHex(hsv)}`}
        aria-describedby={`${id}-sv-help`}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.focus(); fromPointer(e); }}
        onPointerMove={(e) => { if (drag.current) fromPointer(e); }}
        onPointerUp={() => { drag.current = false; finish(); }}
        onPointerCancel={() => { drag.current = false; }}
        onKeyDown={areaKeys}
        onBlur={finish}
      >
        <span className="cp-thumb" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: hsvToHex(hsv) }} aria-hidden="true" />
      </div>
      <p id={`${id}-sv-help`} className="sr-only">Left and right arrows change saturation, up and down change brightness. Hold Shift for steps of 10.</p>
      <label className="cp-hue-wrap">
        <span className="sr-only">{label}: hue</span>
        <input
          type="range" className="cp-hue" min={0} max={359} step={1} value={Math.round(hsv.h) % 360}
          aria-valuetext={`Hue ${Math.round(hsv.h)} degrees`}
          onChange={(e) => set({ ...hsv, h: +e.target.value })}
          onPointerUp={finish}
          onBlur={finish}
        />
      </label>
      <div className="cp-row">
        <span className="cp-preview" style={{ background: value, color: readableOn(value) }} aria-hidden="true" />
        <label className="cp-hex" htmlFor={`${id}-hex`}>Hex</label>
        <input
          id={`${id}-hex`}
          className="cp-hex-in"
          value={draft}
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-hex-err` : undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            const t = e.target.value.trim().replace(/^#/, '');
            // Live while typing once there are 6 digits; 3-digit shorthand applies on Enter or blur.
            if (/^[0-9a-f]{6}$/i.test(t)) { const hex = '#' + t.toUpperCase(); latest.current = hex; setHsv((cur) => hexToHsv(hex, cur.h)); if (hex !== value) { dirty.current = true; onChange(hex); } }
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDraft(); } if (e.key === 'Escape') setDraft(latest.current); }}
          onBlur={commitDraft}
        />
        {invalid && <span id={`${id}-hex-err`} className="cp-err">Use 3 or 6 hex digits</span>}
      </div>
      {recents.length > 0 && (
        <div className="cp-recent">
          <span className="cp-recent-h" id={`${id}-recent`}>Recent</span>
          <div className="cp-recent-row" role="group" aria-labelledby={`${id}-recent`}>
            {recents.map((c) => (
              <button key={c} type="button" className="cp-sw" style={{ background: c }} aria-label={`Use ${c}`} title={c} aria-pressed={c === value}
                onClick={() => { if (c !== value) onChange(c); onCommit(c); }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
