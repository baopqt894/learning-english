import {sceneryKit} from './campus-scenery-kit';
import {READING_TABLES} from './reading-pavilion';
import {computerDesks,recordingDesk} from './learning-room-layout';
import {flowerClump} from './campus-garden-props';

type Kit=ReturnType<typeof sceneryKit>;
const oak=0xb3895f, metal=0x45625e, linen=0xf3dfb4, copper=0xbb8350;
function shadedLamp(k:Kit,x:number,y:number,z:number){
  k.drum(x,y+.04,z,.29,.074,.29,metal);k.drum(x,y+.32,z,.041,.54,.041,copper);
  k.pot(x,y+.62,z,.47,.24,.47,0x467e6a,0,0,Math.PI);k.globe(x,y+.51,z,.25,.09,.25,0xf5df9d);
}
function wallClock(k:Kit,x:number,y:number,z:number){
  k.drum(x,y,z,.96,.13,.96,metal,0,0,Math.PI/2);k.drum(x,y,z+.081,.82,.035,.82,linen,0,0,Math.PI/2);
  for(let n=0;n<12;n++){const a=n*Math.PI/6;k.block(x+Math.sin(a)*.34,y+Math.cos(a)*.34,z+.108,.026,.078,.016,metal,-a);}
  k.block(x+.092,y+.09,z+.127,.027,.27,.016,metal,-.8);k.block(x-.058,y+.144,z+.136,.025,.33,.016,metal,.39);
}
function wallMap(k:Kit,x:number,y:number,z:number){
  k.block(x,y,z,2.85,1.61,.085,oak);k.block(x,y,z+.057,2.72,1.48,.035,0x89b1b0);
  for(let i=0;i<6;i++)k.leaf(x+[-.76,-.52,.22,.40,.79,.94][i],y+[.25,-.28,.32,-.09,.28,-.35][i],z+.09,[.89,.45,.62,.47,.70,.39][i],i%2?.64:.49,.039,0x87a56c,i*.39);
  for(let i=0;i<3;i++)k.block(x,y+(i-1)*.41,z+.12,2.65,.013,.012,0xc1ceaf);
}
export function furnishRoomAccessories(k:Kit,b:{kind:string;x:number;w:number;d:number;h:number}){
  const rear=-b.d/2+.23;
  switch(b.kind){
    case 'language': {
      // Removable acoustic fins, a speech waveform and a real mixing surface.
      for(const side of [-1,1])for(let j=0;j<7;j++){
        const x=side*(7.55+j*.50),h=.35+.95*Math.abs(Math.sin(j*1.65));
        k.block(x,2.24,rear+.065,.32,h,.19,j%3?0x468b87:0xcb9a58);
      }
      const x=recordingDesk.x,z=recordingDesk.z+.10;
      k.block(x-.46,1.68,z,.88,.12,.44,metal,0,0,-.13);
      for(let i=0;i<6;i++){k.block(x-.78+i*.125,1.75,z,.03,.018,.29,0x86978b);k.block(x-.78+i*.125,1.78,z+Math.sin(i)*.07,.083,.038,.065,linen);}
      break;
    }
    case 'computer':
      for(const [i,desk] of computerDesks.entries()){
        const x=desk.x+2.34,z=desk.z-.17;
        k.block(x,1.42,z,.43,.67,.51,0x354c52);
        for(let row=0;row<4;row++)k.block(x,1.26+row*.09,z+.26,.33,.028,.02,0x718e93);
        k.globe(x+.12,1.67,z+.27,.048,.048,.02,i%2?0x80be9e:0xe2b86b);
      }
      break;
    case 'classroom':
      wallClock(k,0,2.65,rear+.10);
      if(b.x>0)wallMap(k,5.35,2.10,rear+.25);
      else{
        // Three-tier picture-book ledge fixed to the teaching wall.
        for(let shelf=0;shelf<2;shelf++){
          const x=-5.36,y=1.72+shelf*.79;
          k.block(x,y,rear+.32,2.66,.09,.50,oak);
          for(let j=0;j<5;j++){
            const px=x+(j-2)*.48;k.block(px,y+.31,rear+.33,.43,.58,.09,[0xad6851,0x588e7e,0x698ca0,0xd2a661,0x8980a3][(j+shelf)%5],(j%3-1)*.07);
            k.globe(px,y+.35,rear+.402,.20,.16,.018,linen);
          }
        }
      }
      for(const s of [-1,1])k.block(s*b.w*.28,.308,0,3.55,.022,8.59,b.x>0?0x9fb5b3:0xc1ae89);
      break;
    case 'housing':
      for(const side of [-1,1]){
        const x=side*(b.w/2-2.12);
        k.block(x,2.06,rear+.11,2.21,.17,.11,oak);
        for(let n=0;n<3;n++){
          const px=x+(n-1)*.65;k.drum(px,1.94,rear+.20,.072,.30,.072,metal,0,0,.7);
          k.block(px,1.59,rear+.27,.47,.65,.13,n%2?0x829d94:0x9e835c);
          k.block(px,1.48,rear+.35,.36,.20,.055,0x627b69);k.hoop(px,1.90,rear+.24,.20,.24,.29,metal);
        }
      }
      break;
    case 'hall':
      for(let i=0;i<6;i++){const x=(i-2.5)*2.2,z=rear+1.72;
        k.block(x,.76,z,.48,.12,.43,metal);k.drum(x,.96,z,.36,.40,.36,metal,0,0,-.40);
        k.globe(x,1.17,z-.03,.32,.069,.32,[0xe0c175,0x93c2b7,0xd99d80][i%3]);}
      break;
    case 'dining':
      for(const x of [-3.75,3.75])for(const z of [-.7,2.65]){
        k.drum(x,.309,z,4.60,.025,2.90,0xb69c77);
        k.pot(x,1.20,z,.26,.32,.26,0x8eac9a);flowerClump(k,x,1.36,z,.34,0xdaaf55,3);
      }
      break;
    case 'pavilion':
      for(const t of READING_TABLES)shadedLamp(k,t.x-.72,1.095,0);
      k.block(0,.311,0,1.75,.022,5.85,0xad8566);
      for(let i=0;i<7;i++){k.block(0,.331,(i-3)*.76,.36,.012,.36,linen,0,Math.PI/4);}
      break;
  }
}
