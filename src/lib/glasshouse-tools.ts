import {glasshouseEquipment} from './campus-landscape-layout';
import {bucket,feedSack,flowerClump,toolBoard} from './campus-garden-props';
import type {sceneryKit} from './campus-scenery-kit';

export function furnishGlasshouse(k:ReturnType<typeof sceneryKit>,width:number,depth:number){
  const steel=0x83948d,clay=0xb77850;
  for(const f of glasshouseEquipment){
    const {x,z}=f;
    if(f.unit==='wash'){
      k.drum(x-1.43,.61,z,1.58,.56,1.58,0x697e77);
      k.drum(x-1.43,1.69,z,1.56,1.69,1.56,0x437c9a);
      k.globe(x-1.43,2.56,z,1.57,.32,1.57,0x6496a6);
      for(const h of [1.22,1.69,2.16])k.drum(x-1.43,h,z,1.61,.072,1.61,0x9eaeaa);
      k.block(x-.2,1.59,z,.93,.10,.12,steel);
      for(const dx of [.24,1.86])k.block(x+dx,.9,z,.12,1.16,.94,steel);
      k.block(x+1.05,1.52,z,2.09,.19,1.18,steel);
      k.block(x+1.05,1.62,z,1.60,.038,.86,0x647d7b);
      k.hoop(x+1.16,1.93,z-.38,.44,.52,.67,steel);
      for(let i=0;i<3;i++)k.hoop(x+.58,.96,z+.58+i*.075,.65,.68,.71,0x477862);
      bucket(k,x+1.56,.31,z+.07);
    }else if(f.unit==='cart'){
      for(const sx of [-1,1])for(const sz of [-1,1]){
        k.hoop(x+sx*.87,.52,z+sz*.48,.36,.36,1.2,0x455451,0,Math.PI/2);
        k.block(x+sx*.88,.98,z+sz*.48,.075,.98,.075,steel);
      }
      for(const y of [.64,1.30])k.block(x,y,z,2.12,.12,1.19,0xb18b62);
      for(const dx of [-.63,0,.63]){
        k.pot(x+dx,1.52,z,.47,.33,.47,clay);flowerClump(k,x+dx,1.68,z,.58,0xd8ae4c,dx);
      }
      k.block(x-.98,1.45,z,.08,.08,.97,steel);bucket(k,x+.38,.70,z);
    }else{
      toolBoard(k,x,.32,z-.55);
      k.block(x,1.14,z,3.22,.16,1.24,0x866744);
      for(const sx of [-1,1])k.block(x+sx*1.34,.74,z,.19,.85,.88,0x84694e);
      feedSack(k,x-.55,.31,z);
      for(const sx of [-1,1])for(let i=0;i<4;i++){
        k.pot(x+sx*(.23+i*.28),1.37,z,.25,.24,.25,clay);
        k.leaf(x+sx*(.23+i*.28),1.59,z,.18,.28,.14,0x7fa158,i*.18);
      }
    }
  }
  // Brick paths mark work bays without narrowing the circulation aisle.
  for(const side of [-1,1]){
    for(let i=0;i<22;i++)for(let row=0;row<2;row++)
      k.block(side*(3.42+row*.48),.310,-depth*.41+i*.98,.46,.028,.94,[0xc4a17b,0xcaaa85,0xc1a182][(i+row)%3]);
    for(let i=0;i<3;i++){
      const x=side*(width*.23+i*2.15),z=-depth/2+1.07;
      k.block(x,3.97,z-.23,.095,.10,.60,steel);
      k.drum(x,3.52,z,.035,.83,.035,steel);
      k.pot(x,2.98,z,.69,.39,.69,clay);
      for(let n=0;n<5;n++){
        const a=n*2.4;
        k.leaf(x+.25*Math.cos(a),3.05,z+.25*Math.sin(a),.32,.56,.35,0x658c4f,n*.2);
        k.leaf(x+.32*Math.cos(a),2.83,z+.32*Math.sin(a),.21,.45,.24,0x86a363,n*.11);
      }
    }
  }
}
