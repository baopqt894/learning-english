import { sceneryKit } from './campus-scenery-kit';
import { demonstrationBays } from './campus-detail-layout';
import { flowerClump, fruitCrate } from './campus-garden-props';
import type { WORKSHOPS } from './workshop-wing';

type Kit=ReturnType<typeof sceneryKit>;
const timber=0x97653f,ink=0x304749,brass=0xc59b57,ceramic=0xeedfb6;
function worktop(k:Kit,x:number,z:number){
  for(const dx of [-1.9,1.9])for(const dz of [-.57,.57])k.block(x+dx,.84,z+dz,.13,1.04,.13,ink);
  k.block(x,1.39,z,4.5,.16,1.70,timber);k.block(x,1.49,z,4.38,.08,1.60,ceramic);
}
function kitchen(k:Kit,x:number,z:number,left:boolean){
  if(left){
    // Deck ovens, black glass windows, brass handles and a vented extraction hood.
    k.block(x,1.39,z,3.83,2.12,1.68,0x9f6149);
    for(const y of [.99,1.92]){
      k.block(x,y,z+.86,3.26,.76,.07,ink);k.block(x-.18,y,z+.91,2.58,.52,.04,0x5b4840);
      for(let i=0;i<4;i++)k.globe(x-1+i*.54,y-.10,z+.94,.42,.16,.08,0xe3a45c);
      k.block(x,y+.28,z+1.02,2.55,.066,.075,brass);k.drum(x+1.43,y,z+.935,.15,.08,.15,ceramic,0,0,Math.PI/2);
    }
    k.block(x,2.63,z,4.22,.38,1.93,ink);k.block(x,3.1,z-.3,1.00,.62,.68,0x80958b);
  }else{
    worktop(k,x,z);fruitCrate(k,x-1.45,1.53,z,0xd97744);
    for(let i=0;i<3;i++){const px=x-.38+i*.77;
      k.drum(px,1.59,z+.08,.65,.08,.64,0x405455);k.pot(px,1.84,z+.08,.55,.45,.55,0x919b93);
      k.globe(px,2.08,z+.08,.64,.13,.64,ceramic);k.globe(px,2.17,z+.08,.12,.11,.12,ink);
    }
  }
}
function optics(k:Kit,x:number,z:number,left:boolean){
  worktop(k,x,z);k.block(x,1.57,z,3.95,.10,.20,ink);
  if(left){
    for(let i=0;i<3;i++){
      const px=x-1.4+i*1.4;k.drum(px,1.88,z,.09,.65,.09,brass);
      k.hoop(px,2.42,z,1.05,1.05,.82,ink,0,Math.PI/2-.28);
      k.globe(px,2.42,z,.16,.87,.87,[0x99ccd8,0xe4bb75,0xcd8279][i]);
    }
    k.block(x,2.42,z,3.40,.041,.041,0xffdb76);
  }else{
    k.block(x+1.4,2.36,z,1.04,1.58,.11,ink);k.block(x+1.4,2.36,z+.08,.86,1.38,.04,ceramic);
    for(let i=0;i<6;i++){const col=[0xc95b51,0xdf9952,0xe2ca68,0x81a875,0x75b3c3,0x8278aa][i];
      k.block(x+.40,2.13+i*.09,z+.1,1.65,.046,.038,col,-.11+i*.045);}
    k.block(x-.85,2.10,z,.89,.89,.55,0x8bbec4,Math.PI/4);
    k.drum(x-1.69,1.83,z,.42,.61,.42,ink);
  }
}
function nursery(k:Kit,x:number,z:number,left:boolean){
  k.block(x,.64,z,4.55,.64,1.88,timber);k.block(x,.98,z,4.35,.07,1.72,0x674734);
  if(left){
    for(const dx of [-1.95,0,1.95]){
      k.hoop(x+dx,1.24,z,1.87,2.35,.62,0x9cad91,0,Math.PI/2);
      k.block(x+dx,1.47,z-.78,.07,.94,.07,0x587c5d);
    }
    k.block(x,2.30,z,4.15,.07,.07,0x748d70);
    for(let i=0;i<12;i++)flowerClump(k,x-1.75+(i%6)*.67,1.02,z+(i<6?-.36:.36),.52,i%2?0xefbd58:0xb57189,i);
  }else{
    for(let i=0;i<5;i++){
      const px=x-1.65+i*.80,h=.51+i*.23;k.drum(px,1+h*.5,z,.085,h,.085,0x59774a);
      for(const side of [-1,1])k.leaf(px+side*.17,1+h*.72,z,.31,.29,.19,0x87a749,-side*.6);
      k.globe(px,1+h,z,.34,.30,.34,i<2?0x83a649:0xd86b46);
      k.block(px,1.30,z+.61,.42,.26,.055,ceramic);
    }
  }
}
function weather(k:Kit,x:number,z:number,left:boolean){
  if(left){
    // A louvred instrument shelter above grass, shaded on all sides.
    for(const dx of [-.85,.85])for(const dz of [-.57,.57])k.block(x+dx,1.12,z+dz,.13,1.62,.13,timber);
    k.block(x,1.74,z,2.3,.18,1.65,ceramic);
    for(let j=0;j<7;j++){
      for(const s of [-1,1]){
        k.block(x,1.89+j*.115,z+s*.70,2.14,.067,.18,0xe9e4cc,0,0,s*.40);
        k.block(x+s*1.02,1.89+j*.115,z,.15,.067,1.35,0xd2d8c4);
      }
    }
    k.block(x,2.84,z,2.69,.17,1.94,0x709a96);
  }else{
    k.block(x,.51,z,3.6,.41,1.62,0x83958a);k.drum(x,2.02,z,.16,2.82,.16,ink);
    for(let j=0;j<3;j++){
      const a=j*2*Math.PI/3,dx=Math.cos(a),dz=Math.sin(a);
      k.block(x+.46*dx,3.36,z+.46*dz,.94,.063,.063,brass,0,-a);
      k.globe(x+.95*dx,3.36,z+.95*dz,.41,.29,.41,0x547997);
    }
    k.block(x,2.79,z,1.6,.08,.08,ink);k.block(x-.60,2.91,z,.43,.33,.065,0xcc7154);
    k.drum(x+1.23,1.05,z+.23,.37,.69,.37,0xa6c8c5);
  }
}
function art(k:Kit,x:number,z:number,left:boolean){
  if(left){
    for(const dx of [-1.8,1.8])for(const dz of [-.64,.64])k.block(x+dx,1.55,z+dz,.10,2.48,.10,ink);
    for(let row=0;row<6;row++){
      const y=.63+row*.34;k.block(x,y,z,3.82,.066,1.48,timber);
      for(const side of [-1,1]){k.block(x+side*.85,y+.05,z,1.47,.028,1.10,ceramic,0,side*.04);
        k.leaf(x+side*.85,y+.077,z,.90,.017,.62,[0x608ea0,0xc78d62,0x9caf68][row%3]);}
    }
  }else{
    worktop(k,x,z);
    for(const [i,col] of [0xc68a66,0x64948a,0xc6a574].entries()){
      const px=x+(i-1)*1.40;k.drum(px,1.63,z,.99,.18,.99,0x687976);k.pot(px,1.93,z,.63,.44,.63,col);
      k.globe(px,2.19,z,.78,.59,.78,col);k.drum(px,2.49,z,.38,.23,.38,col);k.hoop(px,2.61,z,.47,.47,.50,ceramic,0,0,Math.PI/2);
    }
  }
}
function music(k:Kit,x:number,z:number,left:boolean){
  if(left){
    k.block(x,.42,z,4.65,.20,2.02,0x715b78);
    for(let i=0;i<4;i++){
      const px=x-1.65+i*1.10,h=1.60-i*.17;
      k.drum(px,.91,z,.055,1.02,.055,brass);k.globe(px,1.32,z,.84,h*.69,.44,0xb98049);
      k.globe(px,1.82,z,.64,h*.51,.38,0xb98049);k.block(px,2.29,z,.15,1.10,.16,ink);
      for(let j=0;j<3;j++)k.block(px+(j-1)*.041,2.02,z+.20,.013,1.29,.011,ceramic);
      k.globe(px,2.89,z,.27,.26,.17,0x95633f);
    }
  }else{
    for(const dx of [-1.64,1.64])k.block(x+dx,.91,z,.14,1.18,1.14,ink);
    for(let i=0;i<12;i++){
      const px=x-1.95+i*.35,len=1.57-i*.068;
      k.drum(px,1.04,z,.24,.95-i*.044,.24,brass);k.block(px,1.57,z,.30,.10,len,i%2?0xcd995c:0xb17a4e);
    }
  }
}
const stations={'kitchen':kitchen,'light-lab':optics,'plant-lab':nursery,weather,art,music};
export function furnishPracticalBays(k:Kit,b:typeof WORKSHOPS[number]){
  const palette={kitchen:0xb87756,'light-lab':0x709aab,'plant-lab':0x879c6c,weather:0x809eaa,art:0xcaa26e,music:0x958598};
  for(const f of demonstrationBays.filter(s=>s.room===b.kind)){
    const x=f.x-b.x,z=f.z-b.z;
    k.block(x,.324,z,5.65,.036,3.42,palette[b.kind]);
    stations[b.kind](k,x,z,f.side<0);
  }
  // Floor inlays identify the subject from the campus camera. Their surfaces stay walkable.
  for(const side of [-1,1]){
    const x=side*b.w*.32,z=0;
    switch(b.kind){
      case 'kitchen':
        for(let i=0;i<4;i++)for(let j=0;j<7;j++){
          k.block(x+(i-1.5)*1.93,.318,z+(j-3)*2.05,1.90,.028,2.02,(i+j)%2?0xc49b77:0xd9bb90);
        }
        break;
      case 'light-lab':
        k.block(x,.318,z,8.2,.028,b.d*.58,0x607d83);
        for(let i=0;i<6;i++)k.block(x+(i-2.5)*.36,.337,z,.16,.012,b.d*.56,
          [0xd98a74,0xdfb17a,0xd9cc8e,0x9fbc8a,0x8cbabb,0xaf9cbe][i],0,-.19*side);
        break;
      case 'plant-lab':
        for(let i=0;i<5;i++){
          const px=x+(i-2)*1.48;
          k.block(px,.319,z,1.36,.033,b.d*.59,i%2?0xacaa7c:0xa1a781);
          for(let n=0;n<6;n++)k.block(px,.344,z+(n-2.5)*2.58,1.28,.016,.05,0xd4c599);
        }
        break;
      case 'weather':
        k.drum(x,.323,z,9.1,.037,9.1,0x87a7ad);
        for(const diameter of [3,5.5,8.4])k.hoop(x,.351,z,diameter,diameter,.34,0xd0d9be,0,0,Math.PI/2);
        for(let i=0;i<8;i++){const a=i*Math.PI/4;
          k.block(x+Math.sin(a)*3.55,.355,z+Math.cos(a)*3.55,.13,.018,1.10,linenColour,0,a);}
        break;
      case 'art':
        for(let i=0;i<3;i++){const dz=(i-1)*5.62;
          k.drum(x+(i%2-.5)*1.7,.324,z+dz,6.92,.037,5.1,[0xc99877,0x9faa95,0xb4999f][(i+(side>0?1:0))%3]);}
        break;
      case 'music':
        k.block(x,.32,z,7.15,.03,b.d*.54,0x9f8d9f);
        for(let i=0;i<5;i++)k.block(x+(i-2)*.84,.344,z,.063,.014,b.d*.52,linenColour);
        for(let i=0;i<3;i++){
          const px=x+((i+(side>0?1:0))%3-1)*.84,pz=(i-1)*4.1;
          k.globe(px,.357,pz,1.22,.019,.79,0x6e677a,0,.40);k.block(px+.53,.357,pz-.82,.11,.018,1.8,0x6e677a);
        }
        break;
    }
  }
}
const linenColour=0xede1be;
