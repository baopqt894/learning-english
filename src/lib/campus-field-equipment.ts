import * as THREE from 'three';
import {sceneryKit} from './campus-scenery-kit';
import {outdoorFacilities} from './campus-detail-layout';
import {bucket,flowerClump,fruitCrate,hayBale} from './campus-garden-props';
import {FISH_POND,SWIMMING_POOL,LIVESTOCK_PENS,TRAINING_GROUND} from './campus-districts-layout';
import {FARM_LAYOUT,COURTYARD_PLANTERS} from './campus-spaces';
import {nurseryPens} from './campus-landscape-layout';

type Kit=ReturnType<typeof sceneryKit>;
const wood=0x946341,cream=0xefe3bc,steel=0x496665,green=0x487568,orange=0xc67849;

function shelter(k:Kit,x:number,z:number,w:number,d:number,colour:number){
  for(const sx of [-1,1])for(const sz of [-1,1])k.block(x+sx*(w/2-.18),1.45,z+sz*(d/2-.13),.105,2.9,.105,steel);
  for(let i=0;i<10;i++)k.block(x+(i-4.5)*w/10,2.93,z,w/10+.012,.11,d,i%2?colour:cream,0,0,-.06);
  k.block(x,2.75,z+d/2-.03,w,.25,.07,colour);
}
function drinks(k:Kit,x:number,z:number,base:number){
  k.drum(x,base+.39,z,.62,.77,.62,orange);k.drum(x,base+.81,z,.66,.09,.66,cream);
  k.block(x,base+.25,z+.34,.10,.08,.12,steel);k.hoop(x,base+.91,z,.34,.24,.23,steel);
}
function sparrow(k:Kit,x:number,y:number,z:number,yaw:number){
  const sn=Math.sin(yaw),cs=Math.cos(yaw);
  k.globe(x,y+.17,z,.20,.19,.33,0x927454,0,yaw);
  k.globe(x+.105*sn,y+.30,z+.105*cs,.15,.16,.16,0x755d45);
  k.leaf(x+.215*sn,y+.29,z+.215*cs,.054,.049,.13,0xd9aa6d,0,yaw);
  for(const side of [-1,1]){
    k.leaf(x+side*.073*cs,y+.20,z-side*.073*sn,.066,.13,.23,0x655b4b,0,yaw);
    k.drum(x+side*.045*cs,y+.051,z-side*.045*sn,.017,.093,.017,0x775d42);
  }
  k.leaf(x-.18*sn,y+.17,z-.18*cs,.12,.05,.24,0x685f50,0,yaw);
}
function scoreDigit(k:Kit,x:number,y:number,z:number,digit:number){
  const segments=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'][digit];
  for(const [i,id] of [...'abcdefg'].entries()){
    const horizontal=i===0||i===3||i===6;
    const dx=horizontal?0:i<3?.20:-.20,dy=[.39,.20,-.20,-.39,-.20,.20,0][i];
    k.block(x+dx,y+dy,z,horizontal?.36:.055,horizontal?.055:.32,.028,segments.includes(id)?0xfaad58:0x3d4a43);
  }
}
export function campusFieldEquipment(){
  const root=new THREE.Group(),cells=new Map<string,Kit>();
  const cell=(x:number,z:number)=>{
    const key=Math.floor(x/26)+','+Math.floor(z/26);
    let k=cells.get(key);if(!k){k=sceneryKit('campus-equipment-'+key);cells.set(key,k);}return k;
  };
  for(const f of outdoorFacilities){
    const {x,z,w,d}=f,k=cell(x,z);
    switch(f.kind){
      case 'team-bench':
        shelter(k,x,z,w,d,x<0?0x4c8073:0x99594c);
        for(let i=0;i<5;i++){const px=x+(i-2)*.89;
          k.block(px,.44,z,.13,.80,.38,steel);k.block(px,.85,z,.78,.13,.68,0x739593);
          k.block(px,1.12,z-.26,.76,.58,.09,0x567b76,0,0,-.10);}
        break;
      case 'pool-rack':
        for(const side of [-1,1])k.block(x+side*1.37,.67,z,.12,1.28,1.14,steel);
        for(const h of [.29,.98])k.block(x,h,z,2.86,.08,.94,0xaaa88b);
        for(let i=0;i<7;i++){const px=x-1.11+i*.355;
          k.globe(px,.95,z,.17,1.27,.68,i%2?0x57abac:0xe4ad59);
          k.block(px,1.46,z,.19,.15,.28,inkColour);}
        break;
      case 'track-clock':
        for(const s of [-1,1])k.block(x+s*1.17,1.05,z,.13,2.1,.18,steel);
        k.block(x,2.24,z,3.10,1.27,.29,0x384d4d);k.block(x,2.24,z+.16,2.92,1.06,.039,0x1b302f);
        for(let i=0;i<4;i++)scoreDigit(k,x+(i-1.5)*.58+(i>1?.08:-.08),2.22,z+.2,0);
        for(const h of [-.14,.14])k.globe(x,2.22+h,z+.20,.07,.07,.04,0xf7a856);
        break;
      case 'relay-rack':
        k.block(x,.92,z,3.35,.13,.99,wood);for(const s of [-1,1])k.block(x+s*1.46,.47,z,.15,.86,.79,steel);
        for(let i=0;i<6;i++)k.drum(x-1.2+i*.42,1.15,z,.15,.75,.15,[orange,green,0x7b94ac][i%3],0,0,1.21);
        break;
      case 'farm-silo':
        for(const dx of [-.86,.86])for(const dz of [-.68,.68])k.block(x+dx,.89,z+dz,.19,1.72,.19,steel);
        k.pot(x,1.68,z,2.64,1.45,2.64,0x919a86);k.drum(x,3.40,z,2.63,2.05,2.63,0xb9bd9d);
        for(let i=0;i<6;i++)k.drum(x,2.45+i*.34,z,2.68,.055,2.68,0x788e80);
        k.globe(x,4.48,z,2.81,.80,2.81,green);k.drum(x,4.92,z,.52,.12,.52,steel);
        for(const dx of [-.22,.22])k.block(x+dx,2.65,z+1.33,.06,4.49,.065,steel);
        for(let i=0;i<12;i++)k.block(x,.58+i*.34,z+1.36,.48,.055,.065,steel);
        break;
      case 'produce-table':
        shelter(k,x,z,w,d,0xc68546);
        k.block(x,1.03,z,4.89,.15,1.55,wood);
        for(const sx of [-1,1])for(const sz of [-1,1])k.block(x+sx*2.0,.51,z+sz*.6,.13,.99,.13,wood);
        for(let i=0;i<3;i++)fruitCrate(k,x-1.52+i*1.43,1.12,z,[0xebad50,0xc36048,0x87a054][i]);
        break;
      case 'ball-locker':
        k.block(x,.24,z,2.88,.16,1.10,steel);
        for(const side of [-1,1]){k.block(x,.95,z+side*.51,2.92,.07,.07,steel);
          for(let i=0;i<8;i++)k.block(x-1.37+i*.39,.61,z+side*.5,.033,.78,.03,steel);}
        for(let i=0;i<7;i++){const px=x-1+(i%4)*.56,py=i<4?.51:.88,pz=z+(i%2-.5)*.20;
          k.globe(px,py,pz,.54,.54,.54,orange);k.hoop(px,py,pz,.55,.55,.32,0x583e36,0,i*.52);}
        break;
      case 'volley-shade':
        shelter(k,x,z,w,d,0x548a92);k.block(x,.58,z,4.89,.14,.66,wood);
        for(const side of [-1,1])k.block(x+side*1.9,.29,z,.15,.52,.65,steel);
        drinks(k,x+1.94,z,.66);for(let i=0;i<3;i++)k.block(x-1.61,.71+i*.095,z,.79,.089,.50,i%2?cream:0x719b97);
        break;
      case 'signal-console':
        k.block(x,.70,z,2.69,1.34,.97,steel);k.block(x,1.49,z,2.96,.29,1.09,inkColour);
        for(let i=0;i<3;i++){k.drum(x+(i-1)*.73,1.69,z,.47,.12,.47,[0xc65846,0xeab85c,0x5a92ad][i]);}
        break;
    }
  }
  // Backstroke pennants span the water above the swimmers; both posts stand inside the pool edge.
  const p=SWIMMING_POOL,kp=cell(p.x,p.z);
  for(const side of [-1,1]){
    const x=p.x+side*(p.w/2-3.2);
    for(const end of [-1,1])kp.drum(x,1.54,p.z+end*(p.d/2-.12),.10,3.08,.10,steel);
    for(let i=0;i<19;i++){
      const dz=(i/18-.5)*(p.d-.24),y=2.69+.35*(2*dz/p.d)**2;
      kp.block(x,y,p.z+dz,.032,.035,p.d/18+.02,cream);
      kp.block(x,y-.16,p.z+dz,.04,.26,.26,i%2?orange:0x588e9e,0,0,Math.PI/4);
    }
  }
  const fish=FISH_POND,kf=cell(fish.x,fish.z),ax=fish.x+fish.w*.30,az=fish.z-fish.d*.24;
  for(const dx of [-.9,.9])kf.globe(ax+dx,.29,az,.51,.35,2.34,0x526f81);
  kf.block(ax,.51,az,2.12,.13,1.45,steel);
  for(const dx of [-.57,.57]){kf.hoop(ax+dx,.78,az,1.26,1.26,.7,brassColour,0,Math.PI/2);
    for(let n=0;n<8;n++){const a=n*Math.PI/4;kf.block(ax+dx,.78+Math.cos(a)*.57,az+Math.sin(a)*.57,.67,.12,.34,0x82b2b1,0,0,-a);}}
  for(let i=0;i<20;i++)kf.globe(ax-1.4-i%6*.38,.11,az+Math.sin(i*2.39)*.70,.23,.03,.13,0xb3ccc1);
  // Lily beds belong to the shallow bank. Keep the feeding deck and the fish approach open.
  for(let i=0;i<19;i++){
    const x=fish.x-fish.w*.36+(i%6)*.61,z=fish.z-fish.d*.28+Math.floor(i/6)*.49;
    kf.globe(x,.144,z,.53+i%3*.075,.029,.49, i%3?0x779953:0x97ac72);
    if(i%5===0){
      for(let j=0;j<6;j++){const a=j*Math.PI/3;kf.leaf(x+.066*Math.cos(a),.209,z+.066*Math.sin(a),.12,.09,.16,0xe2acb8,0,-a);}
      kf.globe(x,.228,z,.085,.047,.085,0xdfb363);
    }
  }
  for(const pen of LIVESTOCK_PENS){
    const k=cell(pen.x,pen.z),x=pen.x+pen.w*.28,z=pen.z+pen.d*.21;
    if(pen.id==='chickens'){
      for(let i=0;i<3;i++){const px=x+(i-1)*.75;k.block(px,.74,z,.70,.94,.92,wood);
        k.block(px,.79,z+.48,.48,.55,.03,inkColour);k.block(px,.50,z+.59,.72,.10,.36,0xc29c64);
        for(let j=0;j<2;j++)k.globe(px+(j-.5)*.19,.60,z+.57,.15,.19,.14,cream);}
    }else if(pen.id==='goats'){hayBale(k,x,.1,z,1.1);hayBale(k,x+1.3,.1,z,.9);}
    else if(pen.id==='pigs'){k.globe(x,.13,z,3.14,.09,1.74,0x80664b);k.globe(x+.28,.18,z-.1,1.21,.026,.68,0x9c8863);}
    else {for(let i=0;i<9;i++)k.leaf(x+(i%3)*.27,.55,z+Math.floor(i/3)*.29,.12,.89,.12,i%2?0x9da15f:0x63854f,i*.11-.32);}
  }
  for(const pen of nurseryPens){
    const k=cell(pen.x,pen.z),x=pen.x-pen.w*.30,z=pen.z+pen.d*.23;
    if(pen.kind==='rabbits'){for(const s of [-1,1]){k.pot(x+s*.68,.61,z,.87,1.04,.87,wood);k.globe(x+s*.68,.66,z+.39,.46,.56,.12,inkColour);k.block(x+s*.68,1.16,z,1.10,.12,1.04,green);}}
    else {hayBale(k,x,.10,z,1.15);bucket(k,x+1.6,.11,z);}
  }
  for(const [i,bed] of FARM_LAYOUT.reserve.entries()){
    if(i<2)continue;
    const k=cell(bed.x,bed.z);
    for(const dx of [-1.35,1.35]){for(const dz of [-1.9,1.9])k.drum(bed.x+dx,1.05,bed.z+dz,.09,2.10,.09,wood);
      for(const y of [1.1,1.9])k.block(bed.x+dx,y,bed.z,.05,.04,3.9,wood);}
    for(let j=0;j<6;j++){const side=j%2?1:-1;const x=bed.x+side*1.35,z=bed.z+(Math.floor(j/2)-1)*1.44;
      flowerClump(k,x,1.56,z,.55,0xe1ab57,j);k.leaf(x,.96,z,.52,1.05,.44,0x688741);}
  }
  // The lending window and the school snack counter each have a different street frontage.
  const kiosk=cell(-9,-3);
  for(let i=0;i<10;i++)kiosk.block(-9+(i-4.5)*.55,2.75,-2.57,.555,.11,1.12,i%2?0x67877c:cream,0,0,-.12);
  for(let i=0;i<7;i++){const h=.44+(i%3)*.07,x=-10.6+i*.43;
    kiosk.block(x,.95,-2.62,.34,h,.13,[0xad755f,0x6e8d90,0xc3a258][i%3],(i%3-1)*.10);
    kiosk.block(x,1.03,-2.545,.19,.055,.018,cream);
  }
  sparrow(kiosk,-10.85,2.81,-2.47,.78);sparrow(kiosk,-10.35,2.81,-2.54,-.6);
  const cafe=cell(9.5,-4.2);
  for(let i=0;i<11;i++)cafe.block(9.5+(i-5)*.43,2.83,-1.34,.435,.11,1.1,i%2?0xb86f4c:cream,0,0,-.12);
  for(const side of [-1,1]){
    const x=9.5+side*1.1;
    cafe.drum(x,1.32,-.99,.34,.48,.34,side<0?0xb9864b:0x86a88d);cafe.drum(x,1.58,-.99,.38,.07,.38,cream);
  }
  // Planters at the front of the dorm blocks sit inside the existing building outlines.
  for(const z of [-13,0]){
    const k=cell(-28,z),front=z+(z===0?5:4.5);
    for(const side of [-1,1]){
      const x=-28+side*5.12;k.block(x,1.44,front+.10,2.32,.24,.33,wood);
      for(let i=0;i<5;i++)flowerClump(k,x+(i-2)*.42,1.56,front+.09,.43,side<0?0xcb8a70:0xdcbb6d,i);
    }
  }
  for(const [i,p] of COURTYARD_PLANTERS.entries()){
    const k=cell(p.x,p.z);
    for(let n=0;n<4;n++)flowerClump(k,p.x+(n%2-.5)*.51,.62,p.z+(n-1.5)*.49,.67,i%2?0xb46e8b:0xe3b178,n);
  }
  const t=TRAINING_GROUND,kt=cell(t.x,t.z);
  for(let i=0;i<9;i++)for(const s of [-1,1])kt.globe(t.x+(i-4)*.66,.094,t.z+t.d*.34+s*.23,.32,.021,.15,cream,s*.22);
  for(const k of cells.values())root.add(k.finish());return root;
}
const inkColour=0x2c4647,brassColour=0xb99754;
