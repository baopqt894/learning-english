import * as THREE from 'three';
import type { sceneryKit } from './campus-scenery-kit';
import { placeSchoolProp } from './school-props';
import { workshopDisplays, type WORKSHOPS } from './workshop-wing';

type Kit=ReturnType<typeof sceneryKit>;
type Room=typeof WORKSHOPS[number];
const wood=0xb98b60,metal=0x50676c,ivory=0xf3e4bd;
const paint=[0xe6ac57,0xc57864,0x649bb0,0x88a879,0xb58eac,0xe7ce84];

export function furnishWorkshopDisplays(k:Kit,props:THREE.Group,b:Room){
  for(const f of workshopDisplays.filter(f=>f.kind===b.kind)){
    const x=f.x-b.x,z=f.z-b.z, left=x<0;
    const accent={kitchen:0x579487,weather:0x597d98,art:0xb8745a,music:0x507d79,'light-lab':0x43677a,'plant-lab':0x64835f}[b.kind];
    k.block(x,.39,z,5.82,.18,1.88,wood);
    k.block(x,2.05,z-.76,5.77,3.28,.13,accent);
    if(b.kind==='music'){
      if(left){
        // Upright piano, fallboard, keybed, music rest and three brass pedals.
        k.block(x,1.38,z,3.92,1.86,.96,0x424b45);k.block(x,2.39,z-.24,4.08,.18,.75,wood);
        k.block(x,1.56,z+.55,3.88,.22,.51,0x3e4741);
        for(let n=0;n<29;n++){
          const px=x-1.77+n*.127;k.block(px,1.72,z+.57,.12,.085,.46,ivory);
          if(![2,6].includes(n%7))k.block(px+.069,1.81,z+.47,.069,.12,.30,0x383b36);
        }
        k.block(x,2.05,z+.16,1.15,.55,.08,ivory);k.block(x,2.05,z+.21,.032,.53,.04,wood);
        for(const dx of [-.22,0,.22])k.block(x+dx,.57,z+.54,.12,.08,.31,0xd8b66b);
      }else{
        for(const s of [-1,0,1]){
          const px=x+s*1.44;
          k.globe(px,1.91,z-.52,.81,.87,.19,wood);
          k.globe(px,2.22,z-.52,.64,.56,.18,0xd4a266);
          k.drum(px,2.15,z-.405,.22,.035,.22,metal,0,0,Math.PI/2);
          k.block(px,2.72,z-.51,.16,.92,.15,wood);
          for(const dx of [-.045,.045])k.block(px+dx,2.49,z-.396,.014,1.15,.015,ivory);
        }
        for(const s of [-1,1]){
          k.drum(x+s*1.1,.91,z+.25,.72,.87,.72,0xad614a);
          k.drum(x+s*1.1,1.37,z+.25,.78,.08,.78,ivory);
        }
      }
    }else if(b.kind==='art'){
      if(left){
        for(let n=0;n<12;n++){
          const a=n*Math.PI/6;k.globe(x+Math.sin(a)*1.13,2.08+Math.cos(a)*1.13,z-.64,.61,.61,.09,paint[n%6]);
        }
      }else{
        for(const [i,col] of paint.slice(0,3).entries()){
          const px=x-1.71+i*1.71;
          k.block(px,2.18,z-.60,1.48,1.71,.12,wood);k.block(px,2.18,z-.50,1.33,1.55,.08,0xf0d7a0);
          k.globe(px-.22,2.52,z-.44,.45,.45,.033,col);
          k.leaf(px+.10,1.96,z-.41,1.30,.73,.05,paint[(i+3)%6],.18);
        }
      }
      for(let i=0;i<6;i++){
        const px=x+(i-2.5)*.72;
        k.pot(px,.77,z+.23,.53,.52,.5,paint[i]);
        for(let j=0;j<3;j++){k.block(px+(j-1)*.11,1.20,z+.23,.045,.57,.045,wood,(j-1)*.15);k.leaf(px+(j-1)*.16,1.52,z+.23,.10,.21,.10,paint[(i+2)%6]);}
      }
    }else if(b.kind==='weather'){
      if(left){
        for(const s of [-1,0,1]){
          const px=x+s*1.58;
          k.globe(px,2.13,z-.62,1.28,1.28,.15,metal);k.globe(px,2.13,z-.50,1.15,1.15,.07,ivory);
          for(let i=0;i<12;i++){const a=i*Math.PI/6;k.block(px+Math.sin(a)*.47,2.13+Math.cos(a)*.47,z-.45,.034,.107,.02,metal,-a);}
          k.block(px+.07*s,2.27,z-.409,.055,.50,.02,0xc66344,-s*.63);
        }
      }else{
        k.drum(x,1.83,z,.14,2.75,.14,metal);k.block(x,3.04,z,2.15,.10,.10,ivory);
        for(const s of [-1,1])k.pot(x+s*1.05,3.04,z,.52,.40,.5,0x668fa7,Math.PI/2);
        for(let n=0;n<6;n++)k.block(x-1.75,1.02+n*.32,z,.80,.11,.69,ivory);
        k.drum(x+1.82,1.40,z,.50,1.48,.50,0x84b4bf);
        for(let n=0;n<6;n++)k.block(x+1.82,.89+n*.18,z+.25,.25,.037,.02,ivory);
      }
    }else if(b.kind==='light-lab'){
      for(let n=0;n<5;n++){
        const px=x+(n-2)*.90,py=1.25+n*.27;
        k.block(px,py,z-.62,.93,.055,.05,0x9dd3bd);
        k.block(px+.42,py+.15,z-.62,.055,.35,.055,0x9dd3bd);
        k.drum(px,py,z-.57,.19,.08,.19,ivory,0,0,Math.PI/2);
      }
      for(const s of [-1,0,1]){
        k.drum(x+s*1.24,.67,z+.14,.82,.35,.76,metal);k.globe(x+s*1.24,1.08,z+.14,.67,.74,.67,paint[(s+1)*2]);
      }
    }else if(b.kind==='kitchen'){
      k.block(x,1.07,z+.06,5.38,1.15,1.15,0x76928b);k.block(x,1.71,z+.05,5.54,.14,1.29,ivory);
      if(left){
        placeSchoolProp(props,'hob',x-.77,1.80,z,1.64);placeSchoolProp(props,'pot',x-.99,2.38,z,.72);
        k.block(x,3.28,z-.17,3.18,.44,.89,metal);
        for(let i=0;i<7;i++)k.block(x+(i-3)*.37,3.26,z+.30,.25,.17,.05,0x394f54);
      }else{
        placeSchoolProp(props,'basket',x-.80,1.80,z,1.15);
        for(let i=0;i<4;i++)placeSchoolProp(props,'tray',x+1.12,1.80+i*.08,z,.96);
        for(let i=0;i<6;i++)k.hoop(x+(i-2.5)*.66,2.65,z-.52,.37,.56,.35,ivory);
      }
    }else{
      if(left){
        placeSchoolProp(props,'barrow',x-.61,.49,z,2.6);
        placeSchoolProp(props,'bucket',x+1.58,.49,z,.62);
      }else{
        placeSchoolProp(props,'planter',x-.38,.49,z,2.6);
        placeSchoolProp(props,'watering-can',x+1.68,.49,z,.95);
      }
      for(let i=0;i<3;i++){
        const px=x+(i-1)*1.54;
        k.block(px,2.44,z-.63,1.17,.92,.06,ivory);
        for(const s of [-1,1])k.leaf(px+s*.18,2.42,z-.58,.26,.54,.055,0x72a062,s*-.62);
      }
    }
  }
}
