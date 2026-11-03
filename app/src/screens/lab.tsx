import type { Role } from '../theme/library';
import { AppBar, Icon, Photo, Screen, StatusBar, paint } from './kit';
import type { ScreenDef } from './types';

const STATUS: [string, Role][] = [['Pending', 'warning'], ['In Progress', 'caution'], ['Completed', 'success']];

function RequestCard({ code, who, caseId, tests, counts, attach, animal }: { code: string; who: string; caseId: string; tests: number; counts: number[]; attach?: number; animal?: boolean }) {
  return (
    <div className="req-card" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' })}>
      <div className="row" style={{ gap: 10 }}>
        <span className="req-ic" {...paint({ bg: 'primaryContainer', fg: 'onPrimaryContainer' })}><Icon n="experiment" size={17} fill /></span>
        <b className="req-code">{code}</b>
        <span className="grow" />
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="col req-meta" {...paint({ fg: 'onSurfaceVariant' })}>
          <span>{who}</span>
          <span>Case ID: <b {...paint({ fg: 'onSurface' })}>{caseId}</b></span>
        </div>
        <span className="grow" />
        <Icon n="chevron_right" size={24} />
      </div>
      <div className="tests" {...paint({ bg: 'surfaceContainer', fg: 'onSurface' })}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>No. of tests: <b>{tests}</b></span>
          {attach !== undefined && <span className="row" style={{ gap: 2 }}><Icon n="attach_file" size={18} /> {attach}</span>}
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {STATUS.map(([t, role], i) => (
            <span key={t} className="tchip" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurfaceVariant' })}>
              {t} - <b {...paint({ fg: role })}>{counts[i]}</b>
            </span>
          ))}
        </div>
      </div>
      {animal && (
        <div className="row req-animal" {...paint({ bd: 'outlineVariant' })}>
          <Photo h={104} radius={8} style={{ flex: '0 0 104px' }} iconSize={24} src="lab-red-panda.webp" alt="Red panda cub on a branch" iw={320} ih={321}>
            <span className="g20" {...paint({ bg: 'infoContainer', fg: 'onInfoContainer' })}>G20</span>
          </Photo>
          <div className="col adm-text" style={{ minWidth: 0 }}>
            <b {...paint({ fg: 'tertiary' })}>AAID: 424291</b>
            <b className="ellip" {...paint({ fg: 'onSurfaceVariant' })}>Micro c… White patch on the fo…</b>
            <b {...paint({ fg: 'onSurfaceVariant' })}>Red Panda</b>
            <i {...paint({ fg: 'onSurfaceVariant' }, { fontWeight: 400 })}>Ailurus fulgens</i>
            <b {...paint({ fg: 'onSurfaceVariant' })}>Site: Rose Garden</b>
          </div>
        </div>
      )}
    </div>
  );
}

function Lab() {
  const summary: [string, string, Role][] = [['440', 'Total Requests', 'primary'], ['1464', 'Pending Tests', 'warning'], ['41', 'Tests In Progress', 'caution'], ['155', 'Completed Tests', 'success']];
  return (
    <Screen label="Lab requests" bg="surfaceContainer">
      <div className="sticky-top">
        <StatusBar />
        <AppBar title="Lab" right={<span className="row appbar-action" {...paint({ fg: 'tertiary' })}><Icon n="location_on" size={22} />&nbsp;All Sites <Icon n="keyboard_arrow_down" size={20} wght={500} /></span>} />
      </div>
      <div className="lab-summary" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurfaceVariant' })}>
        {summary.map(([n, l, role]) => (
          <div key={l} className="col ins-col">
            <b className="lab-num" {...paint({ fg: role })}>{n}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <div className="row tabs-m" {...paint({ bg: 'surfaceContainerLowest' })}>
        <span className="tab-m" {...paint({ fg: 'onSurface' })}>My Lab Requests</span>
        <span className="tab-m on" {...paint({ fg: 'primary', bd: 'primary' })}>All Lab Requests</span>
      </div>
      <div style={{ padding: '12px 14px 0' }}>
        <div className="search-filled" {...paint({ bg: 'surfaceContainerHighest', fg: 'tertiary' })}>
          <Icon n="search" size={22} wght={500} /> <span style={{ fontWeight: 500 }}>Search</span>
        </div>
      </div>
      <div className="req-count" {...paint({ fg: 'onSurface' })}>440 Requests</div>
      <div className="col list" style={{ paddingBottom: 24 }}>
        <RequestCard code="LT38-00383" who="Shambhavi K • 24 Sep 2026" caseId="MED38-18975" tests={1} counts={[1, 0, 0]} animal />
        <RequestCard code="LT38-00381" who="Neeta Zoo With Approval • 17 Sep 2026" caseId="MED38-18908" tests={4} counts={[3, 0, 1]} attach={1} />
      </div>
    </Screen>
  );
}

export const labScreens: ScreenDef[] = [
  {
    id: 'lab', file: 'IMG_1610', label: 'Lab requests', icon: 'science', url: 'antzapp://lab', Component: Lab,
    map: [
      { region: 'Total requests number', roles: ['primary'], today: 'green' },
      { region: 'Pending tests number', roles: ['warning'], today: 'coral', change: 'was error; coral is now extended Warning' },
      { region: 'In progress number', roles: ['caution'], today: 'yellow', change: 'was fixed ext:Alert; now mode-aware Caution' },
      { region: 'Completed number', roles: ['success'], today: 'green', change: 'was secondary; now extended Success' },
      { region: 'Summary card', roles: ['surfaceContainerLowest', 'onSurfaceVariant'] },
      { region: 'Tabs, active', roles: ['primary'] },
      { region: 'Search field (filled)', roles: ['surfaceContainerHighest', 'tertiary'], change: 'was surface-container-high / on-surface-variant' },
      { region: 'Request card', roles: ['surfaceContainerLowest', 'onSurface'] },
      { region: 'Request icon', roles: ['primaryContainer', 'onPrimaryContainer'] },
      { region: 'Tests summary strip', roles: ['surfaceContainer', 'onSurface'] },
      { region: 'Status chips and counts', roles: ['surfaceContainerLowest', 'warning', 'caution', 'success'], change: 'counts were error / ext:Alert / secondary' },
      { region: 'Site badge "G20"', roles: ['infoContainer', 'onInfoContainer'], today: 'cyan', change: 'was secondary' },
      { region: 'Animal ID', roles: ['tertiary'] },
    ],
  },
];
