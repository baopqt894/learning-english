import {computerLab,languageLab,labEntrance} from './learning-room-layout.ts';
import { parkPaths } from './recreation-park.ts';
import { workshopPaths, WORKSHOPS } from './workshop-wing.ts';
import type { BalanceRun } from './balance-challenge.ts';
import { SPORTS_VENUES } from './sports-layout.ts';
/** Every new district shares footprints between geometry, navigation and the atlas. */
export const CAMPUS_EXTENT={minX:-49,maxX:236,minZ:-125,maxZ:119};
export const BASE_DISTRICT_PATHS=[
  {x:44,z:-19.5,w:58,d:3.6},{x:38,z:-9.5,w:3.6,d:87},
  {x:25,z:35,w:96,d:3.6},{x:0,z:-32,w:3.6,d:14},
  {x:7.5,z:-53,w:61,d:3.6},{x:55.5,z:9,w:35,d:3.6},
  {x:55.5,z:22,w:3,d:23},{x:44,z:-28,w:12,d:3.6},
] as const;
export const BASE_LIVESTOCK_PENS=[
  {id:'chickens',x:48.5,z:18,w:10.8,d:8,label:'CHICKENS',kind:'chicken'},
  {id:'goats',x:62.5,z:18,w:10.8,d:8,label:'GOATS',kind:'goat'},
  {id:'pigs',x:48.5,z:28,w:10.8,d:8,label:'PIGS',kind:'pig'},
  {id:'ducks',x:62.5,z:28,w:10.8,d:8,label:'DUCKS',kind:'duck'},
] as const;
export const PEN_HABITATS={
  chicken:{dx:-1.9,dz:-1.9,w:4.2,d:2.25,h:2.12,roof:0xab6651,ground:0xc7b487},
  goat:{dx:2.5,dz:-1.8,w:3.5,d:2.2,h:2.05,roof:0x927951,ground:0x97a16d},
  pig:{dx:-1.8,dz:-2,w:5.2,d:2.1,h:1.65,roof:0x975d4e,ground:0xbd9b79},
  duck:{dx:-3.15,dz:-2,w:2.3,d:1.65,h:1.4,roof:0x66878b,ground:0x91ad88},
} as const;
export const BASE_FISH_POND={x:56,z:-4,w:22,d:13};
export const BASE_FEED_DECK={x:55.5,z:4.5,w:5,d:3.6};
export const BASE_SWIMMING_POOL={x:56,z:-40,w:18,d:12,deckW:28,deckD:22};
export const BASE_TRAINING_GROUND={x:0,z:-43,w:32,d:18};
export const BASE_BALANCE_BEAM={x:-2,z:-43,w:.28,d:6,top:.55};
export const BASE_DISTRICT_STRUCTURES=[
  {id:'feed-store',x:70.5,z:18,w:3.5,d:6,h:2.8},
  {id:'fish-shed',x:69.5,z:-4,w:3.5,d:6,h:2.8},
  {id:'changing-rooms',x:56,z:-54,w:16,d:3.6,h:2.7},
  {id:'training-shelter',x:-12,z:-34,w:6,d:3.5,h:2.6},
] as const;
export const BASE_TRAINING_EQUIPMENT=[
  {...BASE_BALANCE_BEAM,id:'balance'},
  {id:'tires',x:-10,z:-43,w:4,d:5},
  {id:'rope-frame',x:9,z:-48,w:5,d:1.1},
  {id:'low-wall',x:5,z:-41,w:3,d:.4},
  {id:'pullup',x:11,z:-37.5,w:3.5,d:.25},
] as const;
export const BASE_DISTRICT_BENCHES=[{x:43.5,z:-40,w:.7,d:3},{x:68.5,z:-40,w:.7,d:3},{x:46,z:5.3,w:3,d:.7},{x:-12,z:-35,w:3,d:.7}];
export const BASE_EXPANDED_TREES=[
  ...[[-36,-32],[-27,-35],[-21,-44],[-21,-52],[20,-48],[25,-40],[32,-46],[44,-50],[70,-50],[71,-29],[43,-22],[71,-20],[72,6],[43,38],[53,39],[65,39],[72,33],[26,43],[10,40],[-8,38],[-32,36]],
].map(([x,z],i)=>({x,z,scale:.9+(i%4)*.12,flowering:i%5===0}));
export const BASE_TRAINING_CONES=Array.from({length:8},(_,i)=>({x:-14+(i%4)*2,z:-49+Math.floor(i/4)*2,w:.26,d:.26}));
export const BASE_DISTRICT_OBSTACLES=[
  ...BASE_LIVESTOCK_PENS,BASE_FISH_POND,BASE_SWIMMING_POOL,...BASE_DISTRICT_STRUCTURES,...BASE_TRAINING_EQUIPMENT,...BASE_DISTRICT_BENCHES,

  // Rescue-ring rack and two lane-rope reels are solid, outside the circulation deck.
  {x:61.5,z:-32,w:2.2,d:.6},
  {x:69.8,z:23.1,w:1.4,d:1.8},{x:71.4,z:25.8,w:1.6,d:.7},
  {x:71,z:29,w:1.5,d:.6},{x:70,z:31.7,w:1.5,d:2},
  {x:71,z:-.5,w:1,d:2},{x:70.5,z:1,w:2,d:.6},
  {x:60.8,z:6.5,w:3.2,d:.18},
  ...[51,54,57].map(x=>({x,z:-51.5,w:.8,d:.8})),
  ...[52.5,58.5].map(x=>({x,z:12.6,w:.14,d:.14})),
  ...[-4,4].map(x=>({x,z:-32.5,w:.12,d:.12})),
  ...[49.9,56.1].map(x=>({x,z:-28,w:.13,d:.13})),
  ...BASE_TRAINING_CONES,
];
export const BASE_NEW_DISTRICT_ZONES=[
  {id:'livestock',name:'Khu chăn nuôi',english:'Animal care',x:55.5,z:12,icon:'leaf',color:'#b79763'},
  {id:'training',name:'Sân tập',english:'Training ground',x:0,z:-33,icon:'ball',color:'#b79874'},
  {id:'swimming',name:'Hồ bơi',english:'Swimming pool',x:56,z:-27.5,icon:'sound',color:'#77acb3'},
  {id:'fish-pond',name:'Hồ cá',english:'Fish pond',x:55.5,z:5,icon:'leaf',color:'#7fa894'},
] as const;
export const BASE_DISTRICT_STATIONS=[
  {id:'feed-chickens',x:54.8,z:16.7,look:{x:51.5,z:18},seconds:4,title:'Feed the chickens',instruction:'Hold to scatter grain into the feeding trough.',sentence:'I feed the chickens every morning.',verb:'Scatter grain',done:'The chickens are eating. Well done!'},
  {id:'feed-pigs',x:54.8,z:26.7,look:{x:51.5,z:28},seconds:4,title:'Feed the pigs',instruction:'Earn a food portion with English questions, then hold to fill the pig trough.',sentence:'We feed the pigs every day.',verb:'Fill the trough',done:'The pigs are eating their balanced feed.'},
  {id:'feed-goats',x:56.2,z:19.3,look:{x:59.5,z:18},seconds:4,title:'Feed the goats',instruction:'Earn food with English questions, then hold to place grass in the feeder.',sentence:'The goats are eating fresh grass.',verb:'Place fresh grass',done:'The goats have fresh grass.'},
  {id:'feed-ducks',x:56.2,z:29.3,look:{x:59.5,z:28},seconds:4,title:'Feed the ducks',instruction:'Earn food with English questions, then hold to scatter duck feed.',sentence:'We give the ducks a small portion of food.',verb:'Scatter duck feed',done:'The ducks are eating.'},
  {id:'feed-fish',x:55.5,z:4.5,look:{x:55.5,z:0},seconds:4,title:'Feed the fish',instruction:'Hold to sprinkle a small portion of fish food.',sentence:'The fish are swimming towards the food.',verb:'Sprinkle food',done:'The fish have gathered at the feeding deck.'},
  {id:'balance',x:-2,z:-38.5,look:{x:-2,z:-43},seconds:6,title:'Cross the balance beam',instruction:'Answer three quick English questions to cross. A wrong answer or a timeout makes you fall.',sentence:'Walk slowly. Keep your arms out for balance.',verb:'Keep your balance',done:'You crossed the beam. Great balance!'},
  {id:'rescue-ring',x:56,z:-32,look:{x:56,z:-37},seconds:3,title:'Practise a rescue throw',instruction:'Pass the safety quiz, then stay on the deck and hold to throw the life ring.',sentence:'Throw the life ring. Stay out of the water.',verb:'Throw the life ring',done:'The life ring landed in the practice lane.'},
] as const;
export type DistrictStationId=typeof BASE_DISTRICT_STATIONS[number]['id'];
export type DistrictFrame={id:DistrictStationId;title:string;instruction:string;sentence:string;verb:string;percent:number;busy:boolean;done:boolean;balance?: { run: BalanceRun; remaining: number }};

