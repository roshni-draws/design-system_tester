import { AntzMark, AppBar, Fab, Icon, Screen, SpeedDial, StatusBar, paint } from './kit';
import type { ScreenDef } from './types';

const sitesRight = (
  <span className="row appbar-action" {...paint({ fg: 'tertiary' })}>All Sites <Icon n="keyboard_arrow_down" size={20} wght={500} /></span>
);

const RECORDS = ['Medical Records', 'Symptoms', 'Clinical Assessment', 'Prescriptions', 'Vaccination Records', 'Deworming Records'];
const ACTIONS: [string, string][] = [
  ['Administer Prescription', 'volunteer_activism'], ['Symptoms', 'sentiment_dissatisfied'], ['Clinical Assessment', 'stethoscope'],
  ['Lab', 'experiment'], ['Vaccination', 'vaccines'], ['Deworming', 'medication_liquid'],
  ['Hospital Transfer', 'ambulance'], ['Prescriptions', 'clinical_notes'], ['Supplements', 'pill'],
];

function RecordsBlock({ scrolled }: { scrolled: boolean }) {
  const items = scrolled ? RECORDS.slice(2) : RECORDS;
  return (
    <div className={`records${scrolled ? ' scrolled' : ''}`} {...paint({ bg: 'secondaryContainer', fg: 'onSecondaryContainer' })}>
      {!scrolled && <span className="records-title">Medical Records</span>}
      <div className="grid2" style={{ gap: 11 }}>
        {items.map((t) => (
          <div key={t} className="rec-tile" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurfaceVariant' })}>
            <b className="rec-n" {...paint({ fg: 'tertiary' })}>0</b>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionGrid({ count }: { count: number }) {
  return (
    <div className="grid3 actions">
      {ACTIONS.slice(0, count).map(([t, i]) => (
        <div key={t} className="act-tile" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' })}>
          <span className="act-ic" {...paint({ bg: 'secondaryContainer', fg: 'onSecondaryContainer' })}>
            <Icon n={i} size={22} wght={400} />
          </span>
          <span className="act-lbl">{t}</span>
        </div>
      ))}
    </div>
  );
}

function MedicalBody({ scrolled }: { scrolled: boolean }) {
  return (
    <>
      <div className="sticky-top">
        <StatusBar />
        <AppBar title="Medical" right={sitesRight} />
      </div>
      {!scrolled && (
        <>
          <div className="sick-banner" {...paint({ bg: 'tertiary', fg: 'onTertiary' })}>
            <div className="col ins-col"><b className="sick-num" {...paint({ fg: 'inversePrimary' })}>2904</b><span>Total Animals sick</span></div>
            <span className="sick-div" {...paint({ bg: 'onTertiary', a: 0.45 })} />
            <div className="col ins-col"><b className="sick-num" {...paint({ fg: 'inversePrimary' })}>160</b><span>Species</span></div>
          </div>
          <div className="row med-filters" {...paint({ fg: 'tertiary' })}>
            <span className="row">Yesterday <Icon n="keyboard_arrow_down" size={18} wght={600} /></span>
            <span className="row">Active Records&nbsp;&nbsp;<Icon n="keyboard_arrow_down" size={18} wght={600} /></span>
          </div>
        </>
      )}
      <RecordsBlock scrolled={scrolled} />
      <ActionGrid count={scrolled ? 9 : 6} />
      <div style={{ height: scrolled ? 110 : 30 }} />
    </>
  );
}

/* ---------- IMG_1607 / 1608 / 1611 ---------- */
function Medical() {
  return <Screen label="Medical" bg="surfaceContainer" overlay={<Fab />}><MedicalBody scrolled={false} /></Screen>;
}
function MedicalScrolled() {
  return <Screen label="Medical, scrolled" bg="surfaceContainer" overlay={<Fab />}><MedicalBody scrolled /></Screen>;
}
const DIAL: [string, string][] = [
  ['Single medical record', 'note_add'], ['Group medical record', 'list_alt_add'], ['Batch medical record', 'playlist_add'],
  ['Group Lab Request', 'lab_profile'], ['Direct Administer', 'add_box'], ['Direct Prescription', 'edit_document'],
  ['Direct Vaccination', 'add_box'], ['Schedule Vaccination', 'calendar_month'], ['Direct Deworming', 'add_box'],
  ['Schedule Deworming', 'calendar_month'], ['Direct Supplements', 'add_box'],
];
function MedicalDial() {
  return (
    <Screen label="Medical add menu" bg="surfaceContainer" overlay={<SpeedDial items={DIAL} />}>
      <MedicalBody scrolled />
    </Screen>
  );
}

/* ---------- IMG_1609 · Administer ---------- */
function RecordCard({ badge, id, lines, name, latin, encl }: { badge: 'ID' | 'F'; id: string; lines: string[]; name: string; latin: string; encl: string }) {
  return (
    <div className="adm-card" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' })}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
        <div className="adm-thumb">
          <span className="adm-badge" {...paint(badge === 'ID' ? { bg: 'infoContainer', fg: 'onInfoContainer' } : { bg: 'warningContainer', fg: 'onWarningContainer' })}>{badge}</span>
          <AntzMark size={78} />
        </div>
        <div className="col adm-text">
          <b {...paint({ fg: 'tertiary' })}>{id}</b>
          {lines.map((l) => <b key={l} {...paint({ fg: 'onSurfaceVariant' })}>{l}</b>)}
          <b {...paint({ fg: 'onSurfaceVariant' })}>{name}</b>
          <i {...paint({ fg: 'onSurfaceVariant' }, { fontWeight: 400 })}>{latin}</i>
          <b {...paint({ fg: 'onSurfaceVariant' })}>Encl: {encl}</b>
        </div>
      </div>
      <div className="dose" {...paint({ bg: 'surfaceContainer', fg: 'onSurfaceVariant' })}>
        <span>Medicine : <b {...paint({ fg: 'onSurface' })}>1</b></span>
        <span>Doses : <b {...paint({ fg: 'onSurface' })}>1</b></span>
        <span {...paint({ fg: 'error' })}>Pending : 1</span>
        <span {...paint({ fg: 'info' })}><Icon n="keyboard_arrow_down" size={20} wght={600} /></span>
      </div>
    </div>
  );
}

function Administer() {
  return (
    <Screen label="Administer" bg="surfaceContainerHigh">
      <div className="sticky-top">
        <StatusBar />
        <AppBar
          title="Administer"
          right={
            <span className="row" style={{ gap: 10 }}>
              <span className="sq-act" {...paint({ bg: 'secondaryContainer', fg: 'onSecondaryContainer' })}><Icon n="add" size={22} /></span>
              <span className="sq-act" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface' })}><Icon n="search" size={22} /></span>
              <span className="sq-act" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface' })}><Icon n="tune" size={22} /></span>
            </span>
          }
        />
      </div>
      <div className="row adm-filters" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface', bd: 'outlineVariant' })}>
        <span className="row" style={{ gap: 6 }}>Nov 2026 <Icon n="arrow_drop_down" size={22} /> <span {...paint({ fg: 'onSurfaceVariant' })}><Icon n="calendar_today" size={20} /></span></span>
        <span className="row">All Records&nbsp;&nbsp;<Icon n="arrow_drop_down" size={22} /></span>
      </div>
      <div className="row dates">
        {[['Sun', '01'], ['Mon', '02'], ['Tue', '03']].map(([d, n], i) => {
          const sel = i === 2;
          return (
            <div key={d} className={`date${sel ? ' sel' : ''}`} {...paint(sel ? { bg: 'tertiary', fg: 'onTertiary', bd: 'tertiaryContainer' } : { bg: 'surfaceContainerLowest', fg: 'onSurface', bd: 'outlineVariant' })}>
              <span className="date-d" {...(sel ? {} : paint({ fg: 'onSurfaceVariant' }))}>{d}</span>
              <b>{n}</b>
              <span className="date-dot" {...paint({ bg: sel ? 'errorContainer' : 'error' })} />
              {sel && <span className="date-tip" {...paint({ bg: 'tertiary' })} />}
            </div>
          );
        })}
      </div>
      <div className="row tabs-m" {...paint({ bg: 'surfaceContainerLowest' })}>
        <span className="tab-m on" {...paint({ fg: 'primary', bd: 'primary' })}>Animal Records - 8</span>
        <span className="tab-m" {...paint({ fg: 'onSurfaceVariant' })}>Group Records - 0</span>
      </div>
      <div className="row status-tiles">
        {['Administered', 'Skipped', 'Stopped', 'Pending'].map((t, i) => (
          <div key={t} className="st-tile" {...paint(i === 3 ? { bg: 'infoContainer', fg: 'onInfoContainer' } : { bg: 'surfaceContainerLowest', fg: 'onSurface' })}>
            <b>{i === 3 ? 13 : 0}</b><span>{t}</span>
          </div>
        ))}
      </div>
      <div className="col list" style={{ padding: '0 11px 20px' }}>
        <RecordCard badge="ID" id="AAID: 428121" lines={['Name: Mouna']} name="Macaw" latin="Anodorhynchus hyacinthinus" encl="A-3" />
        <RecordCard badge="F" id="AAID: 385238" lines={['DNA: A3']} name="Louisiana Alligator" latin="Alligator mississippiensis" encl="Ammapetai enclosure" />
        <RecordCard badge="ID" id="AAID: 228845" lines={[]} name="Eastern Gorilla" latin="Gorilla beringei" encl="Genc1" />
      </div>
    </Screen>
  );
}

const medShared = [
  { region: 'App bar', roles: ['surfaceContainerLowest', 'tertiary'], today: 'white, navy title', change: 'was surface / on-surface' },
  { region: 'Page background', roles: ['surfaceContainer'], change: 'was surface-container-low' },
] as const;

export const medicalScreens: ScreenDef[] = [
  {
    id: 'medical', file: 'IMG_1607', label: 'Medical', icon: 'medical_services', url: 'antzapp://medical', Component: Medical,
    map: [
      ...medShared.map((r) => ({ ...r, roles: [...r.roles] })),
      { region: '"Total animals sick" banner', roles: ['tertiary', 'onTertiary'], today: 'navy', change: 'was inverse-surface; navy is now tertiary' },
      { region: 'Banner numbers', roles: ['inversePrimary'], today: 'bright green', change: 'kept inverse-primary; passes only AA large on tertiary in standard contrast' },
      { region: 'Yesterday / Active Records filters', roles: ['tertiary'], change: 'was on-surface' },
      { region: 'Medical Records block', roles: ['secondaryContainer', 'onSecondaryContainer'], today: 'aqua' },
      { region: 'Record count tiles', roles: ['surfaceContainerLowest', 'onSurfaceVariant', 'tertiary'] },
      { region: 'Action tiles', roles: ['surfaceContainerLowest', 'onSurface'] },
      { region: 'Action icon circle', roles: ['secondaryContainer', 'onSecondaryContainer'], today: 'pale aqua to peach wash', change: 'kept flat: a gradient to surface-container-high failed AA in 5 of 6 modes' },
      { region: 'Add FAB', roles: ['primaryContainer', 'onPrimaryContainer'] },
    ],
  },
  {
    id: 'medicalScrolled', file: 'IMG_1608', label: 'Medical · scrolled', icon: 'swipe_up', url: 'antzapp://medical#actions', Component: MedicalScrolled,
    map: [
      { region: 'Scrolled app bar', roles: ['surfaceContainerLowest', 'tertiary'] },
      { region: 'Extra tiles: Hospital Transfer, Prescriptions, Supplements', roles: ['surfaceContainerLowest', 'secondaryContainer'] },
      { region: 'Medical Records block (cut off)', roles: ['secondaryContainer', 'onSecondaryContainer'] },
      { region: 'Add FAB', roles: ['primaryContainer', 'onPrimaryContainer'] },
    ],
  },
  {
    id: 'administer', file: 'IMG_1609', label: 'Administer', icon: 'event_available', url: 'antzapp://medical/administer', Component: Administer,
    map: [
      { region: 'Add action (tonal)', roles: ['secondaryContainer', 'onSecondaryContainer'], today: 'pale aqua', change: 'was primary-container' },
      { region: 'Search / filter actions', roles: ['surfaceContainerHigh', 'onSurface'] },
      { region: 'Date chip, selected', roles: ['tertiary', 'onTertiary'], today: 'navy' },
      { region: 'Date chips, unselected', roles: ['surfaceContainerLowest', 'outlineVariant'] },
      { region: 'Has-pending dot', roles: ['error', 'errorContainer'], change: 'error-container on the selected (tertiary) chip' },
      { region: 'Tabs, active label and indicator', roles: ['primary'] },
      { region: 'Tabs, inactive', roles: ['onSurfaceVariant'] },
      { region: 'Status tile, active "Pending"', roles: ['infoContainer', 'onInfoContainer'], today: 'cyan', change: 'was secondary; cyan is now extended Info' },
      { region: 'Record card', roles: ['surfaceContainerLowest', 'onSurface'] },
      { region: '"ID" badge', roles: ['infoContainer', 'onInfoContainer'], today: 'cyan', change: 'was secondary' },
      { region: '"F" badge', roles: ['warningContainer', 'onWarningContainer'], today: 'orange', change: 'was fixed ext:Warning; now mode-aware' },
      { region: 'Animal ID', roles: ['tertiary'] },
      { region: 'Dose summary strip', roles: ['surfaceContainer', 'onSurfaceVariant'], today: 'pale aqua', change: 'was secondary-container, which is now a strong aqua' },
      { region: '"Pending: 1" text', roles: ['error'] },
      { region: 'Expand chevron', roles: ['info'], change: 'new: extended Info' },
    ],
  },
  {
    id: 'medicalDial', file: 'IMG_1611', label: 'Medical · add menu', icon: 'add_circle', url: 'antzapp://medical#fab', Component: MedicalDial,
    map: [
      { region: 'Scrim over the page', roles: ['scrim'], today: 'white wash', change: 'was surface at 85%; now the M3 scrim at 32%' },
      { region: '11 menu labels', roles: ['surfaceContainerLowest', 'primary'], change: 'labels sit on a pill for legibility over the scrim' },
      { region: 'Mini action buttons', roles: ['surfaceContainerHigh', 'tertiary'] },
      { region: 'Close FAB', roles: ['primaryContainer', 'onPrimaryContainer'] },
    ],
  },
];
