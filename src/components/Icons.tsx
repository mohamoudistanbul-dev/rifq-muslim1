import React from 'react';

type P = { size?: number; className?: string };

const S = (props: P) => ({
  width: props.size || 22,
  height: props.size || 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: props.className,
  'aria-hidden': true,
});

export const Icon = {
  home: (p: P) => (
    <svg {...S(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></svg>
  ),
  quran: (p: P) => (
    <svg {...S(p)}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 5.5v15" /><path d="M9 8h6M9 11.5h6" /></svg>
  ),
  mosque: (p: P) => (
    <svg {...S(p)}><path d="M12 3c2.2 2 3.4 3.4 3.4 5.1 0 1.4-1.5 2.4-3.4 2.4S8.6 9.5 8.6 8.1C8.6 6.4 9.8 5 12 3z" /><path d="M4 21v-7.5a2.5 2.5 0 0 1 5 0V21" /><path d="M15 21v-7.5a2.5 2.5 0 0 1 5 0V21" /><path d="M3 21h18" /><path d="M10.5 21v-4h3v4" /></svg>
  ),
  beads: (p: P) => (
    <svg {...S(p)}><circle cx="12" cy="5" r="1.6" /><circle cx="17.5" cy="7.5" r="1.6" /><circle cx="19" cy="13" r="1.6" /><circle cx="15.5" cy="18" r="1.6" /><circle cx="9.5" cy="18.5" r="1.6" /><circle cx="5.5" cy="14.5" r="1.6" /><circle cx="6" cy="8.5" r="1.6" /></svg>
  ),
  more: (p: P) => (
    <svg {...S(p)}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
  ),
  compass: (p: P) => (
    <svg {...S(p)}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5.5-5.5 2 2-5.5z" /></svg>
  ),
  calendar: (p: P) => (
    <svg {...S(p)}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
  ),
  moon: (p: P) => (
    <svg {...S(p)}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /></svg>
  ),
  sun: (p: P) => (
    <svg {...S(p)}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" /></svg>
  ),
  bell: (p: P) => (
    <svg {...S(p)}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
  ),
  user: (p: P) => (
    <svg {...S(p)}><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20.5c1.5-3.6 4.2-5.4 7.5-5.4s6 1.8 7.5 5.4" /></svg>
  ),
  settings: (p: P) => (
    <svg {...S(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.9 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.5 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9.4A1.6 1.6 0 0 0 10.4 3V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z" /></svg>
  ),
  search: (p: P) => (
    <svg {...S(p)}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
  ),
  bookmark: (p: P) => (
    <svg {...S(p)}><path d="M6.5 4h11v17l-5.5-4-5.5 4z" /></svg>
  ),
  play: (p: P) => (
    <svg {...S(p)}><path d="M7 4.5 19 12 7 19.5z" fill="currentColor" /></svg>
  ),
  pause: (p: P) => (
    <svg {...S(p)}><path d="M8 5v14M16 5v14" strokeWidth={2.6} /></svg>
  ),
  back: (p: P) => (
    <svg {...S(p)}><path d="M15 4.5 7.5 12l7.5 7.5" /></svg>
  ),
  chevron: (p: P) => (
    <svg {...S(p)}><path d="m9 5 7 7-7 7" /></svg>
  ),
  check: (p: P) => (
    <svg {...S(p)}><path d="m4.5 12.5 5 5 10-11" strokeWidth={2.2} /></svg>
  ),
  close: (p: P) => (
    <svg {...S(p)}><path d="M5.5 5.5l13 13M18.5 5.5l-13 13" /></svg>
  ),
  star: (p: P) => (
    <svg {...S(p)}><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" /></svg>
  ),
  location: (p: P) => (
    <svg {...S(p)}><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>
  ),
  phone: (p: P) => (
    <svg {...S(p)}><path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z" /></svg>
  ),
  mail: (p: P) => (
    <svg {...S(p)}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>
  ),
  share: (p: P) => (
    <svg {...S(p)}><circle cx="6" cy="12" r="2.4" /><circle cx="17.5" cy="6" r="2.4" /><circle cx="17.5" cy="18" r="2.4" /><path d="m8.2 10.8 7-3.6M8.2 13.2l7 3.6" /></svg>
  ),
  copy: (p: P) => (
    <svg {...S(p)}><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" /></svg>
  ),
  shield: (p: P) => (
    <svg {...S(p)}><path d="M12 3l7.5 3v6c0 4.5-3.2 7.6-7.5 9-4.3-1.4-7.5-4.5-7.5-9V6z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></svg>
  ),
  heart: (p: P) => (
    <svg {...S(p)}><path d="M12 20s-7-4.4-7-9.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7 3.2C19 15.6 12 20 12 20z" /></svg>
  ),
  chat: (p: P) => (
    <svg {...S(p)}><path d="M20.5 12a8 8 0 0 1-11.6 7.2L4 20.5l1.3-4.6A8 8 0 1 1 20.5 12z" /><path d="M9 11h6M9 14h4" /></svg>
  ),
  book: (p: P) => (
    <svg {...S(p)}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v18H6.5A2.5 2.5 0 0 1 4 18.5z" /><path d="M8 3v18" /></svg>
  ),
  lock: (p: P) => (
    <svg {...S(p)}><rect x="4.5" y="10" width="15" height="11" rx="2.5" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /></svg>
  ),
  globe: (p: P) => (
    <svg {...S(p)}><circle cx="12" cy="12" r="9" /><path d="M3.5 12h17M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></svg>
  ),
  download: (p: P) => (
    <svg {...S(p)}><path d="M12 4v10" /><path d="m8 10.5 4 4 4-4" /><path d="M4.5 19.5h15" /></svg>
  ),
  plus: (p: P) => (
    <svg {...S(p)}><path d="M12 5v14M5 12h14" strokeWidth={2.2} /></svg>
  ),
  minus: (p: P) => (
    <svg {...S(p)}><path d="M5 12h14" strokeWidth={2.2} /></svg>
  ),
  refresh: (p: P) => (
    <svg {...S(p)}><path d="M20 12a8 8 0 1 1-2.5-5.8" /><path d="M20 4v5h-5" /></svg>
  ),
  trash: (p: P) => (
    <svg {...S(p)}><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></svg>
  ),
  edit: (p: P) => (
    <svg {...S(p)}><path d="M4.5 19.5h4L20 8a2.5 2.5 0 0 0-3.5-3.5L5 16z" /><path d="m14.5 6.5 3 3" /></svg>
  ),
  send: (p: P) => (
    <svg {...S(p)}><path d="M21 3 10.5 13.5" /><path d="M21 3l-7 18-3.5-7.5L3 10z" /></svg>
  ),
  flag: (p: P) => (
    <svg {...S(p)}><path d="M6 21V4" /><path d="M6 4h11l-2 4 2 4H6" /></svg>
  ),
  kids: (p: P) => (
    <svg {...S(p)}><circle cx="12" cy="7.5" r="3.5" /><path d="M5 21c.6-4.2 3.4-6.5 7-6.5s6.4 2.3 7 6.5" /><path d="M9.5 6.5h.01M14.5 6.5h.01" strokeWidth={2.4} /></svg>
  ),
  kaaba: (p: P) => (
    <svg {...S(p)}><rect x="5" y="6" width="14" height="14" rx="1.5" /><path d="M5 10h14" /><path d="M9 6V4h6v2" /></svg>
  ),
  gift: (p: P) => (
    <svg {...S(p)}><rect x="3.5" y="9" width="17" height="11.5" rx="2" /><path d="M3.5 13h17M12 9v11.5" /><path d="M12 9S9.5 4 7.5 5.2C5.7 6.3 7 9 12 9zm0 0s2.5-5 4.5-3.8C18.3 6.3 17 9 12 9z" /></svg>
  ),
  chart: (p: P) => (
    <svg {...S(p)}><path d="M4 20V9M10 20V4M16 20v-7M22 20H2" /></svg>
  ),
};

export type IconName = keyof typeof Icon;

export function AppIcon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  const C = Icon[name] || Icon.star;
  return <C size={size} className={className} />;
}
