import type { CSSProperties } from "react";

const paths: Record<string, string> = {
  camera: "M3 7h4l2-3h6l2 3h4v13H3V7Zm13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  sliders: "M4 6h3m4 0h9M4 12h9m4 0h3M4 18h3m4 0h9M7 4v4m6 2v4m-6 2v4",
  grid: "M3 3h18v18H3V3Zm6 0v18m6-18v18M3 9h18M3 15h18",
  menu: "M4 6h16M4 12h16M4 18h16",
  chat: "M4 4h16v12H9l-5 4V4Zm4 4h8m-8 4h5",
  computer: "M3 3h18v13H3V3Zm9 13v5m-5 0h10M6 6h12",
  ball: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-4 4 3-2 5h-4l-2-5 4-3Zm0-5v5m9 4-5-1m2 8-4-3m-8 3 4-3m-7-4 5-1",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  fullscreen: "M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6",
  image: "M3 3h18v18H3V3Zm0 13 6-6 7 7m-3-3 4-4 4 4M15 7h.01",
  compass: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-3 5-5 3 3-5 5-3Z",
  book: "M12 5C8 2 4 3 3 4v15c3-2 6-1 9 1m0-15c4-3 8-2 9-1v15c-3-2-6-1-9 1V5Z",
  map: "m9 4-6 3v14l6-3 6 2 6-3V3l-6 3-6-2Zm0 0v14m6-12v14",
  trophy:
    "M8 3h8v7a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v5m-4 2h8m-8-2h8",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  chevron: "m9 5 7 7-7 7",
  lock: "M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 5v2",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Zm-3 6v1a6 6 0 0 0 12 0v-1m-6 7v4m-4 0h8",
  sound: "m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  mute: "m11 4-6 5H2v6h3l6 5V4Zm5 5 5 6m0-6-5 6",
  bulb: "M9 18h6m-6 3h6M8 15a7 7 0 1 1 8 0v1H8v-1ZM12 6v4",
  send: "m22 2-7 20-4-9L2 9l20-7Zm0 0L11 13",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-5v5l3 2",
  star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  leaf: "M20 3C8 0 0 8 6 17s17-2 14-14ZM4 21 16 9",
  bag: "M4 7h16l-1 14H5L4 7Zm4 0V5a4 4 0 0 1 8 0v2",
  food: "M4 3v6a3 3 0 0 0 6 0V3M7 3v18m12-18c-5 3-5 10 0 10V3Zm0 10v8",
  reset: "M3 11a9 9 0 1 1 2 7M3 4v7h7",
  close: "m6 6 12 12M6 18 18 6",
  target:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM12 10v4m-2-2h4",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  school: "m2 10 10-7 10 7M4 9v12h16V9M9 21v-7h6v7m-4-13h2",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-1v6m0-10v.1",
};

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name] || paths.compass} />
    </svg>
  );
}
