// ui.jsx — shared chrome + atoms
// Window frame (Windows 11-ish), Sidebar (64px), Icon set, ProgressBar.

const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

// ─── Icons (24px viewbox, 16px default render) ───────────────────────────
function Icon({ name, size = 16, stroke = 1.7, ...rest }) {
  const paths = ICONS[name];
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      {...rest}
    >
      {paths}
    </svg>
  );
}

const ICONS = {
  home:       <><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z" /></>,
  grid:       <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  settings:   <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  plus:       <><path d="M12 5v14M5 12h14" /></>,
  x:          <><path d="M18 6L6 18M6 6l12 12" /></>,
  check:      <><path d="M5 12l5 5L20 7" /></>,
  trash:      <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" /></>,
  pause:      <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  play:       <><path d="M5 3l14 9-14 9V3z" /></>,
  arrowLeft:  <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
  arrowRight: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
  chevDown:   <><path d="M6 9l6 6 6-6" /></>,
  paperclip:  <><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></>,
  checklist:  <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  search:     <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>,
  sun:        <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
  moon:       <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>,
  grip:       <><circle cx="9" cy="6" r="0.8" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="0.8" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="0.8" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="0.8" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="0.8" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="0.8" fill="currentColor" stroke="none" /></>,
  more:       <><circle cx="6"  cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  pencil:     <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></>,
  link:       <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  file:       <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  folder:     <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></>,
  ext:        <><path d="M14 3h7v7M21 3l-9 9M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
  download:   <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>,
  bell:       <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  calendar:   <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
};

// ─── Window chrome (Windows 11-style) ─────────────────────────────────────
function WindowChrome({ title = "zntt-control", children }) {
  return (
    <div className="zc-window">
      <div className="zc-titlebar">
        <div className="zc-tb-title">
          <span className="zc-tb-logo" />
          <span>{title}</span>
        </div>
        <div className="zc-tb-spacer" />
        <div className="zc-tb-controls">
          <button className="zc-tb-btn" tabIndex={-1} aria-label="minimize">
            <svg width="11" height="11" viewBox="0 0 11 11"><line x1="1" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.1" /></svg>
          </button>
          <button className="zc-tb-btn" tabIndex={-1} aria-label="maximize">
            <svg width="11" height="11" viewBox="0 0 11 11"><rect x="1.5" y="1.5" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.1" /></svg>
          </button>
          <button className="zc-tb-btn close" tabIndex={-1} aria-label="close">
            <svg width="11" height="11" viewBox="0 0 11 11"><line x1="1.5" y1="1.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" /><line x1="9.5" y1="1.5" x2="1.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" /></svg>
          </button>
        </div>
      </div>
      <div className="zc-app-body">{children}</div>
    </div>
  );
}

// ─── Sidebar (64px, icons only) ───────────────────────────────────────────
function Sidebar({ active = 'dashboard', onNav }) {
  return (
    <aside className="zc-sidebar">
      <div className="zc-sb-logo" title="zntt-control">Z</div>
      <button
        className={"zc-sb-item " + (active === 'dashboard' ? 'active' : '')}
        onClick={() => onNav && onNav('dashboard')}
        title="Dashboard"
      >
        <Icon name="grid" size={18} />
      </button>
      <div className="zc-sb-spacer" />
      <button
        className={"zc-sb-item " + (active === 'settings' ? 'active' : '')}
        onClick={() => onNav && onNav('settings')}
        title="Settings"
      >
        <Icon name="settings" size={18} />
      </button>
    </aside>
  );
}

// ─── Progress ─────────────────────────────────────────────────────────────
function Progress({ value, color }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="zc-progress">
      <i style={{ width: v + '%', background: color }} />
    </div>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────────
function PriorityBadge({ p }) {
  if (!p) return null;
  return (
    <span className={"zc-badge pri-" + p}>
      <span className="dot" />
      {p}
    </span>
  );
}

// ─── App shell wrapper — combines window + sidebar + main ─────────────────
function AppShell({ active, onNav, title = "zntt-control", children, className = "" }) {
  return (
    <div className={"zc-app " + className}>
      <WindowChrome title={title}>
        <Sidebar active={active} onNav={onNav} />
        <main className="zc-main">{children}</main>
      </WindowChrome>
    </div>
  );
}

Object.assign(window, {
  Icon, ICONS,
  WindowChrome, Sidebar, Progress, PriorityBadge, AppShell,
});
