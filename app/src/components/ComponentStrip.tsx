import type { CSSProperties, ReactNode } from 'react';
import { cssVar as v, schemeLabel, type SchemeKey } from '../theme/library';
import { Ms } from './Segmented';

/** M3 component samples drawn from the role variables of the active theme, in one mode. Visual only. */
export function ComponentStrip({ scheme }: { scheme: SchemeKey }) {
  const Item = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="cs-item"><div className="cs-row">{children}</div><span className="cs-lbl">{label}</span></div>
  );
  const chip = (extra: CSSProperties = {}): CSSProperties => ({ border: `1px solid ${v('outline')}`, color: v('onSurface'), ...extra });
  return (
    <section className="strip" aria-label={`Component samples, ${schemeLabel(scheme)}`}>
      <p className="strip-lbl">{schemeLabel(scheme).replace(' · Standard', '')}</p>
      <div className="cs screen-host" data-scheme={scheme} data-screen="strip" aria-hidden="true" style={{ background: v('surface'), color: v('onSurface') }}>
        <Item label="Text field">
          <span className="m3-field" style={{ borderColor: v('primary') }}>
            <span className="m3-field-lbl" style={{ color: v('primary'), background: v('surface') }}>Animal ID</span>
            <span>AAID: 428221</span>
            <span className="m3-caret" style={{ background: v('primary') }} />
          </span>
        </Item>
        <Item label="Assist, filter, suggestion chips">
          <span className="m3-chip" style={chip()}><Ms n="event" size={18} />Schedule</span>
          <span className="m3-chip" style={{ background: v('secondaryContainer'), color: v('onSecondaryContainer') }}><Ms n="check" size={18} />Critical</span>
          <span className="m3-chip" style={chip({ color: v('onSurfaceVariant') })}>Nest box</span>
        </Item>
        <Item label="Filled, tonal, outlined, text buttons">
          <span className="m3-btn g-target" style={{ background: v('primary'), color: v('onPrimary') }}>Save</span>
          <span className="m3-btn" style={{ background: v('secondaryContainer'), color: v('onSecondaryContainer') }}>Assign</span>
          <span className="m3-btn" style={{ border: `1px solid ${v('outline')}`, color: v('primary') }}>Filter</span>
          <span className="m3-btn" style={{ color: v('primary') }}>Cancel</span>
        </Item>
        <Item label="Small, regular, large FAB">
          <span className="m3-fab s g-target" style={{ background: v('primaryContainer'), color: v('onPrimaryContainer') }}><Ms n="add" size={24} /></span>
          <span className="m3-fab g-target" style={{ background: v('primaryContainer'), color: v('onPrimaryContainer') }}><Ms n="add" size={24} /></span>
          <span className="m3-fab l g-target" style={{ background: v('primaryContainer'), color: v('onPrimaryContainer') }}><Ms n="add" size={36} /></span>
        </Item>
        <Item label="Switch, checkbox">
          <span className="m3-switch" style={{ background: v('primary') }}><i style={{ background: v('onPrimary') }} /></span>
          <span className="m3-switch off" style={{ background: v('surfaceContainerHighest'), borderColor: v('outline') }}><i style={{ background: v('outline') }} /></span>
          <span className="m3-check" style={{ background: v('primary'), color: v('onPrimary') }}><Ms n="check" size={16} /></span>
          <span className="m3-check off" style={{ borderColor: v('onSurfaceVariant') }} />
        </Item>
      </div>
    </section>
  );
}
