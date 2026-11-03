import { AntzMark, Avatar, FloatingPills, HomeSearch, Icon, Photo, Screen, Shade, SiteChips, StatusBar, img, paint } from './kit';
import type { ScreenDef } from './types';

/* ---------- IMG_1600 · Home feed ---------- */
function HomeFeed() {
  const favs: [string, string, string, string, string][] = [
    ['AAID: 423186', 'waka lizard', 'Nilam palli12', 'fav-fire-salamander.webp', 'Black and yellow salamander on a rock'],
    ['Animal Ear Ta…', 'Reverse Pebblesnail', 'Indigo macaw', 'fav-corn-snake.webp', 'Orange corn snake against tree bark'],
    ['AAID: 428221', 'Soil Centipede', 'Herbivour Encl1', 'fav-centipede.webp', 'Red-headed centipede on a rock'],
  ];
  return (
    <Screen label="Home feed" bg="background" fg="onBackground" overlay={<FloatingPills variant="feed" />}>
      <div className="home-head" {...paint({ bg: 'surfaceContainerHigh' })}>
        <StatusBar time="6:28" battery={14} transparent />
        <div className="row greet">
          <Avatar text="DA" size={36} />
          <div className="col greet-text">
            <span className="greet-hi" {...paint({ fg: 'onSurfaceVariant' })}>Good Evening,</span>
            <span className="greet-name" {...paint({ fg: 'tertiary' })}>Designer Antz <span aria-hidden>👋</span></span>
          </div>
          <span className="weather" {...paint({ fg: 'onSurface' })}>
            <span {...paint({ fg: 'info' })}><Icon n="cloud" size={16} fill /></span>26°
          </span>
          <span className="square-btn" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' })}><Icon n="notifications" size={20} /></span>
        </div>
        <HomeSearch placeholder="Enclosure" avatar={false} />
        <div className="row sec-head" {...paint({ fg: 'onSurface' })}>
          <b>Favourites</b>
          <Icon n="star" size={20} />
        </div>
        <div className="fav-row">
          {favs.map(([a, b, c, src, alt]) => (
            <Photo key={a} h={140} radius={10} style={{ flex: '0 0 131px' }} src={src} alt={alt} iw={400} ih={428}>
              <Shade size="62%">
                <b className="fav-id">{a}</b>
                <span className="fav-l1">{b}</span>
                <span className="fav-l2">{c}</span>
              </Shade>
            </Photo>
          ))}
        </div>
      </div>

      <div className="ticker" {...paint({ bg: 'cautionContainer', fg: 'onCautionContainer' })}>
        <span {...paint({ fg: 'onCautionContainer' })}><Icon n="sensors" size={18} wght={500} /></span>
        <span className="ticker-div" {...paint({ bg: 'onCautionContainer', a: 0.3 })} />
        <Icon n="warning" size={17} wght={500} />
        <b>ANIMAL AUDIT SCORE</b> <b>1%</b>
        <span className="ticker-av" {...paint({ bg: 'surfaceContainerLowest', a: 0.6 })}><AntzMark size={13} /></span>
        <span>DK RC <b>100%</b></span>
      </div>

      <div className="feed" {...paint({ bg: 'surfaceContainer' })}>
        <article className="post" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' })}>
          <span className="announce" {...paint({ bg: 'secondaryContainer', fg: 'onSecondaryContainer' })}>
            <span className="announce-ic" {...paint({ bg: 'secondary', fg: 'onSecondary' })}><Icon n="campaign" size={13} fill /></span>
            ANNOUNCEMENT
          </span>
          <h3 className="post-title" {...paint({ fg: 'primary' })}>The animal of the day is Flemingo</h3>
          <div className="row post-meta" {...paint({ fg: 'onSurfaceVariant' })}>
            <Avatar text="NZ" size={20} bg="surfaceContainerHigh" fg="onSurfaceVariant" fs={8.5} />
            Neeta Zoo With Approval <span aria-hidden>•</span> 21 Sep
          </div>
          <p className="post-body">Good evening everyone!</p>
          <p className="post-body">Did you know that flamingos are not born pink? They a…</p>
          <div className="row post-att" {...paint({ fg: 'onSurfaceVariant' })}>
            <Icon n="attach_file" size={15} /> 3 Images, 1 Document, 1 Video, 1 Audio
          </div>
          <Photo h={185} radius={10} src="flamingos-announcement.webp" alt="Flamingos wading in a pond" iw={700} ih={308}>
            <span className="photo-count" {...paint({ bg: 'inverseSurface', fg: 'inverseOnSurface', a: 0.7 })}><Icon n="photo_library" size={14} fill /> +2</span>
          </Photo>
        </article>
      </div>
    </Screen>
  );
}

