export const PHOTO_FORMATS = {
  screen: { label: "Màn hình", ratio: null },
  wide: { label: "16:9", ratio: 16 / 9 },
  portrait: { label: "4:5", ratio: 4 / 5 },
} as const;

export type PhotoFormat = keyof typeof PHOTO_FORMATS;
export type PhotoLight = "daylight" | "sunset" | "moonlight";
export type PhotoAdjustment = "left" | "right" | "up" | "down" | "in" | "out";
export type PhotoCapture = { blob: Blob; width: number; height: number };

export const PHOTO_LIGHTS = {
  daylight: {
    label: "Nắng chiều", sky: 0xc8d7cf, ambient: 0xd5e6ff, bounce: 0xa89468,
    fill: 1.45, sun: 0xffdda3, power: 3.12, exposure: 0.97, direction: [-16, 23, 10],
  },
  sunset: {
    label: "Hoàng hôn", sky: 0xd7b5a5, ambient: 0xb4bbf0, bounce: 0xb77b61,
    fill: 1.22, sun: 0xffa76b, power: 3.65, exposure: 1.02, direction: [-22, 14, 11],
  },
  moonlight: {
    label: "Trăng xanh", sky: 0x263b59, ambient: 0x8eaafa, bounce: 0x636788,
    fill: 1.28, sun: 0x8ab8ff, power: 1.8, exposure: 0.86, direction: [12, 20, -13],
  },
} as const;

export function photoCrop(width: number, height: number, format: PhotoFormat) {
  const ratio = PHOTO_FORMATS[format].ratio;
  if (ratio === null) return { x: 0, y: 0, width, height };
  const cropWidth = Math.min(width, height * ratio);
  const cropHeight = cropWidth / ratio;
  return { x: (width - cropWidth) / 2, y: (height - cropHeight) / 2, width: cropWidth, height: cropHeight };
}
