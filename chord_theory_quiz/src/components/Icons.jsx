const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const SoundOn = () => (
  <svg {...base}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

export const SoundOff = () => (
  <svg {...base}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M17 9l5 6M22 9l-5 6" />
  </svg>
);

export const Close = () => (
  <svg {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Play = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
  </svg>
);

export const Arrow = () => (
  <svg {...base}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

/** Brand mark: a triad stacked on a staff. */
export const TriadMark = (props) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
    <rect width="32" height="32" rx="3" fill="#1b1a22" />
    {[8, 12, 16, 20, 24].map((y) => (
      <line key={y} x1="4" x2="28" y1={y} y2={y} stroke="#efe9dc" strokeOpacity="0.35" strokeWidth="1" />
    ))}
    {[20, 16, 12].map((y) => (
      <ellipse key={y} cx="16" cy={y} rx="3.6" ry="2.5" transform={`rotate(-20 16 ${y})`} fill="#e3aa3e" />
    ))}
  </svg>
);
