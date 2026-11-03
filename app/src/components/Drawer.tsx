import type { ReactNode } from 'react';
import { Ms } from './Segmented';

export type DrawerTab = 'roles' | 'mapping' | 'element';
const TABS: { id: DrawerTab; label: string }[] = [
  { id: 'roles', label: 'Roles' },
  { id: 'mapping', label: 'Mapping' },
  { id: 'element', label: 'Element' },
];

/** Right-hand Inspect drawer: one panel at a time. */
export function Drawer({ open, tab, onTab, onClose, children }: { open: boolean; tab: DrawerTab; onTab: (t: DrawerTab) => void; onClose: () => void; children: ReactNode }) {
  return (
    <aside className={`drawer${open ? ' open' : ''}`} aria-label="Inspect" aria-hidden={!open} {...(open ? {} : ({ inert: '' } as object))}>
      <div className="drawer-h">
        <div className="tabs" role="tablist" aria-label="Inspect">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" id={`dtab-${t.id}`} aria-selected={tab === t.id} aria-controls="drawer-panel" tabIndex={tab === t.id ? 0 : -1} onClick={() => onTab(t.id)}
              onKeyDown={(e) => {
                const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (!d) return;
                const i = (TABS.findIndex((x) => x.id === tab) + d + TABS.length) % TABS.length;
                onTab(TABS[i].id);
                document.getElementById(`dtab-${TABS[i].id}`)?.focus();
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" className="icon-btn" aria-label="Close inspect" title="Close" onClick={onClose}><Ms n="close" size={20} /></button>
      </div>
      <div id="drawer-panel" role="tabpanel" aria-labelledby={`dtab-${tab}`} className="drawer-body">{children}</div>
    </aside>
  );
}
