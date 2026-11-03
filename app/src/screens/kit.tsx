/**
 * Building blocks for the ANTZ app screen recreations.
 * Every colour goes through paint(), which sets a CSS custom property (var(--antz-<role>))
 * and mirrors the role in data-bg / data-bg2 / data-fg / data-bd so the inspector and
 * the role highlight can find it. No raw colour values belong in the screen components.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cssVar, type Role } from '../theme/library';

export interface Paint {
  bg?: Role;
  /** Second gradient stop. With bg it draws linear-gradient(angle, bg, bg2). */
  bg2?: Role;
  fg?: Role;
  bd?: Role;
  /** Background opacity 0..1 (mixed with transparent). */
  a?: number;
  angle?: number;
}

export type PaintProps = {
  style: CSSProperties;
  'data-bg'?: Role;
  'data-bg2'?: Role;
  'data-fg'?: Role;
  'data-bd'?: Role;
  'data-a'?: number;
};

export const alpha = (role: Role, a: number) => `color-mix(in srgb, ${cssVar(role)} ${Math.round(a * 100)}%, transparent)`;

export function paint(spec: Paint, style: CSSProperties = {}): PaintProps {
  const s: CSSProperties = { ...style };
  if (spec.bg && spec.bg2) s.backgroundImage = `linear-gradient(${spec.angle ?? 135}deg, ${cssVar(spec.bg)}, ${cssVar(spec.bg2)})`;
  else if (spec.bg) s.backgroundColor = spec.a != null ? alpha(spec.bg, spec.a) : cssVar(spec.bg);
  if (spec.fg) s.color = cssVar(spec.fg);
  if (spec.bd) s.borderColor = cssVar(spec.bd);
  return { style: s, 'data-bg': spec.bg, 'data-bg2': spec.bg2, 'data-fg': spec.fg, 'data-bd': spec.bd, 'data-a': spec.a };
}

