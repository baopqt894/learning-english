import type { CSSProperties } from "react";

const paths: Record<string, string> = {
  orchard:"M12 21v-7m-5 7h10M12 5c4-5 9 1 7 4 5 5-1 10-7 6-6 4-12-1-7-6-1-4 3-8 7-4Zm-4 5h.1m7 1h.1",
  hoop:"M3 3h18v9H3zM8 10h8m-8 2 2 8h4l2-8m-7 2 5 4m1-4-5 4",
  net:"M2 5v16m20-16v16M2 8h20M2 15h20M7 8v7m5-7v7m5-7v7M2 11.5h20",
  signal:"M3 4h18v13H3zM7 20h10m-5-3v3M6 11l3-3 3 4 3-5 3 3",
  palette: "M21 11a9 9 0 1 0-10 10c2 .2 3-1.5 2-3s-.2-3 1.6-3h2.5c2.5 0 3.9-1.7 3.9-4ZM7 12h.1M8 8h.1M12 6.5h.1M16 8h.1",
  music: "M9 17V6l11-3v11M9 9l11-3M9 17a3 2.5 0 1 1-6 0 3 2.5 0 0 1 6 0Zm11-3a3 2.5 0 1 1-6 0 3 2.5 0 0 1 6 0Z",
  weather: "M4 16a4 4 0 0 1 2-7 5 5 0 0 1 9 1 3 3 0 0 1 1 6H4Zm11-10a4 4 0 0 1 5 5M17 2v1m5 2-1 1M5 19l-1 2m6-2-1 2",
  pot: "M3 10h18m-16 0v7a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-7M2 13h3m14 0h3M6 8q6-7 12 0M11 4h2",
  prism: "m3 19 9-15 9 15H3Zm9-15v10l9 5m-9-5-9 5",
  flask: "M9 3h6m-5 0v7L4 19q-.8 2 2 2h12q2.8 0 2-2l-6-9V3M7 15h10",
  fish: "M3 12q6-10 14-2l4-3v10l-4-3q-8 8-14-2Zm5-1h.1",
  hen: "M3 10l3 2c4 2 7 0 7-3a3 3 0 0 1 6-1l3 2-3 1c0 5-4 7-8 7-5 0-8-3-8-8Zm6 8v3m5-3v3",
  sprout: "M12 21v-8M4 5c5 0 8 2 8 8-5 0-8-3-8-8Zm16-2c0 6-3 9-8 10 0-6 3-9 8-10Z",
  flag: "M5 21V3m1 1c4-3 8 3 13 0v9c-5 3-9-3-13 0",
  hurdle: "M3 20h5m8 0h5M5 20V7h14v13M5 12h14M8 7l3 5m2-5 3 5",
  bed: "M3 5v16m0-5h18v5m0-5v-4c0-2-1-3-3-3h-7v7M3 9h5v4H3",
  board: "M3 3h18v13H3zM8 21l4-5 4 5M7 8h5m-5 3h9",
  pencil: "m4 15 11-11 5 5L9 20l-6 1zM13 6l5 5",
  headphones: "M3 15v-3a9 9 0 0 1 18 0v3M3 12h4v8H4q-1 0-1-2zm18 0h-4v8h3q1 0 1-2z",
  stage: "M3 3h18v16H3zM3 4q1 6 6 7l-6 5m18-12q-1 6-6 7l6 5M2 21h20",
  cup: "M3 8h13v5a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6zm13 1h2a3 3 0 0 1 0 6h-2M2 21h17M7 3v2m5-2v2",
  pool: "M2 18q2.5-2 5 0t5 0 5 0 5 0M2 22q2.5-2 5 0t5 0 5 0 5 0M7 14l4-5 4 2 4 4m-8-6 3-4 4 1M21 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  run: "M18 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 21l5-1 4-5m-5-3 3-3 4 1 4 4 3-1m-7-3-4 6 5 1 2 5",
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
  users: "M14 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2M17 6a3 3 0 0 1 0 6m2 2a4 4 0 0 1 3 4v2",
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
