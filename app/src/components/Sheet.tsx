import { useEffect, useRef, type ReactNode } from 'react';
import { Ms } from './Segmented';

/** Large modal sheet over the stage: title, close button, Esc to close, focus kept inside, focus returned on close. */
export function Sheet({ title, sub, actions, onClose, returnFocus, children }: { title: string; sub?: ReactNode; actions?: ReactNode; onClose: () => void; returnFocus?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('.sheet-close')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select, input, [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      const back = (returnFocus && document.getElementById(returnFocus)) || prev;
      back?.focus();
    };
  }, [onClose, returnFocus]);
  return (
    <div className="sheet-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" ref={ref}>
        <header className="sheet-h">
          <div className="sheet-t">
            <h2 id="sheet-title">{title}</h2>
            {sub && <p className="muted">{sub}</p>}
          </div>
          {actions}
          <button type="button" className="icon-btn sheet-close" aria-label={`Close ${title.toLowerCase()}`} title="Close" onClick={onClose}><Ms n="close" size={20} /></button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/** Quiet aria-live toast used by copy actions. */
export function Toast({ text }: { text: string }) {
  return <div className="toast" role="status" aria-live="polite">{text}</div>;
}