export const BASE_DISTRICT_AREAS=[{id:'livestock',minX:42,maxX:74,minZ:10,maxZ:34},{id:'training',minX:-17,maxX:17,minZ:-53,maxZ:-31},{id:'swimming',minX:43,maxX:70,minZ:-57,maxZ:-26},{id:'fish-pond',minX:43,maxX:73,minZ:-12,maxZ:8}] as const;


export type DistrictId='livestock'|'training'|'swimming'|'fish-pond';
export const DISTRICT_TRANSFORMS:Record<DistrictId,{x:number;z:number;toX:number;toZ:number;scale:number}>={
 livestock:{x:55.5,z:24,toX:75,toZ:38,scale:1.5},
 training:{x:0,z:-43,toX:0,toZ:-51,scale:1.5},
 swimming:{x:56,z:-40,toX:75,toZ:-51,scale:1.5},
 'fish-pond':{x:56,z:-4,toX:75,toZ:-5,scale:1.5},
};
export function baseDistrictAt(p:{x:number;z:number}):DistrictId|undefined{return BASE_DISTRICT_AREAS.find(a=>p.x>=a.minX&&p.x<=a.maxX&&p.z>=a.minZ&&p.z<=a.maxZ)?.id;}
export function districtPoint<T extends {x:number;z:number}>(id:DistrictId|undefined,p:T):T{if(!id)return {...p};const t=DISTRICT_TRANSFORMS[id];return {...p,x:t.toX+(p.x-t.x)*t.scale,z:t.toZ+(p.z-t.z)*t.scale};}
function footprint<T extends {x:number;z:number;w:number;d:number}>(b:T):T{const id=baseDistrictAt(b),p=districtPoint(id,b),s=id?DISTRICT_TRANSFORMS[id].scale:1;return {...p,w:b.w*s,d:b.d*s};}
export const LIVESTOCK_PENS=BASE_LIVESTOCK_PENS.map(footprint);
export const FISH_POND=footprint(BASE_FISH_POND);
export const FEED_DECK=footprint(BASE_FEED_DECK);
export const SWIMMING_POOL={...footprint(BASE_SWIMMING_POOL),deckW:BASE_SWIMMING_POOL.deckW*1.5,deckD:BASE_SWIMMING_POOL.deckD*1.5};
export const TRAINING_GROUND=footprint(BASE_TRAINING_GROUND);
export const BALANCE_BEAM=footprint(BASE_BALANCE_BEAM);
export const DISTRICT_STRUCTURES=BASE_DISTRICT_STRUCTURES.map(footprint);
export const TRAINING_EQUIPMENT=BASE_TRAINING_EQUIPMENT.map(footprint);
export const DISTRICT_BENCHES=BASE_DISTRICT_BENCHES.map(footprint);
export const TRAINING_CONES=BASE_TRAINING_CONES.map(footprint);
export const EXPANDED_TREES=[
  ...[114,167,179,229].flatMap(x=>[-51,-40,-27,-12,3,20,32,45,59].map(z=>[x,z])),
  ...[68,76,86,96,114,124,136,147,159,168,183,194,213,225].flatMap((x,i)=>[[x,66+(i%3)*.8],[x,113+(i%2)]]),
  ...[79,132,181,227].flatMap(x=>[79,87,97,105].map(z=>[x,z])),
  // Shade the east promenade without blocking room entrances or classroom sight lines.
  [179,-51],[190,-51],[206,-46],[179,-16],[183,-13],[207,-16],[178,17],[184,20],[207,22],
  [179,51],[191,54],[207,52],
  [111,-39],[111,-12],[111,6],[111,28],[111,51],[120,-48],[135,-48],[145,-36],
  [146,19],[160,20],[146,48],[160,48],[120,53],[137,54],[162,-22],[165,54],
  [-42,-30],[-38,-36],[-30,-51],[-27,-68],[28,-65],[29,-44],[40,-71],[55,-68],[98,-70],[102,-34],[53,-24],[103,-22],[104,12],[57,58],[54,54],[95,58],[105,47],[25,62],[10,40],[-8,38],[-40,47]].filter(([x,z],i,all)=>all.findIndex(p=>p[0]===x&&p[1]===z)===i &&
  !WORKSHOPS.some(b=>Math.abs(x-b.x)<b.w/2+2.2&&Math.abs(z-b.z)<b.d/2+2.2) &&
  ![...workshopPaths,...parkPaths].some(p=>Math.abs(x-p.x)<p.w/2+1.2&&Math.abs(z-p.z)<p.d/2+1.2)).map(([x,z],i)=>({x,z,scale:.95+(i%4)*.14,flowering:i%5===0}));
