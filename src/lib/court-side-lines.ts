import type { sceneryKit } from './campus-scenery-kit';
import type { courtEquipment } from './recreation-park';
type Kit=ReturnType<typeof sceneryKit>;
const metal=0x314f59, plank=0xc78f5d,white=0xffedcf, orange=0xde7846;

function rackBall(k:Kit,x:number,y:number,z:number,basket:boolean){
  const size=basket?.38:.35;
  k.globe(x,y,z,size,size,size,basket?orange:0xf4e4a1);
  for(const turn of [0,Math.PI/2]){
    k.hoop(x,y,z,size*1.035,size*1.035,.13,basket?0x674631:0x4d969b,0,turn);
  }
}
export function courtSideLines(k:Kit,f:typeof courtEquipment[number]){
  const {x,z,unit}=f, basket=f.sport==='basketball';
  const accent=basket?0x527eae:0x429888;
  if(unit==='terrace'){
    for(let row=0;row<3;row++){
      const height=.39+row*.40,pz=z+.85-row*.89;
      k.block(x,height/2,pz,9.6,height,.89,0xb7a78e);
      k.block(x,height+.04,pz+.40,9.65,.085,.11,white);
      for(let seat=0;seat<12;seat++){
        if(seat===5||seat===6)continue;
        const px=x+(seat-5.5)*.78;
        k.block(px,height+.09,pz,.68,.13,.55,row%2?accent:0x698f98);
        k.block(px,height+.28,pz-.24,.68,.37,.09,row%2?accent:0x698f98);
      }
    }
    for(const edge of [-1,1]){
      k.block(x+edge*4.64,1.14,z-.93,.085,2.28,.085,metal);
      k.block(x+edge*4.64,.76,z+.64,.085,1.52,.085,metal);
      k.block(x+edge*4.64,1.86,z-.13,.085,.09,1.79,metal,0,0,.43);
    }
  }else if(unit==='official'){
    k.block(x,.84,z,3.65,1.38,1.22,accent);
    k.block(x,1.58,z,3.81,.15,1.31,plank);
    for(const s of [-1,1]){
      k.block(x+s*1.62,1.85,z-.47,.09,3.62,.09,metal);
      k.block(x+s*.20,1.99,z+.16,.34,.57,.08,0x283e48);
      // Two segmented digits on a real flip board.
      for(const h of [1.78,2.19])k.block(x+s*.20,h,z+.213,.19,.038,.03,white);
      for(const edge of [-1,1])k.block(x+s*.20+edge*.095,1.98,z+.213,.035,.41,.03,white);
    }
    for(let stripe=0;stripe<9;stripe++)k.block(x+(stripe-4)*.48,3.62,z,.485,.10,1.8,stripe%2?white:accent,0,0,.10);
    k.drum(x+1.14,1.99,z,.48,.69,.48,0x68b8c0);k.drum(x+1.14,2.37,z,.52,.08,.52,white);
    k.block(x-1.02,1.70,z+.12,.51,.06,.34,ivoryPaper,0,-.14);
  }else if(unit==='cart'){
    for(const sx of [-1,1])for(const sz of [-1,1]){
      k.hoop(x+sx*.88,.25,z+sz*.38,.33,.33,.74,metal,0,Math.PI/2);
      k.block(x+sx*.91,.94,z+sz*.37,.065,1.43,.065,metal);
    }
    for(const h of [.53,1.13]){
      for(const sz of [-1,1])k.block(x,h,z+sz*.26,1.88,.07,.07,metal);
      for(let i=0;i<5;i++)rackBall(k,x+(i-2)*.35,h+.18,z,basket);
    }
  }else{
    // Ladder against the net post. Raised handrails and landing face the court.
    for(const sz of [-1,1]){
      k.block(x-.42,1.28,z+sz*.39,.075,2.56,.075,metal);
      k.block(x+.40,1.44,z+sz*.39,.075,2.88,.075,metal);
      k.block(x,2.40,z+sz*.39,.88,.07,.07,metal);
    }
    for(let step=0;step<6;step++)k.block(x-.42,.27+step*.31,z,.11,.07,.81,white);
    k.block(x,1.98,z,.98,.12,1.04,accent);
    k.block(x+.40,2.83,z,.075,.075,.85,metal);
  }
}
const ivoryPaper=0xece1bd;
