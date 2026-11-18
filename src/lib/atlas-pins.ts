import { MAP_BOUNDS, type MapPoint, type ZoneId } from './campus-map.ts';
import type { Place } from './game.ts';

export const placeSymbols = {
  swimming: 'pool', athletics: 'run', sports: 'ball', 'field-games': 'flag',
  training: 'hurdle', livestock: 'hen', 'fish-pond': 'fish', 'vegetable-garden': 'sprout',
  garden: 'leaf', dormitory: 'bed', classrooms: 'board', 'classroom-b': 'pencil',
  computer: 'computer', language: 'headphones', dining: 'food', hall: 'stage',
  courtyard: 'school', library: 'book', canteen: 'cup',
} satisfies Record<ZoneId | Place, string>;

// Separate crowded symbols in screen pixels. Navigation always uses the original world point.
export function layoutAtlasPins<T extends MapPoint>(entries: T[], width: number, height: number, diameter: number) {
  const placed: { x: number; y: number }[] = [];
  const radius = diameter / 2;
  const gap = diameter + 2;
  return entries.map(entry => {
    const anchorX = (entry.x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX) * width;
    const anchorY = (entry.z - MAP_BOUNDS.minZ) / (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ) * height;
    const clamp = (value: number, max: number) => Math.max(radius, Math.min(max - radius, value));
    let x = clamp(anchorX, width), y = clamp(anchorY, height);
    let free = false;
    for (let ring = 0; ring <= 12 && !free; ring++) {
      const count = Math.max(1, ring * 8);
      for (let ray = 0; ray < count; ray++) {
        const angle = Math.PI * 2 * ray / count;
        const cx = clamp(anchorX + Math.cos(angle) * ring * gap / 2, width);
        const cy = clamp(anchorY + Math.sin(angle) * ring * gap / 2, height);
        if (placed.every(p => (cx-p.x)**2 + (cy-p.y)**2 >= gap**2)) {
          x = cx; y = cy; free = true;
          break;
        }
      }
    }
    placed.push({ x, y });
    return { entry, x, y, anchorX, anchorY };
  });
}
