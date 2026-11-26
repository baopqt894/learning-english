import type { sceneryKit } from './campus-scenery-kit';
type Kit=ReturnType<typeof sceneryKit>;
const timber=0x94653c, honey=0xbb8a54, leafGreen=0x588343;

export function fruitCrate(k:Kit,x:number,y:number,z:number,fruit:number){
  k.block(x,y+.08,z,1.02,.1,.73,timber);
  for(const sx of [-1,1])for(const sz of [-1,1])
    k.block(x+sx*.46,y+.28,z+sz*.31,.09,.5,.09,timber);
  for(const h of [.17,.34,.48])for(const side of [-1,1]){
    k.block(x,y+h,z+side*.36,1.04,.10,.06,honey);
    k.block(x+side*.5,y+h,z,.06,.10,.72,honey);
  }
  for(let i=0;i<9;i++){
    const px=x+(i%3-1)*.26,pz=z+(Math.floor(i/3)-1)*.19;
    k.globe(px,y+.46+i%2*.033,pz,.25,.23,.24,fruit);
    if(i%3===0)k.leaf(px+.05,y+.57,pz,.12,.04,.08,leafGreen);
  }
}

export function hayBale(k:Kit,x:number,y:number,z:number,scale=1){
  k.block(x,y+.35*scale,z,1.34*scale,.70*scale,.8*scale,0xc9a65c);
  for(const s of [-1,1]){
    k.block(x+s*.39*scale,y+.35*scale,z,.045*scale,.72*scale,.82*scale,0x826137);
    for(let i=0;i<12;i++)k.block(x+(i-5.5)*.1*scale,y+(.18+i%4*.09)*scale,z+s*.41*scale,.027,.32*scale,.027,0xe3c47c,(i%3-1)*.2);
  }
}
export function feedSack(k:Kit,x:number,y:number,z:number){
  k.globe(x,y+.38,z,.79,.81,.69,0xb39a70);
  k.pot(x,y+.70,z,.51,.20,.49,0xd0b58a);
  k.globe(x,y+.805,z,.43,.10,.40,0xd6b663);
  for(let i=0;i<7;i++)k.globe(x+.15*Math.sin(i*2.4),y+.85,z+.12*Math.cos(i*2.4),.064,.045,.066,0xe9cf90);
}
export function bucket(k:Kit,x:number,y:number,z:number){
  k.pot(x,y+.31,z,.63,.62,.60,0x879a94);
  k.drum(x,y+.618,z,.54,.023,.51,0x608787);
  k.hoop(x,y+.62,z,.58,.64,.42,0x566b68);
}

export function flowerClump(k:Kit,x:number,y:number,z:number,scale:number,color:number,seed:number){
  for(let i=0;i<5;i++){
    const angle=seed+i*2.4,px=x+Math.cos(angle)*scale*.26,pz=z+Math.sin(angle)*scale*.24;
    const h=scale*(.32+(i%3)*.15);
    k.leaf(px,y+h*.63,pz,.21*scale,h*1.65,.26*scale,i%2?0x698d44:0x466e3c,Math.cos(angle)*.56,angle);
    if(i%2===0){
      for(let n=0;n<4;n++){
        const a=angle+n*Math.PI/2;
        k.leaf(px+Math.cos(a)*scale*.095,y+h*1.27,pz+Math.sin(a)*scale*.095,.18*scale,.10*scale,.17*scale,color);
      }
      k.globe(px,y+h*1.3,pz,.095*scale,.09*scale,.095*scale,0xf1c75e);
    }
  }
}

