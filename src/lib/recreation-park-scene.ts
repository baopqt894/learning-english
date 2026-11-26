import * as THREE from 'three';
import { sceneryKit } from './campus-scenery-kit';
import { PARK_COURTS, SIGNAL_COURT, signalBoards, parkSeats, orchardTrees } from './recreation-park';

const white=0xfff1d2, steel=0x435e64;
export function createRecreationPark(){
  const park=new THREE.Group();
  for(const c of PARK_COURTS){
    const k=sceneryKit(c.kind);
    const ball=c.kind==='basketball', half=c.d/2, side=c.w/2;
    const line=(x:number,z:number,w:number,d:number)=>k.block(x,.133,z,w,.016,d,white);
    k.block(0,.05,0,c.w+3,.09,c.d+3,ball?0x62938c:0xc4ad80);
    k.block(0,.105,0,c.w,.035,c.d,ball?0xaf654a:0xe5cd96);
    for(const s of [-1,1]){
      line(s*side,0,.10,c.d);line(0,s*half,c.w,.10);
      if(ball){
        k.block(0,.125,s*(half-2.8),4.9,.012,5.6,0xc58b59);
        line(0,s*(half-5.6),4.9,.1);
        for(const a of [-1,1])line(a*2.45,s*(half-2.8),.1,5.6);
        k.block(0,1.7,s*(half+1.2),.25,3.4,.3,steel);
        k.block(0,3.24,s*half,.16,.15,2.4,steel);
        k.block(0,3.4,s*(half-1.15),1.84,1.05,.09,0xc1dad1);
        k.block(0,3.30,s*(half-1.21),.7,.42,.06,white);
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
      kit.drum(x,1.38,z,.47,2.65,.48,0x887052);
      for(const side of [-1,1]){
        kit.block(x+side*.36,2.10,z,.20,1.24,.22,0x887052,-side*.55);
        kit.globe(x+side*.85,3.05,z,2.65,2.50,2.75,[0x729953,0x678b52,0x78985c][variety]);
      }
      kit.globe(x,3.87,z-.18,2.72,2.27,2.59,0x8eaa68);
      for(let i=0;i<9;i++){
        const angle=i*2.4, radius=1.45+(i%2)*.23;
        kit.globe(x+Math.cos(angle)*radius,2.72+i%3*.37,z+Math.sin(angle)*1.20,.36,.4,.35,[0xeea040,0xcb7152,0xd4bc67][variety]);
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
  // A low ball trolley and a two-sided flip scoreboard beside each team bench.
  for(const [cx,ballColour] of [[107,0xd38247],[160,0xe7c974]]){
    const z=85;
    k.block(cx-.88,1.29,z,.94,.58,.42,0x4c686a);
    for(const side of [-1,1]){
      k.block(cx-.88+side*.19,1.32,z+.22,.29,.35,.025,white);
      k.block(cx-.88+side*.19,1.33,z+.24,.12,.21,.02,0x354a47);
    }
    for(let i=0;i<3;i++)k.globe(cx+.35+i*.31,1.0,z,.31,.31,.31,ballColour);
  }
  for(const p of parkSeats){
    for(const dx of [-1.1,1.1])k.block(p.x+dx,.38,p.z,.21,.72,.63,steel);
    for(const dz of [-.23,0,.23])k.block(p.x,.78,p.z+dz,3,.12,.18,0xb38351);
    k.block(p.x,1.12,p.z-.32,3,.44,.10,0xb38351);
  }
  park.add(k.finish());return park;
}
