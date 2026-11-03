import { AntzMark, AppBar, Fab, Icon, ListRow, Photo, Screen, SearchAndViews, Shade, SpeedDial, StatusBar, paint } from './kit';
import type { ScreenDef } from './types';

function SitePicker() {
  return (
    <div className="row site-picker">
      <span {...paint({ fg: 'primary' })}><Icon n="location_on" size={22} fill /></span>
      <span {...paint({ fg: 'tertiary' })}>All sites</span>
      <span {...paint({ fg: 'tertiary' })}><Icon n="keyboard_arrow_down" size={20} wght={600} /></span>
    </div>
  );
}

/* ---------- IMG_1603 · Collections ---------- */
function Collections() {
  return (
    <Screen label="Collections" bg="surfaceContainerHigh">
      <StatusBar time="6:29" battery={14} />
      <AppBar title="Collections" bg="surfaceContainerHigh" right={<span {...paint({ fg: 'tertiary' })}><Icon n="search" size={24} /></span>} />
      <SitePicker />
      <div className="insights" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' })}>
        <div className="insights-top" {...paint({ bg: 'inverseSurface', fg: 'inverseOnSurface' })}>
          <div className="row" style={{ gap: 12 }}>
            <span className="ins-ic" {...paint({ bg: 'inverseOnSurface', fg: 'inversePrimary', a: 0.12 })}><Icon n="query_stats" size={20} wght={500} /></span>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Insights</span>
          </div>
          <div className="row ins-nums">
            <div className="col ins-col"><b className="ins-big" {...paint({ fg: 'inversePrimary' })}>325</b><span>Species</span></div>
            <div className="col ins-col"><b className="ins-big" {...paint({ fg: 'inversePrimary' })}>26.2K</b><span>Population</span></div>
          </div>
        </div>
        <div className="insights-bottom">
          <span className="row filter-lbl" {...paint({ fg: 'tertiary' })}>Last 6 Months <Icon n="filter_list" size={16} wght={600} /></span>
          <div className="row" style={{ justifyContent: 'space-between', padding: '0 18px 0 32px' }}>
            <div className="col ins-col"><b className="mid-num" {...paint({ fg: 'tertiary' })}>2226</b><span {...paint({ fg: 'onSurfaceVariant' })}>Accession</span></div>
            <div className="col ins-col"><b className="mid-num" {...paint({ fg: 'tertiary' })}>583</b><span {...paint({ fg: 'onSurfaceVariant' })}>Birth</span></div>
          </div>
        </div>
      </div>
      <SearchAndViews />
      <div className="col list">
        <ListRow name="Gastropods" latin="Gastropoda" n={7324} mark="pets" />
        <ListRow name="Birds" latin="Aves" n={6526} mark="raven" />
        <ListRow name="Mammals" latin="Mammalia" n={4603} mark="pets" />
        <ListRow name="Insects" latin="Insecta" n={2009} mark="pest_control" />
        <ListRow name="Ray-finned fishes" latin="Actinopterygii" n={1840} mark="set_meal" />
      </div>
    </Screen>
  );
}

