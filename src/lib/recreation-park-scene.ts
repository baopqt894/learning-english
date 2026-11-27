import * as THREE from 'three';
import { sceneryKit } from './campus-scenery-kit';
import { courtSideLines } from './court-side-lines';
import { placeSchoolProp } from './school-props';
import { courtEquipment, PARK_COURTS, SIGNAL_COURT, signalBoards, parkSeats, orchardTrees } from './recreation-park';

const white=0xfff1d2, steel=0x435e64;
export function createRecreationPark(){
  const park=new THREE.Group();
  for(const c of PARK_COURTS){
    const k=sceneryKit(c.kind);
    const ball=c.kind==='basketball', half=c.d/2, side=c.w/2;
    const line=(x:number,z:number,w:number,d:number)=>k.block(x,.133,z,w,.016,d,white);
    k.block(0,.05,0,c.w+3,.09,c.d+3,ball?0xcc875e:0x479f8b);
    k.block(0,.105,0,c.w,.035,c.d,ball?0x497eb3:0xdc8b70);
    for(const s of [-1,1]){
      line(s*side,0,.10,c.d);line(0,s*half,c.w,.10);
      if(ball){
        k.block(0,.125,s*(half-2.8),4.9,.012,5.6,0xdb906a);
        line(0,s*(half-5.6),4.9,.1);
        for(const a of [-1,1])line(a*2.45,s*(half-2.8),.1,5.6);
        k.block(0,1.7,s*(half+1.2),.25,3.4,.3,steel);
        k.block(0,3.24,s*half,.16,.15,2.4,steel);
        k.block(0,3.4,s*(half-1.15),1.84,1.05,.09,0xc1dad1);
        for(const edge of [-1,1]){
          k.block(edge*.34,3.33,s*(half-1.22),.05,.45,.06,white);
          k.block(0,3.33+edge*.2,s*(half-1.22),.71,.05,.06,white);
        }
        k.block(0,1.12,s*(half+1.2),.49,2.20,.50,0x35678b);
        for(let i=0;i<16;i++){
          const a=i*Math.PI/8, x=Math.cos(a), z=Math.sin(a);
          k.globe(x*.28,3.05,s*(half-1.5)+z*.28,.145,.07,.145,0xdf652e);
          if(i%2===0)k.drum(x*.24,2.86,s*(half-1.5)+z*.24,.028,.35,.028,white);
        }
      }else{
        line(0,s*3,c.w,.10);
        k.drum(s*(side+.65),1.28,0,.15,2.55,.15,0x416e83);
        k.drum(s*(side+.65),.56,0,.34,1.12,.34,0x608ca1);
      }
    }
    line(0,0,c.w,.1);
    if(ball){
      k.drum(0,.139,0,3.59,.008,3.59,0xdf9067);
      function arc(centerZ:number,radius:number,start:number,end:number){
        const count=Math.ceil((end-start)*radius/.48);
        for(let i=0;i<count;i++){
          const step=(end-start)/count;
          const angle=start+step*(i+.5);
          k.block(radius*Math.cos(angle),.147,centerZ+radius*Math.sin(angle),.095,.012,2*radius*Math.sin(step/2)+.018,white,0,-angle);
        }
      }
      for(const z of [-half+5.6,0,half-5.6])arc(z,1.8,0,Math.PI*2);
      for(const s of [-1,1]){
        arc(s*(half-1.5),6.55,s<0?0:Math.PI,s<0?Math.PI:2*Math.PI);
        for(const dx of [-6.55,6.55])line(dx,s*(half-.75),.095,1.5);
      }
    }else{
      for(let i=0;i<=36;i++)k.block(-side-.45+i*(c.w+.9)/36,1.94,0,.025,.94,.034,steel);
      for(let i=0;i<6;i++)k.block(0,1.48+i*.18,0,c.w+.9,.025,.034,steel);
      k.block(0,2.42,0,c.w+1.2,.085,.055,white);
    }
    const group=k.finish();group.position.set(c.x,0,c.z);park.add(group);
  }
  for(const variety of [0,1,2]){
    const kit=sceneryKit('Fruit grove');
    for(const tree of orchardTrees.filter(t=>t.variety===variety)){
      const {x,z}=tree;
      kit.drum(x,.065,z,3,.10,2.8,0xa18d64);
      // Stone mulch rings sit below the branching fruit trees in campus-environment.
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6;
        kit.globe(x+1.43*Math.cos(a),.14,z+1.29*Math.sin(a),.46,.24,.37,i%3?0xb4ab88:0x9a997c);
        if(i%2===0)kit.leaf(x+1.19*Math.cos(a),.30,z+1.04*Math.sin(a),.30,.44,.24,0x829856,.30,a);
      }
    }
    park.add(kit.finish());
  }
  const k=sceneryKit('Signal pavilion and spectator benches');
  const {x,z,w,d}=SIGNAL_COURT;
  k.block(x,.06,z,w,.1,d,0x7a9990);
  for(const [i,b] of signalBoards.entries()){
    for(const s of [-1,1])k.block(b.x+s*1.2,1.3,b.z,.15,2.6,.18,steel);
    k.block(b.x,2.2,b.z,3.5,2.1,.27,0x273e42);
    const col=[0xe89e48,0x6dc7c1,0xe68d78][i];
    if(i===0)k.globe(b.x,2.25,b.z+.17,.98,.98,.1,col);
    else k.block(b.x,2.25,b.z+.17,.84,.84,.1,col,i===2?Math.PI/4:0);
    k.block(b.x,.13,b.z+4.7,3.4,.035,.14,white);
  }
  for(const f of courtEquipment)courtSideLines(k,f);
  // Spectators sit outside the central meeting promenades.
  for(const p of parkSeats)placeSchoolProp(park,'bench',p.x,.08,p.z,2.75);
  park.add(k.finish());return park;
}
