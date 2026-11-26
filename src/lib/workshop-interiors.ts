import { sceneryKit } from './campus-scenery-kit';
import { workshopFittings, WORKSHOPS } from './workshop-wing';

export function createWorkshopInterior(kind:string){
  const b=WORKSHOPS.find(room=>room.kind===kind);
  if(!b)return;
  const k=sceneryKit(b.english);
  const wood=0xb08760,steel=0x537575,cream=0xe9debd;
  const accents={kitchen:0xb66548,'light-lab':0x408487,'plant-lab':0x628550,art:0xd18a55,music:0x596876,weather:0x648fa0};
  const accent=accents[b.kind];
  // Tall glazed bays and tiled skirting make the perimeter legible from the doorway.
  for(const dx of [-.38,-.22,.22,.38]){
    const x=dx*b.w,z=-b.d/2+.19;
    k.block(x,2.73,z,4.7,2.35,.11,steel);
    for(const side of [-1,1])k.block(x+side*1.12,2.76,z+.08,2.12,2.12,.06,0xb5d2c1);
    k.block(x,2.72,z+.12,4.55,.1,.07,cream);
    k.block(x,1.52,z+.2,4.95,.16,.36,wood);
  }
  // Fine expansion joints break up the slab while leaving every metre walkable.
  for(let dx=2-b.w/2;dx<b.w/2;dx+=2)k.block(dx,.296,0,.018,.009,b.d-.4,0xc9bfa5);
  for(let dz=2-b.d/2;dz<b.d/2;dz+=2)k.block(0,.296,dz,b.w-.4,.009,.018,0xc9bfa5);
  for(const f of workshopFittings.filter(f=>f.kind===kind)){
    const x=f.x-b.x,z=f.z-b.z;
    if(f.unit==='project'){
      // Pair public work areas along a clear, eight-metre central teaching aisle.
      const side=x<0?-1:1;
      for(const sx of [-1,1])k.block(x+sx*f.w/2,.31,z,.07,.035,f.d+.5,accent);
      if(kind==='plant-lab'){
        k.block(x,.56,z,f.w,.48,f.d,wood);
        k.block(x,.815,z,f.w-.18,.04,f.d-.18,0x684c38);
        const species=side<0?'greens':'tomatoes';
        for(const sx of [-.61,.61]){
          k.block(x+sx,.86,z,.045,.06,f.d-.25,0x424f46);
          if(species==='tomatoes'){
            for(const end of [-1,0,1])k.drum(x+sx,1.67,z+end*(f.d/2-.32),.075,1.72,.075,wood);
            for(const y of [1.45,2.13])k.block(x+sx,y,z,.045,.045,f.d-.6,0x838a68);
          }
          const rows=8;
          for(let row=0;row<rows;row++){
            const pz=z+(row/(rows-1)-.5)*(f.d-1.15);
            if(species==='greens'){
              for(let leaf=0;leaf<5;leaf++){
                const angle=leaf*Math.PI*.4;
                k.globe(x+sx+.19*Math.cos(angle),1.08,pz+.22*Math.sin(angle),.48,.39,.47,leaf%2?0x82a957:0x669746);
              }
              k.globe(x+sx,1.19,pz,.36,.35,.40,0xb3bf65);
            }else{
              k.drum(x+sx,1.39,pz,.07,1.12,.07,0x547d43);
              for(const a of [-1,1])k.globe(x+sx+a*.13,1.53+a*.17,pz,.41,.55,.31,0x719a51,-a*.52);
              for(let j=0;j<3;j++)k.globe(x+sx+(j%2-.5)*.27,1.63+j*.12,pz+.14,.21,.23,.21,j===0?0xd77643:0xa7ad50);
            }
          }
        }
      }else if(kind==='art'||kind==='music'){
        k.block(x,.43,z,f.w,.18,f.d,kind==='music'?0xa27250:0xc19c79);
        for(const end of [-1,0,1]){
          const pz=z+end*(f.d/2-1);
          if(kind==='music'){
            k.drum(x,.85,pz,.54,.72,.54,steel);k.block(x,1.24,pz,.78,.13,.75,wood);
            k.drum(x+.6,1.17,pz-.37,.055,1.32,.055,steel);
            k.block(x+.6,1.86,pz-.37,.69,.47,.09,cream);
          }else{
            for(const a of [-1,1])k.block(x+a*.39,1.31,pz,.10,1.68,.10,wood,a*.16);
            k.block(x,1.78,pz+.12,1.12,1.22,.09,cream);
            k.globe(x-.14,1.99,pz+.19,.48,.45,.035,0xdaac69);
            k.globe(x+.14,1.56,pz+.20,.78,.41,.035,[0x789d82,0x7898a1,0xb98472][end+1]);
          }
        }
      }else{
        for(const end of [-1,1]){
          const pz=z+end*f.d*.25;
          k.block(x,.97,pz,f.w-.15,1.28,f.d*.43,kind==='kitchen'?0x869a8e:steel);
          k.block(x,1.65,pz,f.w,.11,f.d*.45,cream);
          for(const a of [-1,1])k.block(x+a*.56,.99,pz+f.d*.218,.93,.94,.055,accent);
          if(kind==='kitchen'){
            for(const offset of [-.55,.55]){
              k.drum(x+offset,1.73,pz,.82,.06,.82,0x495353);
              k.globe(x+offset,1.86,pz,.62,.23,.62,0xb9b598);
            }
          }else if(kind==='weather'){
            k.drum(x,2.05,pz,.84,.69,.84,0x85b4b7);k.drum(x,2.48,pz,1.04,.14,1.04,cream);
          }else{
            for(const a of [-1,0,1])k.drum(x+a*.63,1.91,pz,.43,.44,.43,[0xdb855b,0xedbd68,0x77b3b1][a+1]);
          }
        }
      }
      continue;
    }
    if(f.unit==='bench'){
      k.block(x,.87,z,f.w,.16,f.d,wood);
      for(const s of [-1,1])k.block(x+s*1.25,.57,z,.19,.54,.63,steel);
      continue;
    }
    for(const sx of [-1,1])for(const sz of [-1,1])
      k.block(x+sx*(f.w/2-.09),f.unit==='rack'?1.54:.88,z+sz*(f.d/2-.08),.12,f.unit==='rack'?2.48:1.16,.12,steel);
    if(f.unit==='rack'){
      for(const [row,y] of [.56,1.48,2.43].entries()){
        k.block(x,y,z,f.w,.12,f.d,wood);
        for(let i=0;i<5;i++){
          const px=x-2+i, col=[accent,0xc6a367,0x8eab8e][(i+row)%3];
          if(kind==='plant-lab'){
            k.drum(px,y+.24,z,.5,.36,.5,0xb2734f);
            for(const s of [-1,1])k.globe(px+s*.11,y+.57,z,.25,.48,.2,col,s*-.45);
          }else if(kind==='kitchen'||kind==='weather'){
            k.drum(px,y+.32,z,.44,.52,.44,col);
            k.drum(px,y+.61,z,.48,.07,.48,cream);
            k.block(px,y+.33,z+.22,.25,.13,.024,cream);
          }else{
            k.block(px,y+.35,z,.69,.54,.72,col);
            k.block(px,y+.36,z+.37,.26,.11,.024,cream);
          }
        }
      }
      continue;
    }
    k.block(x,1.45,z,f.w,.15,f.d,wood);
    for(let i=0;i<3;i++){
      const pz=z-1.9+i*1.9;
      if(kind==='plant-lab'){
        k.block(x,1.66,pz,1.72,.31,1.57,0x9d7050);
        k.block(x,1.83,pz,1.57,.06,1.41,0x625039);
        for(const dx of [-.45,.45])for(const dz of [-.36,.36]){
          const height=.34+i*.22;
          k.drum(x+dx,1.85+height/2,pz+dz,.05,height,.05,0x608747);
          for(const s of [-1,1])k.globe(x+dx+s*.12,1.8+height,pz+dz,.32,.53,.26,s<0?0x68944e:0x91ac57,-s*.72);
          if(i===2)k.globe(x+dx,2.6,pz+dz,.20,.22,.19,0xc77741);
        }
      }else if(kind==='music'){
        k.drum(x,1.91,pz,1.25,.74,1.25,accent);k.drum(x,2.30,pz,1.28,.07,1.28,cream);
      }else if(kind==='art'){
        k.block(x,2.11,pz,1.36,1.24,.09,cream);k.globe(x-.15,2.26,pz+.065,.52,.53,.03,[0xc08061,0x598b97,0xc19e4d][i]);
        k.block(x,1.88,pz+.06,1.19,.24,.05,accent);
      }else if(kind==='kitchen'){
        k.block(x,1.57,pz,1.65,.10,1.46,0x394749);k.drum(x,1.83,pz,.86,.42,.86,0xb2c0b7);
        k.drum(x,2.06,pz,.91,.075,.91,steel);
      }else if(kind==='weather'){
        k.drum(x,2.16,pz,.08,1.3,.08,steel);k.block(x,2.8,pz,1.29,.07,.09,cream);
        for(const s of [-1,1])k.globe(x+s*.61,2.77,pz,.32,.28,.38,accent);
      }else{
        k.block(x,1.58,pz,1.8,.10,1.24,steel);
        for(const [j,col] of [0xde8a65,0xd4b958,0x69aaa9].entries())k.globe(x-.52+j*.52,1.91,pz,.46,.65,.46,col);
      }
    }
  }
  const group=k.finish();group.position.set(b.x,0,b.z);group.visible=false;return group;
}