/* ---------- IMG_1604 / 1605 / 1606 · Order detail ---------- */
function OrderTop({ grid }: { grid: boolean }) {
  return (
    <>
      <StatusBar time={grid ? '6:30' : '6:29'} battery={14} />
      <Photo h={292} radius={0} iconSize={44} src="order-hero-leopard.webp" alt="Leopard standing in dry grass" iw={800} ih={599} pos="60% 50%">
        <Shade side="top" size="62%" style={{ justifyContent: 'flex-start', paddingTop: 14 }}>
          <Icon n="arrow_back" size={24} />
          <span style={{ marginTop: 22, fontSize: 13 }}>Order</span>
          <b style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>Carnivores</b>
          <i style={{ fontSize: 12 }}>Carnivora</i>
        </Shade>
        <div className="carousel-ind">
          <span className="car-count" {...paint({ bg: 'inverseSurface', fg: 'inverseOnSurface', a: 0.75 })}>1/93</span>
          {[0, 1, 2, 3].map((i) => <span key={i} className="car-dot" {...paint({ bg: 'inverseOnSurface', a: i === 0 ? 0.95 : 0.6 })} />)}
        </div>
      </Photo>
      <SitePicker />
      <div className="row stat-cards">
        <div className="stat-card" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' })}>
          <span className="stat-lbl" {...paint({ fg: 'primary' })}>Current data</span>
          <div className="row" style={{ justifyContent: 'space-around' }}>
            <div className="col ins-col"><b className="stat-num" {...paint({ fg: 'tertiary' })}>3.0K</b><span className="small">Population</span></div>
            <div className="col ins-col"><b className="stat-num" {...paint({ fg: 'tertiary' })}>45</b><span className="small">Species</span></div>
          </div>
        </div>
        <div className="stat-card" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' }, { alignItems: 'center' })}>
          <span className="row stat-lbl" {...paint({ fg: 'tertiary' }, { gap: 6, fontSize: 13 })}>Last 6 Months <Icon n="filter_list" size={16} wght={600} /></span>
          <div className="col ins-col"><b className="stat-num" {...paint({ fg: 'tertiary' })}>144</b><span className="small" {...paint({ fg: 'onSurfaceVariant' })}>Birth</span></div>
        </div>
      </div>
      <div className="fam-count" {...paint({ fg: 'onSurfaceVariant' })}>8 Family under Carnivora</div>
      <SearchAndViews grid={grid} />
    </>
  );
}

function OrderList() {
  return (
    <Screen label="Order detail list" bg="surfaceContainerHigh" overlay={<Fab icon="add_circle" />}>
      <OrderTop grid={false} />
      <div className="col list">
        <ListRow name="Felidae" latin="Felidae" n={1627} mark="antz" />
        <ListRow name="Canidae" latin="Canidae" n={1075} mark="antz" />
        <ListRow name="Procyonids" latin="Procyonidae" mark="pets" />
        <ListRow name="Mustelids" latin="Mustelidae" n={212} mark="antz" />
      </div>
    </Screen>
  );
}

function GridCard() {
  return (
    <div className="grid-card" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface', bd: 'outlineVariant' })}>
      <div className="grid-card-img" {...paint({ bg: 'surfaceContainerHigh' })}><AntzMark size={40} /></div>
      <div className="grid-card-txt">
        <span {...paint({ fg: 'onSurfaceVariant' }, { fontSize: 15 })}>Felidae</span>
        <i className="small" {...paint({ fg: 'onSurfaceVariant' })}>Felidae</i>
      </div>
    </div>
  );
}

function OrderGrid() {
  return (
    <Screen label="Order detail grid" bg="surfaceContainerHigh" overlay={<Fab icon="add_circle" />}>
      <OrderTop grid />
      <div className="col list"><GridCard /><GridCard /></div>
    </Screen>
  );
}

function OrderDial() {
  return (
    <Screen label="Order detail with FAB menu open" bg="surfaceContainerHigh" overlay={<SpeedDial items={[['Collections', 'pets'], ['Home', 'home']]} closeIcon="cancel" />}>
      <OrderTop grid />
      <div className="col list"><GridCard /></div>
    </Screen>
  );
}

const orderShared = [
  { region: 'Text over the hero photo', roles: ['inverseSurface', 'inverseOnSurface'] as const, today: 'white on photo', change: 'was a fixed scrim and white text; now an inverse-surface shade' },
  { region: 'Page background', roles: ['surfaceContainerHigh'] as const, today: 'sage', change: 'was background; sage needs a container tone' },
  { region: 'Location pin', roles: ['primary'] as const },
  { region: '"All sites", stat numbers, filter label', roles: ['tertiary'] as const, today: 'navy-teal', change: 'was on-surface; navy text now uses tertiary' },
  { region: 'Stat cards', roles: ['surfaceContainerLowest', 'onSurface'] as const },
  { region: '"Current data" label', roles: ['primary'] as const },
  { region: 'Search field', roles: ['surfaceContainerLowest', 'tertiary', 'outlineVariant'] as const },
];