export const DISTRICT_OBSTACLES=[...BASE_DISTRICT_OBSTACLES.map(footprint),...EXPANDED_TREES.map(t=>({x:t.x,z:t.z,w:.65*t.scale,d:.65*t.scale}))];
export const NEW_DISTRICT_ZONES=[...BASE_NEW_DISTRICT_ZONES.map(z=>z.id==='swimming'?{...z,...SPORTS_VENUES.pool.approach}:districtPoint(z.id,z)),{id:'athletics',name:'Đường chạy tiếng Anh',english:'English athletics',...SPORTS_VENUES.track.approach,icon:'run',color:'#bd986b'},{id:'field-games',name:'Sân trò chơi tiếng Anh',english:'English field games',...SPORTS_VENUES.field.approach,icon:'ball',color:'#92b171'}] as const;
export const DISTRICT_STATIONS=BASE_DISTRICT_STATIONS.map(s=>{const id=baseDistrictAt(s);return {...districtPoint(id,s),look:districtPoint(id,s.look)};});
export const BALANCE_START=DISTRICT_STATIONS.find(s=>s.id==='balance')!;
export const BALANCE_END=districtPoint('training',{x:-2,z:-47});
export const DISTRICT_AREAS=BASE_DISTRICT_AREAS.map(a=>{const low=districtPoint(a.id,{x:a.minX,z:a.minZ}),high=districtPoint(a.id,{x:a.maxX,z:a.maxZ});return {...a,minX:low.x,maxX:high.x,minZ:low.z,maxZ:high.z};});
/** One circulation plan, shared by the 3D world, atlas and audit. Roads stop at doorways. */
export const DISTRICT_PATHS=[
 ...workshopPaths,...parkPaths,
 // Western residential street and the two learning streets.
 {x:-15.5,z:21.75,w:3,d:78.5},
 {x:2.425,z:-17.5,w:35.85,d:3},
 // The cross-campus path wraps behind the enlarged digital classroom.
 {x:-3.625,z:-33,w:46.75,d:3}, {x:19.75,z:-37.55,w:1.2,d:9.1},
 {x:31.875,z:-42.1,w:24.25,d:2.8}, {x:74,z:-33,w:60,d:3},
 {x:-19,z:-25.25,w:2.4,d:15.5},
 {x:19.75,z:-25.25,w:1.2,d:15.5},
 {x:0,z:-35.25,w:3,d:4.5},
 {x:-25.5,z:-49.4,w:1.6,d:32.8},{x:-12.75,z:-65.8,w:25.5,d:1.2},
 {x:2.5,z:-67.25,w:58,d:2.9},
 // Eastern service spine joins water safety, aquaculture and animal care.
 {x:44,z:-48.25,w:4,d:55.5}, {x:47,z:-20.5,w:6,d:4},
 {x:50,z:-2.5,w:4,d:36}, {x:47,z:15.5,w:6,d:4}, {x:44,z:38.25,w:4,d:45.5},
 {x:74,z:-76,w:60,d:2.4},
 {x:83,z:-32.7,w:4.2,d:2.9},
 {x:-16,z:-64.2,w:3.4,d:3.8},
 {x:74,z:-20.5,w:60,d:3},
 {x:74,z:15.5,w:60,d:3},
 {x:75,z:37.5,w:3.4,d:44},
 {x:75,z:9.5,w:3,d:9},
 {x:34,z:61,w:140,d:3},
 // Reading garden and production farm use their own unobstructed approach.
 {x:14.2,z:36.25,w:2.4,d:49.5},
 {x:29.1,z:27.5,w:29.8,d:3},
 {x:-26,z:26,w:21,d:2.5},
 {x:0,z:15.5,w:3.4,d:11},
 // Doors and short paths: no decorative road continues through a room.
 {x:-9,z:-19.5,w:2.6,d:1}, {x:11,z:-19.5,w:2.6,d:1},
 ...[computerLab,languageLab].flatMap(room=>{
   const door=labEntrance(room), landing=room===computerLab?1.22:1.8;
   const street=50;
   return [{x:door.x,z:door.z+landing/2,w:4.6,d:landing},
     {x:(door.x+street)/2,z:door.z+landing,w:street-door.x,d:2}];
 }),
 {x:-21.75,z:-7.5,w:12.5,d:1.6}, {x:-28,z:-8.25,w:2.6,d:.5},
 {x:-21.75,z:6.5,w:12.5,d:1.6}, {x:-28,z:5.75,w:2.6,d:1.5},
 {x:-22.25,z:22.4,w:13.5,d:1.6}, {x:-29,z:21.95,w:2.6,d:.9},
 {x:-22.25,z:45.5,w:13.5,d:1.6}, {x:-29,z:44.75,w:2.6,d:1.5},
 // Courtyard approaches and the cross-campus promenade.
 {x:0,z:-7.25,w:3,d:2.5},
 {x:0,z:11.6,w:28,d:3},
 {x:28.8,z:11.6,w:31,d:3.5},
 {x:-14.5,z:1.8,w:1,d:16.6},
] as const;
