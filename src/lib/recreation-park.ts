// World units are metres. The plaza between each pair of courts is the meeting point.
export const PARK_ZONES = [
  {id:'orchard',name:'Vườn cây ăn trái',english:'Fruit orchard',title:'Plan the fruit harvest',icon:'orchard',color:'#719357',x:161,z:-85},
  {id:'basketball',name:'Cụm sân bóng rổ',english:'Basketball courts',title:'Join basketball practice',icon:'hoop',color:'#ba7053',x:104,z:93},
  {id:'volleyball',name:'Cụm sân bóng chuyền',english:'Volleyball courts',title:'Join volleyball practice',icon:'net',color:'#a17b46',x:157,z:93},
  {id:'signal-arcade',name:'Sân bia điện tử',english:'Signal arcade',title:'Read the colour signals',icon:'signal',color:'#547f81',x:204,z:93},
] as const;
export const PARK_COURTS = [
  {kind:'basketball',x:91,z:93,w:15,d:28}, {kind:'basketball',x:117,z:93,w:15,d:28},
  {kind:'volleyball',x:147,z:93,w:9,d:18}, {kind:'volleyball',x:167,z:93,w:9,d:18},
] as const;
export const SIGNAL_COURT={x:204,z:92,w:26,d:21};
export const parkSeats=[{x:107,z:85},{x:107,z:102},{x:160,z:85},{x:160,z:102},{x:199,z:99},{x:209,z:99}];
export const signalBoards=[-7,0,7].map(dx=>({x:SIGNAL_COURT.x+dx,z:85,w:3.5,d:.7}));
export const orchardTrees=[113,125,138,150,172,184,197,209].flatMap((x,col)=>
  [-108,-98,-76,-66].map((z,row)=>({x,z:z+(col%2)*1.4,variety:(col+row)%3})));
export const orchardPaths=[{x:161,z:-71,w:3.6,d:30},{x:161,z:-86,w:116,d:4},{x:105,z:-98,w:3,d:24},{x:217,z:-98,w:3,d:24},{x:161,z:-110,w:112,d:3}];
export const parkPaths=[{x:149,z:72,w:122,d:5},{x:107,z:65,w:4,d:14},{x:173,z:65,w:4,d:14},
  ...orchardPaths,...PARK_ZONES.filter(p=>p.id!=='orchard').map(p=>({x:p.x,z:85,w:5,d:26}))];
export const parkObstacles=[
  ...orchardTrees.map(p=>({...p,w:.72,d:.72})),
  ...parkSeats.map(p=>({...p,w:3,d:.7})),...signalBoards,
  ...PARK_COURTS.flatMap(p=>[-1,1].map(s=>p.kind==='basketball'?
    {x:p.x,z:p.z+s*(p.d/2+1.2),w:.45,d:.5}:
    {x:p.x+s*(p.w/2+.65),z:p.z,w:.16,d:.16})),
  ...PARK_COURTS.filter(p=>p.kind==='volleyball').map(p=>({x:p.x,z:p.z,w:p.w+1.3,d:.1})),
];
export function nearbyPark(p:{x:number;z:number}){
  if(p.z< -60 && p.z> -113 && p.x>=104 && p.x<=218)return PARK_ZONES[0];
  return PARK_ZONES.find(zone=>zone.id!=='orchard'&&Math.abs(p.x-zone.x)<(zone.id==='basketball'?23:zone.id==='volleyball'?19:14)&&Math.abs(p.z-zone.z)<18);
}