/* ---------- IMG_1601 · Home observation notes ---------- */
function NoteCard({ title, date, tag, body, extra, wide = true, photo }: { title: string; date?: string; tag: string; body: string; extra?: string; wide?: boolean; photo: { src: string; alt: string; w: number; h: number; pos?: string } }) {
  return (
    <div className="note-card" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' }, { flex: wide ? '0 0 255px' : '0 0 120px' })}>
      <Photo h={185} radius={0} style={{ borderRadius: '10px 10px 0 0' }} src={photo.src} alt={photo.alt} iw={photo.w} ih={photo.h} pos={photo.pos}>
        {wide && <span className="crit" {...paint({ bg: 'errorContainer', fg: 'onErrorContainer' })}>!!!</span>}
        <div className="aid-chip" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface', a: 0.92 })}>
          <span className="aid-thumb" {...paint({ bg: 'surfaceVariant', fg: 'onSurfaceVariant' })}><img src={img('centipede-thumb.webp')} alt="Soil centipede" width={34} height={34} loading="lazy" decoding="async" /></span>
          <span className="col" style={{ gap: 1 }}>
            <b {...paint({ fg: 'tertiary' })}>AID: 428221</b>
            <span {...paint({ fg: 'onSurfaceVariant' })} className="small">Soil Centipede</span>
          </span>
        </div>
      </Photo>
      <div className="note-body">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b className="note-title" {...paint({ fg: 'tertiary' })}>{title}</b>
          {date && <span className="small" {...paint({ fg: 'onSurfaceVariant' })}>{date}</span>}
        </div>
        <span className="small" {...paint({ fg: 'onSurfaceVariant' })}>•&nbsp; {tag}</span>
        {extra && <span className="small" {...paint({ fg: 'onSurfaceVariant' })}>{extra}</span>}
        <div className="note-text" {...paint({ bd: 'outlineVariant' })}>{body}</div>
        <div className="row note-foot" {...paint({ fg: 'onSurfaceVariant' })}>
          <Avatar text="SO" size={20} bg="surfaceContainerHigh" fg="onSurfaceVariant" fs={8.5} />
          <span {...paint({ fg: 'onSurface' })}>Sowmya 09</span>
          <span className="grow" />
          <Icon n="thumb_up" size={17} /> 0 &nbsp;&nbsp;<Icon n="chat_bubble" size={16} /> 0
        </div>
      </div>
    </div>
  );
}

function SpeciesTile() {
  return (
    <Photo h={118} radius={12} iconSize={34} src="species-cheetahs.webp" alt="Four cheetahs resting in tall grass" iw={800} ih={261} pos="50% 30%">
      <Shade side="bottom" size="100%" minA={0.6} style={{ justifyContent: 'space-between', paddingTop: 12 }}>
        <span className="row" style={{ gap: 8, fontSize: 14 }}><Icon n="pets" size={18} fill /> Species Management</span>
        <span className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span className="col"><b className="sp-num">325</b><span className="small">Species</span></span>
          <span className="col" style={{ alignItems: 'flex-end' }}><b className="sp-num">26,224</b><span className="small">Animal Population</span></span>
        </span>
      </Shade>
    </Photo>
  );
}

function ModulesHead() {
  return (
    <div className="row sec-head" {...paint({ fg: 'onSurface' }, { padding: '14px 14px 8px' })}>
      <b>Modules</b>
      <span className="row" {...paint({ fg: 'primary' }, { gap: 14 })}>
        <Icon n="add" size={22} wght={500} />
        <Icon n="edit" size={20} wght={500} />
      </span>
    </div>
  );
}