/* ---------- Icons ---------- */
export function Icon({ n, size = 20, fill = false, wght = 400, className = '', style, label }: { n: string; size?: number; fill?: boolean; wght?: number; className?: string; style?: CSSProperties; label?: string }) {
  return (
    <span
      className={`ms ${className}`}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${wght}, 'opsz' ${Math.min(48, Math.max(20, size))}`, ...style }}
    >
      {n}
    </span>
  );
}

/* ---------- Frame scaffolding ---------- */
export function Screen({ bg, fg = 'onSurface', children, overlay, label }: { bg: Role; fg?: Role; children: ReactNode; overlay?: ReactNode; label: string }) {
  return (
    <div className="scr" {...paint({ bg, fg })} role="img" aria-label={`${label} preview`}>
      <div className="scr-scroll">{children}</div>
      {overlay}
    </div>
  );
}

export function StatusBar({ time = '6:30', battery = 13, bg = 'surfaceContainerLowest' as Role, fg = 'onSurface' as Role, transparent = false }) {
  return (
    <div className="statusbar" {...paint(transparent ? { fg } : { bg, fg })}>
      <span className="sb-time">
        {time}
        <Icon n="notifications_off" size={15} fill wght={500} />
      </span>
      <span className="sb-right">
        <Icon n="signal_cellular_alt" size={17} wght={600} />
        <Icon n="wifi" size={17} wght={600} />
        <span className="sb-batt" {...paint({ bd: 'outline' })}>
          <span className="sb-batt-fill" {...paint({ bg: 'cautionContainer', fg: 'onCautionContainer' })}>{battery}</span>
        </span>
      </span>
    </div>
  );
}

export function AppBar({ title, right, bg = 'surfaceContainerLowest' as Role, back = true }: { title: string; right?: ReactNode; bg?: Role; back?: boolean }) {
  return (
    <div className="appbar" {...paint({ bg, fg: 'onSurface' })}>
      {back && <Icon n="arrow_back" size={22} />}
      <span className="appbar-title" {...paint({ fg: 'tertiary' })}>{title}</span>
      <span className="grow" />
      {right}
    </div>
  );
}

/** Path to a file in public/images, relative to the app base. */
export const img = (file: string) => `${import.meta.env.BASE_URL}images/${file}`;

/**
 * Photo block. With src it draws the real image (object-fit: cover) over a surface-variant fill,
 * with intrinsic width/height so nothing shifts while it loads. Without src it is the themed stand-in.
 */
export function Photo({ h, radius = 10, icon = 'image', children, style, iconSize = 30, src, alt = '', iw, ih, pos }: {
  h: number | string; radius?: number; icon?: string; children?: ReactNode; style?: CSSProperties; iconSize?: number;
  src?: string; alt?: string; iw?: number; ih?: number; pos?: string;
}) {
  return (
    <div className="photo" {...paint({ bg: 'surfaceVariant', fg: 'onSurfaceVariant' }, { height: h, borderRadius: radius, ...style })}>
      {src
        ? <img className="photo-img" src={img(src)} alt={alt} width={iw} height={ih} loading="lazy" decoding="async" draggable={false} style={pos ? { objectPosition: pos } : undefined} />
        : <Icon n={icon} size={iconSize} className="photo-glyph" />}
      {children}
    </div>
  );
}

/** Legibility shade for text over a photo. inverse-surface fading to transparent, text in inverse-on-surface. */
export function Shade({ side = 'bottom', size = '60%', minA = 0, children, style }: { side?: 'top' | 'bottom'; size?: string; minA?: number; children?: ReactNode; style?: CSSProperties }) {
  const dir = side === 'bottom' ? 'to top' : 'to bottom';
  return (
    <div
      className={`shade shade-${side}`}
      data-bg="inverseSurface"
      data-fg="inverseOnSurface"
      data-a={0.85}
      style={{ height: size, backgroundImage: `linear-gradient(${dir}, ${alpha('inverseSurface', 0.85)}, ${alpha('inverseSurface', minA)})`, color: cssVar('inverseOnSurface'), ...style }}
    >
      {children}
    </div>
  );
}

/** The ANTZ "a" placeholder used where an animal has no photo. */
export function AntzMark({ size = 40, role = 'outline' as Role }) {
  return (
    <span className="antz-mark" {...paint({ fg: role }, { fontSize: size })} aria-hidden>
      a
    </span>
  );
}

export function Avatar({ text, size = 34, bg = 'secondaryContainer' as Role, fg = 'onSecondaryContainer' as Role, fs }: { text: string; size?: number; bg?: Role; fg?: Role; fs?: number }) {
  return (
    <span className="avatar" {...paint({ bg, fg }, { width: size, height: size, fontSize: fs ?? size * 0.38 })}>
      {text}
    </span>
  );
}

export function Fab({ icon = 'add', fill = false, style }: { icon?: string; fill?: boolean; style?: CSSProperties }) {
  return (
    <div className="fab" {...paint({ bg: 'primaryContainer', fg: 'onPrimaryContainer' }, style)}>
      <Icon n={icon} size={24} fill={fill} wght={500} />
    </div>
  );
}

/** Speed-dial menu with the M3 scrim (scrim role at 32%). */
export function SpeedDial({ items, closeIcon = 'close' }: { items: [string, string][]; closeIcon?: string }) {
  return (
    <div className="dial-layer">
      <div className="dial-scrim" {...paint({ bg: 'scrim', a: 0.32 })} />
      <div className="dial">
        {items.map(([t, i]) => (
          <div className="dial-row" key={t}>
            <span className="dial-label" {...paint({ bg: 'surfaceContainerLowest', fg: 'primary' })}>{t}</span>
            <span className="dial-mini" {...paint({ bg: 'surfaceContainerHigh', fg: 'tertiary' })}>
              <Icon n={i} size={20} wght={500} />
            </span>
          </div>
        ))}
        <div className="dial-row">
          <Fab icon={closeIcon} style={{ position: 'static' }} />
        </div>
      </div>
    </div>
  );
}

export function SearchField({ text = 'Search', style }: { text?: string; style?: CSSProperties }) {
  return (
    <div className="search-field" {...paint({ bg: 'surfaceContainerLowest', fg: 'tertiary', bd: 'outlineVariant' }, style)}>
      <Icon n="search" size={20} wght={500} />
      <span style={{ fontWeight: 500 }}>{text}</span>
    </div>
  );
}

export function SearchAndViews({ grid = false }: { grid?: boolean }) {
  return (
    <div className="row search-views">
      <SearchField style={{ flex: 1 }} />
      <span {...paint({ fg: grid ? 'onSurface' : 'primary' })} className="view-btn"><Icon n="format_list_bulleted" size={22} wght={500} /></span>
      <span {...paint({ fg: grid ? 'primary' : 'onSurface' })} className="view-btn"><Icon n="view_agenda" size={22} fill /></span>
    </div>
  );
}

export function ListRow({ name, latin, n, mark = 'pets' }: { name: string; latin: string; n?: number | string; mark?: string | 'antz' }) {
  return (
    <div className="lrow" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface', bd: 'outlineVariant' })}>
      <div className="lrow-thumb" {...paint({ bg: 'surfaceContainerHigh' })}>
        {mark === 'antz' ? <AntzMark size={34} /> : <span {...paint({ fg: 'outline' })}><Icon n={mark} size={40} fill /></span>}
      </div>
      <div className="lrow-text">
        <span className="lrow-name" {...paint({ fg: 'onSurfaceVariant' })}>{name}</span>
        <i className="lrow-latin" {...paint({ fg: 'onSurfaceVariant' })}>{latin}</i>
      </div>
      {n !== undefined && <b className="lrow-n">{n}</b>}
    </div>
  );
}

/** Top search row shared by the home screens: avatar, search, scan button. */
export function HomeSearch({ placeholder, avatar = true }: { placeholder: string; avatar?: boolean }) {
  return (
    <div className="row home-search">
      {avatar && <Avatar text="DA" size={34} />}
      <div className="search-field big" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurfaceVariant' }, { flex: 1 })}>
        <span {...paint({ fg: 'onSurface' })}><Icon n="search" size={20} /></span>
        <span>Search “{placeholder}”</span>
      </div>
      <span className="square-btn" {...paint({ bg: 'surfaceContainerLowest', fg: 'onSurface' })}>
        <Icon n="qr_code_scanner" size={20} />
      </span>
    </div>
  );
}

export function SiteChips() {
  return (
    <div className="row site-chips">
      <span className="chip chip-icon" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface' })}><Icon n="menu" size={22} /></span>
      <span className="chip chip-sel" {...paint({ bg: 'tertiary', fg: 'onTertiary' })}>All sites</span>
      <span className="chip" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface' })}>Adirampattinam</span>
      <span className="chip" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface' })}>Ammapettai</span>
    </div>
  );
}

export function FloatingPills({ variant }: { variant: 'feed' | 'compact' }) {
  if (variant === 'feed') {
    return (
      <div className="float-pills">
        <span className="fpill" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface', a: 0.92 })}>Modules <Icon n="keyboard_double_arrow_down" size={18} /></span>
        <span className="fpill" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface', a: 0.92 })}><Icon n="widgets" size={20} fill /> Quick Actions</span>
        <span className="fround" {...paint({ bg: 'secondaryContainer', fg: 'onSecondaryContainer' })}><Icon n="chat_bubble" size={20} fill /></span>
      </div>
    );
  }
  return (
    <div className="float-pills compact">
      <span className="top-pill" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface', a: 0.92 })}><Icon n="arrow_upward" size={16} wght={600} /> Top</span>
      <div className="row" style={{ gap: 14 }}>
        <span className="fround" {...paint({ bg: 'surfaceContainerHigh', fg: 'onSurface', a: 0.95 })}><Icon n="widgets" size={20} fill /></span>
        <span className="fround" {...paint({ bg: 'secondaryContainer', fg: 'onSecondaryContainer' })}><Icon n="chat_bubble" size={20} fill /></span>
      </div>
    </div>
  );
}
