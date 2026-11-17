type Hair = 'swept' | 'spikes' | 'pony' | 'bun' | 'crop' | 'bob';
type Hat = 'cadet' | 'cook' | 'sun' | 'visor';
type Prop = 'map' | 'books' | 'tray' | 'board' | 'can' | 'bag' | 'whistle' | 'headphones' | 'bucket';
export type CharacterProfile = {
  name: string;
  cloth: number;
  pants: number;
  skin?: number;
  hair?: Hair;
  hat?: Hat;
  prop?: Prop;
  uniform?: boolean;
  carry?: 'satchel' | 'backpack';
  glasses?: boolean;
  moustache?: boolean;
  skirt?: boolean;
  broad?: boolean;
  brightSmile?: boolean;
};

export const CHARACTER_PROFILES = {
  cadet: { name: 'An', cloth: 0x687545, pants: 0x505d39, uniform: true, hat: 'cadet' },
  linh: { name: 'Linh', cloth: 0x69794a, pants: 0x4e5c37, uniform: true, hat: 'cadet', hair: 'pony', carry: 'satchel', brightSmile: true },
  minh: { name: 'Minh', cloth: 0x647341, pants: 0x4e5c36, uniform: true, hair: 'spikes', prop: 'map', brightSmile: true },
  library: { name: 'Cô Lan', cloth: 0xf0dfbc, pants: 0x345941, hair: 'bun', glasses: true, skirt: true, prop: 'books' },
  canteen: { name: 'Chú Hùng', cloth: 0xf2dfbe, pants: 0x625238, hat: 'cook', moustache: true, broad: true, prop: 'tray', brightSmile: true },
  mai: { name: 'Mai', cloth: 0x6c7b4e, pants: 0x535e3d, uniform: true, hair: 'bob', carry: 'satchel', prop: 'board' },
  nam: { name: 'Nam', cloth: 0x738456, pants: 0x515b3a, uniform: true, hair: 'crop', skin: 0xd99b72, carry: 'backpack' },
  thu: { name: 'Thu', cloth: 0xffe5bc, pants: 0x59513a, hair: 'bob', glasses: true, prop: 'books' },
  khoa: { name: 'Khoa', cloth: 0x617352, pants: 0x4b553b, uniform: true, hair: 'swept', prop: 'board' },
  phuc: { name: 'Chú Phúc', cloth: 0x6d794e, pants: 0x514c33, skin: 0xb98262, hat: 'sun', prop: 'can' },
  yen: { name: 'Yến', cloth: 0xc2a873, pants: 0x53664a, hair: 'pony', prop: 'bucket' },
  hai: { name: 'Thầy Hải', cloth: 0x6e7752, pants: 0x444e32, skin: 0xdca379, hat: 'cadet', uniform: true, broad: true, prop: 'whistle' },
  vy: { name: 'Vy', cloth: 0x557e7a, pants: 0x394b45, hair: 'pony', hat: 'visor', prop: 'board' },
  bao: { name: 'Bảo', cloth: 0xa45840, pants: 0x4b5541, hair: 'spikes', prop: 'whistle' },
  tram: { name: 'Trâm', cloth: 0x906c81, pants: 0x4c4f42, hair: 'bob', glasses: true, prop: 'headphones' },
  thao: { name: 'Cô Thảo', cloth: 0xd5ae74, pants: 0x4c5d48, hair: 'bun', prop: 'tray' },
  quang: { name: 'Quang', cloth: 0x618267, pants: 0x4d5038, hair: 'crop', prop: 'bag', skin: 0xcf9568 },
} as const satisfies Record<string, CharacterProfile>;

export type CharacterKind = keyof typeof CHARACTER_PROFILES;
