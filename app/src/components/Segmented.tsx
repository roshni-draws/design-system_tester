import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export interface SegOption<T extends string> { value: T; label: ReactNode; title?: string }

/** Segmented toggle: a group of aria-pressed buttons. Arrow keys move and select. */
export function Segmented<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T; options: SegOption<T>[]; onChange: (v: T) => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[n].value);
    ref.current?.querySelectorAll('button')[n]?.focus();
  };
  return (
    <div className="seg" role="group" aria-label={label} ref={ref} onKeyDown={onKey}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} title={o.title} disabled={disabled} tabIndex={o.value === value ? 0 : -1} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Ms = ({ n, size = 18 }: { n: string; size?: number }) => (
  <span className="ms" aria-hidden="true" style={{ fontSize: size }}>{n}</span>
);
