import * as THREE from 'three';
import {sceneryKit} from './campus-scenery-kit';
import {bananaClump,bucket,feedSack,flowerClump,fruitCrate,hayBale,meadow,pergola,toolBoard} from './campus-garden-props';
import {harvestStand,nurseryPens,shadeGardens,toolStations,workshopBorders} from './campus-landscape-layout';
import {COURTYARD_PLANTERS, FARM_LAYOUT, READING_PLANTERS} from './campus-spaces';
import {FISH_POND,LIVESTOCK_PENS} from './campus-districts-layout';

export function createCampusLandscape(){
  const root=new THREE.Group();
  const add=(k:ReturnType<typeof sceneryKit>,x:number,z:number)=>{
    const group=k.finish();group.position.set(x,0,z);root.add(group);
  };
  for(const p of shadeGardens){
    const k=sceneryKit('Flowering shade garden');
    pergola(k,p.flowers);add(k,p.x,p.z);
  }
  for(const p of toolStations){
    const k=sceneryKit('Groundskeeper station');
    toolBoard(k,0,.08,-.5);
    k.block(0,2.66,-.22,3.54,.14,1.46,0x727f64,0,0,.10);
    fruitCrate(k,-.78,.10,.30,0xd3b564);
    bucket(k,1.10,.09,.29);add(k,p.x,p.z);
  }
  const stand=sceneryKit('Harvest stall');
  for(const sx of [-1,1])for(const sz of [-1,1])stand.block(sx*2.43,1.75,sz*1.32,.19,3.35,.19,0x845d40);
  for(let i=0;i<12;i++)stand.block(-2.55+i*.46,3.55,0,.47,.11,3.36,i%2?0xe2c78a:0x779471,0,0,.11);
  stand.block(0,1.17,.4,4.98,.20,1.4,0xab794e);
  for(const sx of [-1,1])stand.block(sx*1.96,.64,.4,.22,1.15,1.06,0x936c48);
  for(let i=0;i<4;i++)fruitCrate(stand,-1.74+i*1.17,1.27,.42,[0xc98b42,0xc5714e,0x9ba84e,0xe0ae54][i]);
  feedSack(stand,-1.32,.08,.45);bucket(stand,1.4,.08,.35);add(stand,harvestStand.x,harvestStand.z);

  for(const pen of LIVESTOCK_PENS){
    const k=sceneryKit(pen.kind+' habitat details'),hw=pen.w/2,hd=pen.d/2;
    if(pen.kind!=='duck')meadow(k,0,.1,pen.w-1,pen.d-1,hw+hd,pen.kind!=='goat');
    const blossom={chicken:0xdf7790,duck:0xe2b55c,pig:0xc68db0,goat:0xdab26f}[pen.kind];
    for(const side of [-1,1]){
      // Stone edging and flowers sit inside the fence; the feed lane stays open.
      for(let i=0;i<10;i++){
        const px=side*(2.14+i*.51),pz=hd-.51+.13*Math.sin(i);
        k.globe(px,.16,pz-.39,.53,.32,.42,i%3?0xafaa87:0xbcaa87);
        flowerClump(k,px,.12,pz,.60+(i%3)*.10,blossom,i+side);
      }
    }
    if(pen.kind==='duck'||pen.kind==='goat')bananaClump(k,hw-1.15,hd-1.57,pen.kind==='duck'?3.1:2.57,pen.kind==='duck'?.6:1.40);
    else bananaClump(k,-hw+1.25,pen.kind==='pig'?1.66:-hd+1.49,pen.kind==='pig'?2.9:3.35,.35);
    // Creepers follow short sections around corners, keeping gates and signs visible.
    for(let i=0;i<8;i++){
      const px=-hw+.24,pz=-hd+.44+i*.54;
      k.leaf(px,.75+Math.sin(i)*.2,pz,.35,.59,.74,i%3?0x638147:0x899952,0,i);
      if(i%3===0)flowerClump(k,px,1.05,pz,.49,blossom,i);
    }
    // Cross-braced service gates read as entrances from the paved central lane.
    const side=pen.kind==='duck'||pen.kind==='goat'?-1:1;
    for(const sign of [-1,1]){
      k.block(side*(hw-.06),.78,sign*.91,.18,1.45,.18,0x98764e);
      k.block(side*(hw-.07),.80,0,.10,1.83,.12,0xba9260,0,0,sign*.94);
    }
    if(pen.kind==='duck'){
      for(let i=0;i<15;i++){
        const a=i*.39,px=2.40+Math.cos(a)*3.45,pz=-.84+Math.sin(a)*2.47;
        k.globe(px,.27,pz,.48,.36,.46,0x9c9e83);
        if(i%3===0)for(let n=0;n<4;n++)k.leaf(px+Math.sin(n)*.12,.66,pz+Math.cos(n)*.12,.14,.92,.20,0x669154,n*.12,n);
      }
      for(let i=0;i<5;i++)k.drum(3.4+Math.sin(i*2.4)*.8,.29,-1.4+Math.cos(i*2.4)*.68,.48,.035,.41,0x78944e);
      for(let i=0;i<8;i++){
        const a=i*.26+2.6,px=2.4+Math.cos(a)*3.48,pz=-.84+Math.sin(a)*2.48;
        for(const s of [-1,1])k.leaf(px+s*.11,.65,pz,.20,1.12,.18,0x668b47,s*.35,i);
        if(i%2===0){k.drum(px,.87,pz,.045,1.25,.045,0x74874d);k.globe(px,1.49,pz,.10,.28,.10,0x927044);}
      }
      for(let i=0;i<3;i++)flowerClump(k,4.1+i*.36,.27,-2.16+i*.16,.43,0xe6a0ae,i);
    }else if(pen.kind==='chicken'){
      for(let i=0;i<4;i++)hayBale(k,-6.2+(i%2)*1.18,.12+Math.floor(i/3)*.6,3.7-Math.floor(i/2)*.89,.82);
      k.pot(4.9,.38,-.85,.82,.48,.82,0xb96b4c);k.drum(4.9,.72,-.85,.6,.53,.6,0xd8cba6);
      for(let i=0;i<32;i++)k.leaf(-3+Math.sin(i*9)*3.3,.13,1+Math.cos(i*4.8)*1.9,.18,.023,.06,0xd4b376,0,i);
    }else if(pen.kind==='goat'){
      for(const s of [-1,1])k.block(4.0+s*1.4,1.06,1.4,.15,1.9,.16,0x805d3e);
      for(let i=0;i<11;i++)k.block(2.56+i*.28,1.10,1.68,.06,.91,.08,0xb28c56);
      for(let i=0;i<3;i++)hayBale(k,3.0+i*1.02,.72,1.36,.72);
      for(let i=0;i<26;i++)k.leaf(1.15+i*.20,2.38,-1.71,.19,.16,1.13,i%3?0xb29c65:0xd2b978,0,0,.18);
    }else{
      k.block(-6.52,1.15,1.1,.26,2.10,.25,0x886648);
      k.drum(-6.52,1.40,1.1,.51,.80,.52,0xcb9b5b);
      hayBale(k,-5.8,.12,3.3,.91);feedSack(k,-4.4,.12,3.45);
    }
    add(k,pen.x,pen.z);
  }
  for(const p of nurseryPens){
    const k=sceneryKit(p.kind+' meadow');
    k.block(0,.05,0,p.w,.10,p.d,p.kind==='sheep'?0x92a86c:0xb3a079);
    for(const side of [-1,1]){
      for(const h of [.54,1.05]){
        k.block(0,h,side*p.d/2,p.w,.105,.095,0xb4936b);
        k.block(side*p.w/2,h,0,.095,.105,p.d,0xb4936b);
      }
      for(let i=0;i<=6;i++)k.block(-p.w/2+i*p.w/6,.69,side*p.d/2,.15,1.36,.15,0x896b4f);
      k.block(side*p.w/2,.69,0,.15,1.36,.15,0x896b4f);
    }
    meadow(k,0,0,p.w-.65,p.d-.65,7,p.kind==='rabbits');
    if(p.kind==='rabbits'){
      // Hollow willow tunnels and a bundle of fresh cut grass by the hutch.
      for(let i=0;i<9;i++)k.hoop(1.84,.35,-1.64+i*.13,1.07,1.05,.80,i%2?0x947655:0xaf8e63);
      for(const side of [-1,1])k.block(1.84+side*.38,.25,-1.1,.075,.07,1.35,0x92744e);
      for(let i=0;i<8;i++)k.leaf(-4.3+i*.11,.25,1.22+.12*Math.cos(i),.11,.14,.62,i%2?0x7c904d:0xa3a362,0,.26*i);

      for(const s of [-1,1]){
        k.block(-3+s*.98,.43,-1.7,.14,.82,.15,0x805b3d);
        k.block(-3+s*.64,1.05,-1.70,1.28,1.07,1.47,0xac7e52);
        k.globe(-3+s*.64,1.02,-.95,.68,.81,.06,0x584e3a);
        k.block(-3,1.71,-1.72+s*.43,3.0,.12,.98,0x997353,0,0,s*.30);
      }
      k.block(-2.37,.51,-.20,.62,.09,1.65,0xba9766,0,0,.39);
      for(let i=0;i<5;i++)k.block(-2.37,.75-i*.094,-.79+i*.24,.66,.06,.08,0x9b7a52);
      fruitCrate(k,3.83,.12,-1.62,0xca8852);
    }else{
      k.pot(-3.3,.31,-2.55,2.54,.55,.85,0x8a958a);k.drum(-3.3,.593,-2.55,2.28,.022,.70,0x6c9c9b);
      k.block(-5.08,1.01,-2.05,.23,1.89,.23,0x8d7353);
      for(let i=0;i<5;i++)k.drum(-5.08,1.02+i*.11,-2.05,.46,.08,.46,i%2?0xa78958:0xc0a06b);
      for(const sx of [-1,1])for(const sz of [-1,1])k.block(3+sx*1.6,1.23,-1.42+sz*.92,.18,2.42,.18,0x99764f);
      for(let i=0;i<14;i++)k.block(1.17+i*.285,2.51,-1.42,.32,.17,2.52,i%3?0xc5a063:0xdbc18a,0,0,.17);
      for(const s of [-1,1])hayBale(k,3+s*.67,.1,-1.67);
    }
    for(let i=0;i<10;i++)flowerClump(k,-5+i*1.05,.1,2.93,.64,i%3?0xf0d393:0xab8fb5,i);
    add(k,p.x,p.z);
  }
  // Floating lotus colonies frame the fish pond while leaving the feeding deck clear.
  const lotus=sceneryKit('Lotus and rushes');
  for(const side of [-1,1])for(let i=0;i<21;i++){
    const a=i*2.4,r=Math.sqrt(i+1)*.66,px=side*(FISH_POND.w/2-3.8)+r*Math.cos(a),pz=-FISH_POND.d*.23+r*Math.sin(a);
    lotus.drum(px,.249,pz,.55+i%4*.12,.03,.51+i%3*.13,i%2?0x739065:0x8da26c);
    if(i%4===0)flowerClump(lotus,px,.26,pz,.50,0xd898a7,i);
  }
  add(lotus,FISH_POND.x,FISH_POND.z);
  const garden=sceneryKit('Harvest border');
  for(let i=0;i<30;i++)flowerClump(garden,-7.65+i*.52,.20,.08*Math.cos(i),.78+(i%3)*.1,i%3?0xe8bc62:0xbc7f9a,i);
  add(garden,FARM_LAYOUT.frontBorder.x,FARM_LAYOUT.frontBorder.z);
  for(const planter of READING_PLANTERS){
    const k=sceneryKit('Reading garden herbs');
    for(let i=0;i<7;i++)flowerClump(k,(i/6-.5)*(planter.w-.55),.47,(i%3-1)*.16,.65,i%3?0xa491ba:0xd1ad76,i);
    add(k,planter.x,planter.z);
  }
  // Each workshop has an outdoor display connected to its subject.
  for(const border of workshopBorders){
    const k=sceneryKit(border.kind+' entrance garden');
    k.block(0,.27,0,border.w,.42,border.d,0x9c8370);
    k.block(0,.49,0,border.w-.18,.05,border.d-.16,0x6e624d);
    for(let i=0;i<7;i++)flowerClump(k,-2+i*.45,.50,(i%2-.5)*.23,.74,
      {kitchen:0xdcaa62,art:0xcd8093,music:0xb28ca9,weather:0xd7b867,'plant-lab':0xdf9769,'light-lab':0xc3ba78}[border.kind],i);
    const x=1.78;
    k.block(x,.98,0,.11,1.0,.11,0x826546);
    if(border.kind==='music'){
      k.block(x,1.83,0,1.14,.09,.11,0x99784c);
      for(let i=0;i<5;i++){
        const px=x-.43+i*.21,h=.36+i*.076;
        k.drum(px,1.68,0,.025,.24,.025,0x6e765d);
        k.drum(px,1.54-h/2,0,.105,h,.105,0xbda569);
      }
    }else if(border.kind==='weather'){
      k.drum(x,1.85,0,.065,1.14,.065,0x708981);
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3;
        k.block(x+.26*Math.cos(a),2.35,.26*Math.sin(a),.57,.055,.065,0x75867b,0,-a);
        k.globe(x+.51*Math.cos(a),2.35,.51*Math.sin(a),.28,.22,.28,0xbc9868);
      }
    }else if(border.kind==='art'){
      k.block(x,1.68,0,1.06,1.11,.08,0xdfcca4);
      for(let i=0;i<4;i++)k.globe(x+(i%2-.5)*.4,1.53+Math.floor(i/2)*.34,.06,.38,.33,.07,[0xbb765e,0xcaa04d,0x7b9d87,0x9d797c][i]);
    }else if(border.kind==='kitchen'){
      k.pot(x,1.34,0,.56,.43,.56,0xaf7655);flowerClump(k,x,1.52,0,1.0,0x8da65d,1);
    }else{
      k.block(x,1.66,0,.87,.76,.11,0x566e65);
      for(let i=0;i<3;i++)k.leaf(x+(i-1)*.24,1.64,.09,.17,.39,.09,[0xd18d59,0xd6b86e,0x85a79c][i],-.23);
    }
    add(k,border.x,border.z);
  }
  for(const p of COURTYARD_PLANTERS){
    const k=sceneryKit('Courtyard flowering border');
    for(const s of [-1,1])for(let i=0;i<4;i++)flowerClump(k,s*.45,.45,-.81+i*.54,.55,i%3?0xd18885:0xe5bc73,i);
    add(k,p.x,p.z);
  }
  return root;
}
