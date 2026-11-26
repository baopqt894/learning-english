import { MAP_BOUNDS, type MapPoint, type ZoneId } from './campus-map.ts';
import type { Place } from './game.ts';

export const placeSymbols = {
  kitchen: 'pot', 'light-lab': 'prism', 'plant-lab': 'flask',
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
  let crowded = false;
  const pins = entries.map(entry => {
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
    if (!free) crowded = true;
    placed.push({ x, y });
    return { entry, x, y, anchorX, anchorY };
  });
  if (!crowded) return pins;
  // A dense phone atlas can strand the last marker between earlier ones. Repack
  // onto touch-sized slots, assigning each marker the closest remaining slot.
  const columns = Math.floor(width / diameter), rows = Math.floor(height / diameter);
  if (columns * rows < pins.length) return pins;
  const slots = Array.from({ length:columns*rows }, (_,i)=>({
    x:(i%columns+.5)*width/columns, y:(Math.floor(i/columns)+.5)*height/rows,
  }));
  for (const pin of pins) {
    let nearest = 0, best = Infinity;
    slots.forEach((slot,i)=>{
      const d = (slot.x-pin.anchorX)**2 + (slot.y-pin.anchorY)**2;
      if (d < best) { nearest = i; best = d; }
    });
    Object.assign(pin,slots.splice(nearest,1)[0]);
  }
  return pins;
}
