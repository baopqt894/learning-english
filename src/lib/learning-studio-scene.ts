import * as THREE from 'three';
import { sceneryKit } from './campus-scenery-kit';
import { boothX,cardDesks,computerRows,conversationPods,globe,listeningBooths,pairTables,recordingDesk,shelf } from './learning-room-layout';
import { placeSchoolProp } from './school-props';
import { flowerClump } from './campus-garden-props';

const oak=0xc58c54,walnut=0x835837,ink=0x233f49,teal=0x3c9690,ivory=0xf7dfac;
type Kit=ReturnType<typeof sceneryKit>;
type Room={x:number;z:number;w:number;d:number;kind:string};

// A printed teaching panel sits flush to the back wall, above eye level.
function wallPrint(width:number,height:number,paint:(c:CanvasRenderingContext2D)=>void) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=320;
  const c=canvas.getContext('2d')!;paint(c);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:t}));
  return m;
}
function teachingPrint(computer:boolean){
  return wallPrint(7.8,2.15,c=>{
    c.fillStyle=computer?'#193746':'#173e40';c.fillRect(0,0,1024,320);
    c.fillStyle='#fde7b9';c.font='bold 45px sans-serif';c.fillText(computer?'DIGITAL WORKSHOP':'LISTENING STUDIO',40,64);
    c.font='27px sans-serif';c.fillText(computer?'INPUT   /   PROCESS   /   OUTPUT':'Listen.    Speak.    Replay.',42,284);
    c.lineWidth=5;c.strokeStyle=computer?'#89cbd6':'#87e4c9';
    if(computer){
      for(let i=0;i<6;i++){
        c.beginPath();c.moveTo(35,106+i*20);c.lineTo(276+i*35,106+i*20);c.lineTo(324+i*35,145+i*12);c.lineTo(904,145+i*12);c.stroke();
        c.beginPath();c.arc(914,145+i*12,7,0,Math.PI*2);c.stroke();
      }
    }else for(let i=0;i<90;i++){
      const wave=(.17+.83*Math.abs(Math.sin(i*.117)*Math.cos(i*.189)))*(.43+.57*Math.abs(Math.cos(i*.64)));
      const h=12+wave*118; c.fillStyle=i%11<2?'#edbe73':'#84ddc7';c.fillRect(43+i*10.5,164-h/2,5,h);
    }
  });
}
function equipment(k:Kit,x:number,y:number,z:number){
  k.block(x,y+.12,z,.62,.18,.38,ink);
  k.block(x,y+.49,z-.10,.74,.48,.08,ink);
  k.block(x,y+.49,z-.05,.64,.37,.033,0x70bdbe);
  for(let i=0;i<6;i++)k.block(x+(i-2.5)*.076,y+.48,z-.025,.04,.07+(i%3)*.055,.022,ivory);
}
function pottedFern(k:Kit,x:number,z:number){
  k.pot(x,.66,z,.68,.68,.68,0xc37a51);
  for(let i=0;i<8;i++){
    const a=i*2.4;k.leaf(x+Math.sin(a)*.18,1.26,z+Math.cos(a)*.18,.23,.7,.27,i%2?0x558d62:0x86ac63,0,a,.63);
  }
}
function furnishListeningRoom(k:Kit,props:THREE.Group,b:Room){
  const back=-b.d/2;
  for(let i=0;i<Math.floor((b.w-.4)/.28);i++){
    const x=-b.w/2+.32+i*.28;
    k.block(x,1.84,back+.15,.21,2.99,.12,i%3?oak:walnut);
  }
  for(const z of listeningBooths){
    const x=boothX;
    k.block(x-.47,.73,z,.24,.83,1.77,walnut);
    for(const edge of [-1,1])k.block(x+.43,.73,z+edge*.65,.10,.83,.10,ink);
    k.block(x,1.19,z,1.56,.13,1.88,oak);
    for(const s of [-1,1]){
      k.block(x,1.45,z+s*.90,1.62,1.64,.085,oak);
      k.block(x,1.56,z+s*.844,1.32,1.10,.035,0x50837b);
    }
    for(let bar=0;bar<6;bar++)k.block(x-.41+bar*.15,1.56,z+.932,.06,.85,.035,bar%2?oak:walnut);
    equipment(k,x-.13,1.25,z-.27);
    k.hoop(x+.12,1.59,z+.43,.52,.55,.45,ink);
    for(const s of [-1,1])k.globe(x+.12+s*.21,1.47,z+.43,.12,.24,.19,teal);
    placeSchoolProp(props,'chair',x+1.42,.31,z,.89,-Math.PI/2);
  }
  for(const {x,z} of pairTables){
    k.block(x,1.12,z,2.55,.13,1.12,oak);
    for(const side of [-1,1]){
      k.block(x+side*.98,.72,z,.12,.74,.84,walnut);
      placeSchoolProp(props,'chair',x+side*.55,.31,z+side*.88,.74,side<0?0:Math.PI);
      k.block(x+side*.61,1.21,z+side*.18,.54,.045,.36,ivory,0,side*.12);
      for(let n=0;n<3;n++)k.block(x+side*.61,1.24,z+side*.18+(n-1)*.071,.35-n*.035,.012,.021,teal);
    }
  }
  // Two facing settees and a coffee table, all inside one rug footprint.
  for(const pod of conversationPods){
    k.drum(pod.x,.313,pod.z,4.55,.026,3.75,0x558d88);
    for(const s of [-1,1]){
      const x=pod.x+s*1.32;
      k.block(x,.64,pod.z,.91,.53,2.35,teal);k.block(x+s*.38,1.03,pod.z,.20,.68,2.42,0x34746f);
      for(const e of [-1,1]){
        k.block(x,.96,pod.z+e*1.07,.92,.43,.16,0x4e9891);
        k.globe(x+s*.13,1.02,pod.z+e*.64,.34,.39,.53,e<0?0xdfa15f:ivory,.14);
      }
    }
    k.drum(pod.x,.69,pod.z,.22,.72,.22,walnut);k.drum(pod.x,1.07,pod.z,1.28,.11,.95,oak);
    k.block(pod.x+.18,1.16,pod.z-.02,.49,.06,.34,ivory,0,.27);
    k.pot(pod.x-.32,1.27,pod.z,.26,.32,.26,0xdf9160);flowerClump(k,pod.x-.32,1.42,pod.z,.34,0xeebe72,2);
  }
  placeSchoolProp(props,'bookshelf',shelf.x,.31,shelf.z,2.68);
  const {x:gx,z:gz}=globe;
  k.drum(gx,.41,gz,.85,.17,.77,walnut);k.drum(gx,.83,gz,.15,.79,.15,oak);
  k.globe(gx,1.65,gz,.91,.91,.91,0x4d9cae);
  for(const [dx,dy,w,h] of [[-.20,.18,.34,.24],[-.16,-.12,.21,.34],[.20,.11,.31,.21],[.15,-.19,.18,.14]])
    k.leaf(gx+dx,1.65+dy,gz+.37,w,h,.09,0xa5bc73,dx);
  k.hoop(gx,1.64,gz,1.13,1.13,.40,0xccaa66,-.27,.52);
  k.block(recordingDesk.x,.97,recordingDesk.z,2.27,1.26,.69,ink);
  placeSchoolProp(props,'projector',recordingDesk.x-.06,1.60,recordingDesk.z,.88);
  k.drum(recordingDesk.x+.77,1.90,recordingDesk.z,.05,.63,.05,ivory);
  k.globe(recordingDesk.x+.77,2.25,recordingDesk.z,.18,.32,.18,ink);
  for(const s of [-1,1]){
    k.block(s*5.45,2.42,back+.33,.72,1.12,.35,ink);
    for(const h of [2.22,2.63])k.globe(s*5.45,h,back+.52,.39,.35,.06,0x718f89);
  }
  // A low role-play desk by the exit gives pairs a separate place to practise directions.
  for(const desk of cardDesks){
    k.block(desk.x,1.04,desk.z,2.62,.13,.84,oak);
    for(const s of [-1,1])k.block(desk.x+s*1.05,.69,desk.z,.14,.68,.66,ink);
    for(let i=0;i<3;i++){
      const px=desk.x-.78+i*.68,col=[0x539a99,0xd99062,0xe3b459][i];
      k.block(px,1.17,desk.z-.01,.51,.11,.37,col,0,(i-1)*.12);
      k.block(px,1.24,desk.z-.01,.43,.025,.29,ivory);
      for(let n=0;n<3;n++)k.block(px-.045,1.258,desk.z-.1+n*.074,.24+n*.035,.008,.024,col);
    }
  }
  for(const s of [-1,1]){
    const px=s*3.5;
    k.block(px,3.32,back+.45,.065,.065,.66,ink);
    k.drum(px,3.14,back+.75,.045,.37,.045,ink);
    k.pot(px,2.91,back+.75,.51,.24,.51,0xbb9b5b,Math.PI);
    k.globe(px,2.77,back+.75,.25,.11,.25,0xffe6aa);
  }
  // Central floor motif remains completely traversable.
  k.drum(0,.315,.35,4.10,.025,3.92,0xa97251);
  k.drum(0,.334,.35,3.86,.014,3.68,0x498782);
  for(const s of [-1,1]){
    k.globe(s*.49,.35,.35+s*.24,1.12,.015,.77,ivory);
    k.block(s*.73,.35,.52+s*.22,.25,.018,.25,ivory,0,.66);
  }
}
export function createLearningStudio(b:Room){
  if(!['language','computer','classroom','hall'].includes(b.kind))return;
  const k=sceneryKit(b.kind),props=new THREE.Group(),back=-b.d/2;
  const studio=b.kind==='language', computer=b.kind==='computer';
  // A perimeter border and staggered joints define the room without filling its aisle.
  for(const side of [-1,1])k.block(side*(b.w/2-.34),.303,0,.41,.018,b.d-.32,studio?oak:0x97aaa1);
  for(let row=0;row<Math.floor(b.d/.60);row++){
    const z=back+.45+row*.60;
    k.block(0,.298,z,b.w-.30,.014,.021,studio?0xc4aa88:0xc4c3aa);
    for(let x=-b.w/2+1+(row%2)*1.55;x<b.w/2-.5;x+=3.1)
      k.block(x,.298,z+.30,.022,.014,.59,0xc2b79e);
  }
  if(studio)furnishListeningRoom(k,props,b);
  else if(computer){
    for(const s of [-1,1]){
      const x=s*6.75;
      k.block(x,1.67,back+.55,1.24,2.73,.73,ink);
      for(let i=0;i<7;i++){
        const h=.59+i*.33;
        k.block(x,h,back+.94,1.05,.22,.065,0x527077);
        for(let n=0;n<3;n++)k.globe(x-.39+n*.13,h,back+.99,.06,.06,.035,n?teal:0xe4ae64);
      }
    }
    for(const side of [-1,1])for(const row of computerRows){
      const x=side*b.w*.28,z=row;
      for(const dx of [-.65,.65]){
        k.block(x+dx,1.32,z-.018,.48,.19,.018,ink);
        for(let n=0;n<3;n++)k.block(x+dx-.09,1.26+n*.05,z-.005,.20+n*.07,.018,.01,0x89dfcb);
        k.globe(x+dx+.46,1.06,z+.24,.12,.08,.18,ink);
      }
    }
  }else if(b.kind==='hall'){
    for(const s of [-1,1]){
      k.block(s*(b.w/2-1.75),2.11,back+.43,2,3.52,.24,0x984d49);
      for(let j=0;j<8;j++)k.drum(s*(b.w/2-2.58)+s*j*.239,2.10,back+.62,.20,3.52,.20,j%2?0xad574e:0x904943);
      k.block(s*4.7,1.54,back+1,1,1.60,.73,ink);
      for(const h of [1.20,1.83])k.globe(s*4.7,h,back+1.39,.55,.55,.10,0x576962);
    }
  }else{
    for(const s of [-1,1]){
      const x=s*5.35;
      k.block(x,2.05,back+.22,2.88,1.75,.09,walnut);
      k.block(x,2.05,back+.29,2.71,1.60,.05,0xcfa674);
      for(let n=0;n<4;n++){
        const px=x+(n%2-.5)*1.07,h=1.73+Math.floor(n/2)*.68;
        k.block(px,h,back+.34,.81,.54,.021,[ivory,0x9bbcb1,0xe4ad82,0xe9d99a][n],(n%2-.5)*.13);
        for(let l=0;l<3;l++)k.block(px,h+(l-1)*.105,back+.36,.49-l*.05,.025,.012,ink);
      }
    }
  }
  if(studio||computer){
    const print=teachingPrint(computer);print.position.set(0,1.99,back+.31);props.add(print);
    for(const s of [-1,1])pottedFern(k,s*(b.w/2-.55),back+.71);
  }
  const group=k.finish();group.add(props);group.position.set(b.x,0,b.z);group.visible=false;return group;
}
