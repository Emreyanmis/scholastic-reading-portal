// Tiny inline SVG icon set. Picking this over an npm icon library keeps the
// dependency footprint and bundle size small for the demo.

type Props = { className?: string; size?: number };

const base = (size = 16, extra = ""): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: extra,
});

export const IconBook = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);
export const IconUsers = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
export const IconCheck = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}><polyline points="20 6 9 17 4 12" /></svg>
);
export const IconPlay = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}><polygon points="6 4 20 12 6 20 6 4" /></svg>
);
export const IconPause = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
export const IconClock = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
export const IconCalendar = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
export const IconPlus = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
export const IconArrowLeft = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
);
export const IconLogout = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
export const IconSparkle = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}>
    <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4" />
  </svg>
);
export const IconHourglass = ({ className = "", size = 16 }: Props) => (
  <svg {...base(size, className)}>
    <path d="M5 22h14M5 2h14" />
    <path d="M7 2a5 5 0 0 0 5 6 5 5 0 0 0 5-6" />
    <path d="M17 22a5 5 0 0 0-5-6 5 5 0 0 0-5 6" />
  </svg>
);