export function pergola(k:Kit,flowers:number){
  k.block(0,.08,0,7.7,.14,4.95,0xccb591);
  for(const s of [-1,1]){
    k.block(0,3.13,s*2,7.6,.23,.23,timber);
    for(const t of [-1,1]){
      k.block(s*3.4,1.61,t*2,.24,3.1,.24,timber);
      k.block(s*3.4,.29,t*2,.43,.42,.43,0xb2a68b);
      k.block(s*3.1,2.86,t*2,.11,.83,.14,honey,s*-.74);
    }
    k.block(s*3.4,.26,0,.86,.36,3.5,0xa48367);
    for(let i=0;i<6;i++)flowerClump(k,s*3.4,.43,-1.34+i*.53,.85,flowers,i);
    const tx=s*1.85;
    for(const sz of [-1,1]){
      k.block(tx,.62,sz*.72,1.48,.18,.24,timber);
      for(const sx of [-1,1])k.block(tx+sx*.48,.57,sz*.72,.12,1.02,.13,timber,sx*-.17);
    }
    for(let n=-2;n<=2;n++)k.block(tx+n*.17,1.12,0,.16,.11,2.52,honey);
    for(const sx of [-1,1])k.block(tx+sx*.76,.69,0,.31,.1,2.44,honey);
    k.pot(tx,1.34,.18,.28,.31,.28,0xb97552);
    flowerClump(k,tx,1.47,.18,.38,flowers,s);
  }
  for(let i=0;i<13;i++)k.block(-3.54+i*.59,3.34,0,.12,.16,4.87,honey);
  for(let i=0;i<29;i++){
    const x=-3.45+(i%13)*.56,z=(i%2?1:-1)*(1.62+.38*Math.sin(i*1.8));
    k.leaf(x,3.47,z,1.04,.36,1.0,i%2?0x73934b:0x4c7842,0,i);
    if(i%2===0)flowerClump(k,x,3.44,z,.68,flowers,i);
    if(i%4===0)k.leaf(x,3.05,z+.22,.32,.85,.44,leafGreen,i%3*.14);
  }
}

export function toolBoard(k:Kit,x:number,y:number,z:number){
  k.block(x,y+1.23,z,3.15,2.32,.13,0xa9845a);
  for(const side of [-1,1])k.block(x+side*1.52,y+1.24,z+.08,.1,2.48,.10,timber);
  for(let i=0;i<4;i++){
    const px=x-1.06+i*.71,h=y+1.43+i%2*.18;
    k.block(px,h,z+.18,.07,.75,.075,0xcaad7a,(i-1.5)*.05);
    k.globe(px,h-.47,z+.19,.27,.35,.09,0x677f7a);
    k.hoop(px,h+.42,z+.18,.17,.20,.48,0x516459);
  }
}

export function meadow(k:Kit,x:number,z:number,w:number,d:number,seed:number,straw=false){
  // Localised patches leave trampled tracks around the gates.
  const noise=(n:number)=>{const a=Math.sin(n*73.13+seed*49.37)*43658.5;return a-Math.floor(a);};
  for(let i=0;i<Math.ceil(w*d*.44);i++){
    const px=x+(noise(i*5)-.5)*w,pz=z+(noise(i*5+1)-.5)*d;
    if(Math.sin(px*1.31+pz*.94)<-.18)continue;
    for(let n=0;n<3;n++){
      const h=.14+noise(i*5+n)*.22;
      k.leaf(px+n*.05,straw?.135:.12+h/2,pz+(n-1)*.08,straw?.063:.090,straw?.038:h,straw?.30:.09,
        (straw?[0xcfac6c,0xd6b982,0xb39a65]:[0x8fa063,0x7a924e,0x668340])[n],(n-1)*.4,noise(i*5+2)*6);
    }
  }
}

export function bananaClump(k:Kit,x:number,z:number,height:number,seed:number){
  for(let stalk=0;stalk<2;stalk++){
    const h=height*(1-stalk*.32),px=x+stalk*.65,pz=z+stalk*.34;
    k.pot(px,h*.43,pz,.25,h*.82,.27,0x9d9a5b);
    for(let band=0;band<5;band++)k.drum(px,h*(.12+band*.13),pz,.24,.055,.25,0x918459);
    for(let i=0;i<7;i++){
      const a=seed+i*Math.PI*2/7,vx=Math.sin(a),vz=Math.cos(a);
      const length=h*(.49+(i%3)*.07),slope=.20+(i%3)*.15;
      k.leaf(px+vx*length*.42,h+.065,pz+vz*length*.42,.44,.12,length,0x649349,0,a,-slope);
      k.leaf(px+vx*length*.90,h-.02,pz+vz*length*.90,.51,.15,length*.65,i%2?0x80a555:0x5a8845,0,a,.46);
      k.block(px+vx*length*.46,h+.13,pz+vz*length*.46,.039,.032,length*.86,0x9cab62,0,a,-slope);
    }
    for(let row=0;row<3;row++)for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      k.leaf(px+.25+.14*Math.cos(a),h-.30-row*.13,pz+.15*Math.sin(a),.12,.21,.14,row===2?0xcab45c:0xaabc60,.3,a);
    }
  }
}
