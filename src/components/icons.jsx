// Bộ icon SVG inline (phong cách lucide) thay cho Font Awesome CDN —
// để app hoạt động offline hoàn toàn.

function Icon({ children, size = '1em', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconMoon = (p) => (
  <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Icon>
);
export const IconSun = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>
);
export const IconGear = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>
);
export const IconBook = (p) => (
  <Icon {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Icon>
);
export const IconPlay = (p) => (
  <Icon {...p}><polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none" /></Icon>
);
export const IconPause = (p) => (
  <Icon {...p}><rect x="5" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="15" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /></Icon>
);
export const IconReset = (p) => (
  <Icon {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Icon>
);
export const IconArrowLeft = (p) => (
  <Icon {...p}><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></Icon>
);
export const IconArrowRight = (p) => (
  <Icon {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Icon>
);
export const IconVolume = (p) => (
  <Icon {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.4 5.6a9 9 0 0 1 0 12.8" /></Icon>
);
export const IconX = (p) => (
  <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>
);
export const IconPlus = (p) => (
  <Icon {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
);
export const IconStar = (p) => (
  <Icon {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>
);
export const IconCheck = (p) => (
  <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>
);
export const IconCloudDown = (p) => (
  <Icon {...p}><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="M12 12v9" /><path d="m8 17 4 4 4-4" /></Icon>
);
export const IconCloudUp = (p) => (
  <Icon {...p}><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="M12 21v-9" /><path d="m8 16 4-4 4 4" /></Icon>
);
export const IconDownload = (p) => (
  <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></Icon>
);
export const IconUpload = (p) => (
  <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></Icon>
);
export const IconExpand = (p) => (
  <Icon {...p}><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="m21 3-7 7" /><path d="m3 21 7-7" /></Icon>
);
export const IconWand = (p) => (
  <Icon {...p}><path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" /><path d="M17.8 11.8 19 13" /><path d="M15 9h.01" /><path d="M17.8 6.2 19 5" /><path d="m3 21 9-9" /><path d="M12.2 6.2 11 5" /></Icon>
);
export const IconRefresh = (p) => (
  <Icon {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Icon>
);
export const IconCalendar = (p) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>
);
export const IconInfo = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Icon>
);
export const IconChart = (p) => (
  <Icon {...p}><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" fill="currentColor" stroke="none" /><rect x="12" y="8" width="3" height="10" fill="currentColor" stroke="none" /><rect x="17" y="5" width="3" height="13" fill="currentColor" stroke="none" /></Icon>
);
export const IconFlame = (p) => (
  <Icon {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3 2.2.5 4 2.6 4 5a4 4 0 0 1-8 0c0-1 .3-2 .8-2.8.4 1.3 1 2.3 1.7 3.3z" /><path d="M12 2c1 3 2.5 4.2 4.5 6.5A8 8 0 0 1 20 14a8 8 0 1 1-16 0c0-2 .7-4 2-5.5C7.3 10 9 11 9 11c-.5-3 .5-6.5 3-9z" /></Icon>
);
export const IconCube = (p) => (
  <Icon {...p}><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></Icon>
);
export const IconScale = (p) => (
  <Icon {...p}><path d="m16 16 3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1z" /><path d="m2 16 3-8 3 8c-.9.7-1.9 1-3 1s-2.1-.3-3-1z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></Icon>
);
export const IconChip = (p) => (
  <Icon {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" /></Icon>
);
export const IconClock = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></Icon>
);
export const IconShare = (p) => (
  <Icon {...p}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="m16 6-4-4-4 4" /><path d="M12 2v13" /></Icon>
);
export const IconLayers = (p) => (
  <Icon {...p}><path d="m12 2 8.5 4.7a1 1 0 0 1 0 1.7L12 13 3.5 8.4a1 1 0 0 1 0-1.7z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></Icon>
);