export const collectionScreens: ScreenDef[] = [
  {
    id: 'collections', file: 'IMG_1603', label: 'Collections', icon: 'category', url: 'antzapp://collections', Component: Collections,
    map: [
      { region: 'Page and app bar background', roles: ['surfaceContainerHigh'], today: 'sage', change: 'was background' },
      { region: 'App bar title and back arrow', roles: ['tertiary', 'onSurface'], today: 'navy-teal' },
      { region: 'Insights header', roles: ['inverseSurface', 'inverseOnSurface'], today: 'dark teal' },
      { region: 'Insights big numbers', roles: ['inversePrimary'], today: 'bright green' },
      { region: 'Insights icon circle', roles: ['inverseOnSurface', 'inversePrimary'], change: 'new: inverse-on-surface at 12% (a scrim tint failed AA in dark)' },
      { region: 'Insights lower half', roles: ['surfaceContainerLowest', 'onSurfaceVariant'] },
      { region: 'Secondary stats and filter label', roles: ['tertiary'] },
      { region: 'Search field', roles: ['surfaceContainerLowest', 'tertiary', 'outlineVariant'], change: 'text was on-surface-variant; now tertiary (navy)' },
      { region: 'View toggle, active / inactive', roles: ['primary', 'onSurface'] },
      { region: 'List row', roles: ['surfaceContainerLowest', 'onSurface', 'outlineVariant'] },
      { region: 'Row thumbnail and silhouette', roles: ['surfaceContainerHigh', 'outline'], today: 'grey tile, sage silhouette', change: 'was surface-variant / on-surface-variant' },
    ],
  },
  {
    id: 'orderList', file: 'IMG_1604', label: 'Order · list', icon: 'view_list', url: 'antzapp://taxonomy/order/carnivora', Component: OrderList,
    map: [
      ...orderShared.map((r) => ({ ...r, roles: [...r.roles] })),
      { region: 'Family list rows', roles: ['surfaceContainerLowest', 'onSurface', 'outlineVariant'] },
      { region: 'Add FAB', roles: ['primaryContainer', 'onPrimaryContainer'], today: 'bright mint green', change: 'same roles; the new primary container is the brand green itself' },
    ],
  },
  {
    id: 'orderGrid', file: 'IMG_1605', label: 'Order · grid', icon: 'view_agenda', url: 'antzapp://taxonomy/order/carnivora?view=grid', Component: OrderGrid,
    map: [
      { region: 'Grid card', roles: ['surfaceContainerLowest', 'onSurface', 'outlineVariant'] },
      { region: 'Image area and ANTZ mark', roles: ['surfaceContainerHigh', 'outline'], change: 'was surface-variant / on-surface-variant' },
      { region: 'View toggle, active (grid)', roles: ['primary'] },
      ...orderShared.slice(0, 4).map((r) => ({ ...r, roles: [...r.roles] })),
      { region: 'Add FAB', roles: ['primaryContainer', 'onPrimaryContainer'] },
    ],
  },
  {
    id: 'orderDial', file: 'IMG_1606', label: 'Order · FAB menu', icon: 'more_vert', url: 'antzapp://taxonomy/order/carnivora#fab', Component: OrderDial,
    map: [
      { region: 'Scrim over the page', roles: ['scrim'], today: '~85% white wash', change: 'was surface at 85%; now the M3 scrim at 32%' },
      { region: 'Menu labels', roles: ['surfaceContainerLowest', 'primary'], today: 'green text, no container', change: 'labels now sit on a surface-container-lowest pill so they stay readable on the scrim' },
      { region: 'Mini action buttons', roles: ['surfaceContainerHigh', 'tertiary'], today: 'pale green, navy icon', change: 'icon was on-surface; now tertiary (navy)' },
      { region: 'Close FAB', roles: ['primaryContainer', 'onPrimaryContainer'] },
    ],
  },
];