function HomeNotes() {
  return (
    <Screen label="Home observation notes" bg="background" fg="onBackground" overlay={<FloatingPills variant="compact" />}>
      <div {...paint({ bg: 'surfaceContainerLow' })}>
        <StatusBar time="6:28" battery={14} transparent />
        <HomeSearch placeholder="Animals" />
      </div>
      <div className="chip-band" {...paint({ bg: 'surfaceContainerLowest', bd: 'outlineVariant' })}><SiteChips /></div>
      <section className="notes-sec" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface' })}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b className="sec-title">Observation Notes</b>
          <span className="row" {...paint({ fg: 'onSurface' }, { gap: 2, fontSize: 14 })}>View all <Icon n="keyboard_double_arrow_right" size={16} /></span>
        </div>
        <div className="segm" {...paint({ bg: 'surfaceContainerHighest' })}>
          {['All', 'Low', 'Moderate', 'High', 'Critical'].map((t, i) => (
            <span key={t} {...(i === 0 ? paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' }) : paint({ fg: 'onSurfaceVariant' }))} className={i === 0 ? 'on' : ''}>{t}</span>
          ))}
        </div>
        <div className="note-row">
          <NoteCard title="Carpentry" date="20 Oct" tag="Nest Box" body="Testing" photo={{ src: 'leopard-note.webp', alt: 'Leopard resting on a branch', w: 718, h: 406, pos: '60% 30%' }} />
          <NoteCard title="Electrical" tag="Malfunctioning" extra="Power Outages" body="Testimony" photo={{ src: 'training-log-note.webp', alt: 'Attached screenshot of a training log', w: 321, h: 411, pos: '0 0' }} />
        </div>
      </section>
      <ModulesHead />
      <div style={{ padding: '0 14px 90px' }}><SpeciesTile /></div>
    </Screen>
  );
}

/* ---------- IMG_1602 · Home modules ---------- */
function ModuleTile({ label, icon, spec, wide }: { label: string; icon: string; spec: Parameters<typeof paint>[0]; wide?: boolean }) {
  return (
    <div className={`mod-tile${wide ? ' wide' : ''}`} {...paint({ angle: 125, ...spec })}>
      <Icon n={icon} size={26} wght={500} fill={icon === 'pets'} />
      <span className="mod-label">{label}</span>
    </div>
  );
}

function HomeModules() {
  return (
    <Screen label="Home modules" bg="background" fg="onBackground" overlay={<FloatingPills variant="compact" />}>
      <div {...paint({ bg: 'surfaceContainerLow' })}>
        <StatusBar time="6:28" battery={14} transparent />
        <HomeSearch placeholder="Site" />
        <div className="chip-band" {...paint({ bd: 'outlineVariant' })}><SiteChips /></div>
      </div>
      <ModulesHead />
      <div className="col" style={{ padding: '0 14px', gap: 11 }}>
        <SpeciesTile />
        <ModuleTile wide label="Taxonomic Hierarchy" icon="pets" spec={{ bg: 'secondary', bg2: 'primary', fg: 'onPrimary' }} />
        <div className="grid2">
          <ModuleTile label="Medical" icon="home_health" spec={{ bg: 'primary', bg2: 'tertiary', fg: 'onPrimary' }} />
          <ModuleTile label="Housing" icon="warehouse" spec={{ bg: 'info', bg2: 'tertiary', fg: 'onTertiary' }} />
          <ModuleTile label="Enclosures" icon="fence" spec={{ bg: 'tertiary', bg2: 'info', fg: 'onTertiary' }} />
          <ModuleTile label="Administer" icon="volunteer_activism" spec={{ bg: 'surfaceContainerHighest', bg2: 'surfaceVariant', fg: 'onSurfaceVariant' }} />
        </div>
        <div className="pending" {...paint({ bg: 'errorContainer', fg: 'onErrorContainer' })}>
          <b className="row" style={{ gap: 8, fontSize: 17 }}><Icon n="schedule" size={20} fill /> Pending</b>
          {[['Vaccination', 348], ['Deworming', 112]].map(([t, n]) => (
            <div key={t} className="pending-row" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface', a: 0.85 })}>
              <span>{t}</span><b>{n}</b>
            </div>
          ))}
        </div>
        <div style={{ height: 70 }} />
      </div>
    </Screen>
  );
}

export const homeScreens: ScreenDef[] = [
  {
    id: 'homeFeed', file: 'IMG_1600', label: 'Home · feed', icon: 'home', url: 'antzapp://home', Component: HomeFeed,
    map: [
      { region: 'Header block behind greeting and favourites', roles: ['surfaceContainerHigh'], today: 'pale grey-green', change: 'was surface-container-low; one step darker so white cards and buttons separate' },
      { region: 'Avatar "DA"', roles: ['secondaryContainer', 'onSecondaryContainer'], today: 'bright teal', change: 'was secondary; the new secondary container is the bright teal' },
      { region: 'User name', roles: ['tertiary'], today: 'navy' },
      { region: 'Weather cloud', roles: ['info'], today: 'blue', change: 'new: extended Info' },
      { region: 'Search, scan and bell buttons', roles: ['surfaceContainerLowest', 'onSurfaceVariant'] },
      { region: 'Text on favourite photos', roles: ['inverseSurface', 'inverseOnSurface'], today: 'white on dark photo', change: 'was a fixed white; now an inverse-surface shade so it stays legible in every mode' },
      { region: 'Audit score ticker', roles: ['cautionContainer', 'onCautionContainer'], today: 'pale yellow', change: 'was fixed ext:Alert; now mode-aware Caution container' },
      { region: 'Feed section', roles: ['surfaceContainer'] },
      { region: 'Announcement card', roles: ['surfaceContainerLowest', 'onSurface'] },
      { region: 'Announcement chip', roles: ['secondaryContainer', 'onSecondaryContainer'] },
      { region: 'Post title', roles: ['primary'], today: 'green' },
      { region: 'Floating Modules / Quick Actions pills', roles: ['surfaceContainerHigh', 'onSurface'] },
      { region: 'Chat button', roles: ['secondaryContainer', 'onSecondaryContainer'], today: 'teal' },
    ],
  },
  {
    id: 'homeNotes', file: 'IMG_1601', label: 'Home · notes', icon: 'sticky_note_2', url: 'antzapp://home#notes', Component: HomeNotes,
    map: [
      { region: 'Site chip, selected', roles: ['tertiary', 'onTertiary'], today: 'navy' },
      { region: 'Site chips, unselected', roles: ['surfaceContainerHigh', 'onSurface'] },
      { region: 'Observation Notes section', roles: ['surfaceContainerHigh', 'onSurface'], change: 'was surface-container; darker step so the white cards lift' },
      { region: 'Priority segmented control', roles: ['surfaceContainerHighest', 'surfaceContainerLowest', 'onSurfaceVariant'] },
      { region: 'Note card', roles: ['surfaceContainerLowest', 'onSurface'] },
      { region: 'Note title and animal ID', roles: ['tertiary'], today: 'navy' },
      { region: 'Critical "!!!" badge', roles: ['errorContainer', 'onErrorContainer'] },
      { region: 'Card divider', roles: ['outlineVariant'] },
      { region: 'Modules add / edit icons', roles: ['primary'] },
      { region: '"Top" pill', roles: ['surfaceContainerHigh', 'onSurface'], today: 'frosted light', change: 'was inverse-surface; screenshot shows a light frosted pill' },
    ],
  },
  {
    id: 'homeModules', file: 'IMG_1602', label: 'Home · modules', icon: 'apps', url: 'antzapp://home#modules', Component: HomeModules,
    map: [
      { region: 'Taxonomic Hierarchy tile', roles: ['secondary', 'primary', 'onPrimary'], today: 'green gradient', change: 'was flat primary; now gradient secondary → primary ("Teal to Green")' },
      { region: 'Medical tile', roles: ['primary', 'tertiary', 'onPrimary'], today: 'sage-green gradient', change: 'was flat primary-container; now gradient primary → tertiary ("Green to Navy")' },
      { region: 'Housing tile', roles: ['info', 'tertiary', 'onTertiary'], today: 'slate gradient', change: 'was flat tertiary-container; now gradient info → tertiary ("Cyan to Navy")' },
      { region: 'Enclosures tile', roles: ['tertiary', 'info', 'onTertiary'], today: 'slate gradient', change: 'was flat tertiary; now gradient tertiary → info' },
      { region: 'Administer tile', roles: ['surfaceContainerHighest', 'surfaceVariant', 'onSurfaceVariant'], today: 'grey-sage', change: 'was flat surface-variant; now a subtle neutral gradient' },
      { region: 'Pending panel', roles: ['errorContainer', 'onErrorContainer'], today: 'peach' },
      { region: 'Pending rows', roles: ['surfaceContainerLowest', 'onSurface'] },
    ],
  },
];
