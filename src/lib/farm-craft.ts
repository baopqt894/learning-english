import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FARM_LAYOUT, FARM_FENCES } from './campus-spaces.ts';
import { seededRandom, createCampusSurfaces, worldAlignedUV } from './campus-surfaces.ts';
import { createCampusCharacter, animateCharacter } from './campus-character.ts';

/** Small opaque details share one colored mesh rather than hundreds of draw calls. */
class FarmBatch {
  private parts: THREE.BufferGeometry[] = [];
  add(geometry: THREE.BufferGeometry, color: number, position: THREE.Vector3, rotation = new THREE.Euler(), scale = new THREE.Vector3(1,1,1)) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    geometry.dispose();
    g.deleteAttribute('uv');
    g.applyMatrix4(new THREE.Matrix4().compose(position,new THREE.Quaternion().setFromEuler(rotation),scale));
    const c = new THREE.Color(color), colors = new Float32Array(g.attributes.position.count * 3);
    for(let i=0;i<colors.length;i+=3){colors[i]=c.r;colors[i+1]=c.g;colors[i+2]=c.b;}
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));
    this.parts.push(g);
  }
  box(w:number,h:number,d:number,c:number,x:number,y:number,z:number,rotation=new THREE.Euler()) {
    this.add(new RoundedBoxGeometry(w,h,d,1,Math.min(w,h,d)*.12),c,new THREE.Vector3(x,y,z),rotation);
  }
  sphere(r:number,c:number,x:number,y:number,z:number,scale=new THREE.Vector3(1,1,1)) {
    this.add(new THREE.SphereGeometry(r,10,7),c,new THREE.Vector3(x,y,z),undefined,scale);
  }
  rod(a:THREE.Vector3,b:THREE.Vector3,r:number,c:number) {
    this.add(new THREE.CylinderGeometry(r,r,a.distanceTo(b),7),c,a.clone().add(b).multiplyScalar(.5),new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize())));
  }
  finish() {
    const geometry=mergeGeometries(this.parts,false)!;
    this.parts.forEach(g=>g.dispose());this.parts=[];
    return geometry;
  }
}

/** Cupped, veined leaf with an irregular outline; no flat oval leaf impostors. */
function leafGeometry(length:number,width:number,cup:number) {
  const rows=8,cols=6,vertices:number[]=[],indices:number[]=[];
  for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
    const t=r/rows,u=c/cols*2-1;
    const outline=Math.pow(Math.sin(Math.PI*t),.65)*(1+.06*Math.sin(t*26));
    vertices.push(u*width*outline,cup*t*t+.045*u*u*Math.sin(t*Math.PI),t*length);
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const a=r*(cols+1)+c,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export type GardenCrop='lettuce'|'cabbage'|'carrot'|'bean'|'tomato';
export function createVegetableGeometry(kind:GardenCrop) {
  const batch=new FarmBatch(),v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
  if(kind==='lettuce'||kind==='cabbage'){
    const cabbage=kind==='cabbage';
    batch.rod(v(0,-.05,0),v(0,.17,0),.025,0x6c8844);
    batch.sphere(cabbage?.16:.09,cabbage?0xa7bd70:0x8aaa4e,0,.17,0,new THREE.Vector3(1,.95,1));
    for(let i=0;i<(cabbage?13:11);i++){
      const a=i*2.39996,inner=i>6,length=inner?.21:.34;
      batch.add(leafGeometry(length,inner?.11:.16,inner?(cabbage?.29:.26):.10),cabbage?(i%2?0x73985d:0x8eab65):(i%2?0x739945:0x91ae50),v(Math.sin(a)*.03,.07+Number(inner)*.04,Math.cos(a)*.03),new THREE.Euler(0,a,0));
      batch.rod(v(0,.085,0),v(Math.sin(a)*length*.8,.12+(inner?.15:.02),Math.cos(a)*length*.8),.006,0xb2c577);
    }
  }else if(kind==='carrot'){
    batch.add(new THREE.ConeGeometry(.065,.24,9),0xc97e35,v(0,.055,0),new THREE.Euler(Math.PI,0,0));
    for(let i=0;i<7;i++){
      const a=i*2.399,tip=v(Math.sin(a)*.15,.43+(i%3)*.06,Math.cos(a)*.15);
      batch.rod(v(0,.08,0),tip,.009,0x638c3d);
      for(let j=0;j<4;j++){
        const t=.4+j*.15,stem=tip.clone().multiplyScalar(t);
        for(const side of [-1,1])batch.add(leafGeometry(.13,.025,.035),j%2?0x83a64e:0x557c37,stem,new THREE.Euler(-.25,a+side*.8,0));
      }
    }
  }else if(kind==='tomato'){
    batch.rod(v(0,-.03,0),v(0,1.25,0),.018,0x617e36);
    for(let i=0;i<9;i++){const a=i*2.4,y=.2+i*.11;batch.add(leafGeometry(.28,.08,.04),i%2?0x577b37:0x789544,v(0,y,0),new THREE.Euler(-.3,a,0));if(i%2){const x=Math.sin(a)*.15,z=Math.cos(a)*.15;batch.rod(v(0,y,0),v(x,y-.05,z),.008,0x63853c);batch.sphere(.075,i<4?0xd6a04e:0xc96543,x,y-.11,z);}}
  }else{
    batch.rod(v(0,-.025,0),v(.06,1.15,0),.014,0x668d3d);
    for(let i=0;i<7;i++){
      const a=i*2.4,y=.15+i*.135;
      batch.add(leafGeometry(.25,.09,.035),i%2?0x668e46:0x86a655,v(.03,y,0),new THREE.Euler(-.35,a,0));
      if(i>2)batch.sphere(.04,0x9bad55,Math.sin(a)*.14,y-.07,Math.cos(a)*.14,new THREE.Vector3(.55,2.5,.55));
    }
  }
  return batch.finish();
}

/** Concept-led garden: open workshop, planted enclosure and live cadet helpers. */
export function createFarmCraft(root:THREE.Group) {
  const f=FARM_LAYOUT,b=new FarmBatch(),random=seededRandom(894),v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
  const wood=0x98794d,bamboo=0xa7ad70,olive=0x758257,metal=0x668c84,clay=[0xaa6b4e,0xb97c55,0x9f6349],soil=0x67523a;
  const cylinder=(r:number,h:number,c:number,x:number,y:number,z:number)=>b.add(new THREE.CylinderGeometry(r,r,h,12),c,v(x,y,z));
  const pot=(x:number,y:number,z:number,r=.12)=>{
    b.add(new THREE.CylinderGeometry(r,r*.75,r*1.5,12),0xae7954,v(x,y+r*.75,z));
    b.add(new THREE.TorusGeometry(r,.018,6,12),0xc28e62,v(x,y+r*1.5,z),new THREE.Euler(Math.PI/2,0,0));
    cylinder(r*.82,.012,soil,x,y+r*1.48,z);
  };
  const leaf=(x:number,y:number,z:number,a:number,size=.22)=>b.add(leafGeometry(size,size*.42,.04),random()>.5?0x75994e:0x8ba75d,v(x,y,z),new THREE.Euler(-.3,a,.2));
  const vine=(x:number,z:number,height:number)=>{
    let last=v(x,.12,z);
    for(let i=1;i<=18;i++){
      const t=i/18,point=v(x+Math.sin(t*13)*.12,.12+t*height,z+Math.cos(t*13)*.1);
      b.rod(last,point,.013,0x687d3d);leaf(point.x,point.y,point.z,t*17,.17+(i%3)*.025);last=point;
    }
  };
  // Gate faces the avenue. A clay-tile gable and wooden plaque match the concept.
  const g=f.gate;
  for(const side of [-1,1]){
    const z=g.z+side*g.width/2;
    b.box(.19,3.45,.19,olive,g.x,1.75,z);
    for(let row=0;row<4;row++)b.box(.38,.13,.38,clay[row%3],g.x,.1+row*.145,z);
    b.box(.43,.07,.43,0xbaa77e,g.x,.65,z);
    b.rod(v(g.x,2.95,z),v(g.x,3.4,z-side*.6),.055,wood);
    // Open bamboo leaf lies alongside the passage, never across the route.
    for(let i=0;i<7;i++){const leafZ=z+side*(.1+i*.16);b.rod(v(g.x+.2,.2,leafZ),v(g.x+.2,1.16,leafZ),.045,olive);}
    for(const y of [.35,.95])b.box(.09,.08,1.18,wood,g.x+.2,y,z+side*.6);
    vine(g.x-.13,z+side*.08,2.8);
  }
  b.box(.22,.16,3.65,wood,g.x,3.46,g.z);
  for(const side of [-1,1]){
    b.box(1.04,.07,3.88,0x9f5e43,g.x+side*.45,3.71,g.z,new THREE.Euler(0,0,-side*.47));
    for(let line=0;line<17;line++)for(let course=0;course<3;course++){
      const a=course/3,c=(course+1)/3,z=g.z-1.84+line*.23;
      b.rod(v(g.x+side*a*.94,3.98-a*.48,z),v(g.x+side*c*.94,3.98-c*.48,z),.095,clay[(line+course)%3]);
    }
  }
  b.rod(v(g.x,4.03,g.z-2),v(g.x,4.03,g.z+2),.12,0xba7650);
  const plaqueCanvas=document.createElement('canvas');plaqueCanvas.width=768;plaqueCanvas.height=256;
  const pc=plaqueCanvas.getContext('2d')!;pc.fillStyle='#755936';pc.fillRect(0,0,768,256);
  pc.strokeStyle='#ac8550';pc.lineWidth=2;for(let y=25;y<256;y+=38){pc.beginPath();pc.moveTo(0,y);pc.lineTo(768,y+6);pc.stroke();}
  pc.strokeStyle='#d4b77c';pc.lineWidth=8;pc.beginPath();pc.roundRect(12,12,744,232,35);pc.stroke();
  pc.fillStyle='#fff0c5';pc.textAlign='center';pc.font='bold 72px Georgia, serif';pc.fillText('VEGETABLE',384,112);pc.fillText('GARDEN',384,198);
  const plaqueMap=new THREE.CanvasTexture(plaqueCanvas);plaqueMap.colorSpace=THREE.SRGBColorSpace;
  const plaque=new THREE.Mesh(new THREE.BoxGeometry(.09,g.headerHeight,2.4),new THREE.MeshStandardMaterial({map:plaqueMap,roughness:.9}));plaque.position.set(g.x-.99,g.height,g.z);root.add(plaque);
  for(const side of [-1,1])b.rod(v(g.x-.06,3.48,g.z+side*1.02),v(g.x-.99,g.height+.22,g.z+side*1.02),.023,wood);
  // Brick plinth, green bamboo pickets, lashings and rails around the enclosure.
  for(const fence of FARM_FENCES){
    const horizontal=fence.w>fence.d,length=Math.max(fence.w,fence.d),courses=Math.ceil(length/.36),posts=Math.ceil(length/1.3);
    for(let row=0;row<3;row++)for(let i=0;i<courses;i++){
      const t=(i+.5)/courses-.5,step=length/courses;
      b.box(horizontal?step-.012:.26,.105,horizontal?.26:step-.012,clay[(i+row)%3],fence.x+(horizontal?t*length:0),.085+row*.115,fence.z+(horizontal?0:t*length));
    }
    b.box(fence.w,.045,fence.d,0xb39f78,fence.x,.37,fence.z);
    for(let i=0;i<=posts;i++){
      const t=i/posts-.5,x=fence.x+(horizontal?t*length:0),z=fence.z+(horizontal?0:t*length);
      b.rod(v(x,.38,z),v(x,1.26,z),.055,bamboo);
      for(const y of [.65,1.13])cylinder(.061,.035,0x8d9360,x,y,z);
    }
    const pickets=Math.floor(length/.19);
    for(let i=0;i<pickets;i++){
      const t=(i+.5)/pickets-.5,x=fence.x+(horizontal?t*length:0),z=fence.z+(horizontal?0:t*length);
      b.rod(v(x,.4,z),v(x,1.08+(i%3)*.025,z),.038,i%3?olive:0x8f9a68);
    }
    for(const y of [.61,1.03]){
      b.rod(v(fence.x-(horizontal?length/2:0),y,fence.z-(horizontal?0:length/2)),v(fence.x+(horizontal?length/2:0),y,fence.z+(horizontal?0:length/2)),.045,bamboo);
    }
  }
  // Individual bed bricks, with enough border to hold the soil below the coping.
  for(const bed of [...f.beds,...f.reserve])for(let course=0;course<2;course++)for(const side of [-1,1]){
    const across=Math.ceil(bed.w/.34),along=Math.ceil((bed.d-.26)/.34),y=.14+course*.145;
    for(let i=0;i<across;i++)b.box(bed.w/across-.012,.13,.13,clay[(i+course)%3],bed.x-bed.w/2+(i+.5)*bed.w/across,y,bed.z+side*(bed.d/2-.065));
    for(let i=0;i<along;i++)b.box(.13,.13,(bed.d-.26)/along-.012,clay[(i+course+1)%3],bed.x+side*(bed.w/2-.065),y,bed.z-(bed.d-.26)/2+(i+.5)*(bed.d-.26)/along);
  }
  // Warm gravel instead of a bare dirt rectangle; keep planting and circulation distinct.
  const solid=[...f.beds,...f.reserve,f.tools,f.harvest,f.nursery,f.waterStore,f.compost];
  for(let i=0;i<1100;i++){
    const x=f.bounds.minX+.3+random()*(f.bounds.maxX-f.bounds.minX-.6),z=f.bounds.minZ+.3+random()*(f.bounds.maxZ-f.bounds.minZ-.6);
    if(solid.some(p=>Math.abs(x-p.x)<p.w/2+.05&&Math.abs(z-p.z)<p.d/2+.05))continue;
    b.sphere(.018+random()*.025,i%3?0xaca387:0xc3b89a,x,.075,z,new THREE.Vector3(1,.4,.7+random()*.5));
  }
  for(let i=0;i<17;i++)b.box(.6,.028,.7,i%2?0xb5ab90:0xc1b69a,f.bounds.minX+.8+i*.91,.08,f.aisle.z+(i%2?.045:-.045),new THREE.Euler(0,(random()-.5)*.06,0));
  for(let i=0;i<4;i++)b.box(.63,.03,.7,0xb9ae91,f.sideAisle.x,.085,f.sideAisle.z-.85+i*.65);
  // Open-front potting shed: boarded rear and west wall; generous walkable front.
  const sh=f.shed;
  for(let i=0;i<17;i++)b.box(sh.w/17-.008,.055,sh.d,0x95805a,sh.x-sh.w/2+(i+.5)*sh.w/17,.10,sh.z);
  for(let i=0;i<20;i++){
    const x=sh.x-sh.w/2+(i+.5)*sh.w/20;
    b.box(sh.w/20-.008,2.78,.09,i%3?olive:0x697b50,x,1.49,sh.z-sh.d/2);
    if(i%2)b.rod(v(x, .25,sh.z-sh.d/2+.05),v(x+.008,2.6,sh.z-sh.d/2+.05),.005,0x879363);
  }
  for(let i=0;i<14;i++)b.box(.09,2.78,sh.d/14-.008,i%2?olive:0x879363,sh.x-sh.w/2,1.49,sh.z-sh.d/2+(i+.5)*sh.d/14);
  for(const side of [-1,1])b.box(.14,2.95,.14,wood,sh.x+side*(sh.w/2-.04),1.58,sh.z+sh.d/2-.04);
  b.box(sh.w+.18,.16,.16,wood,sh.x,2.95,sh.z+sh.d/2);
  b.box(sh.w+.42,.075,sh.d+.5,0x6a8b70,sh.x,sh.height+.12,sh.z,new THREE.Euler(.105,0,0));
  for(let i=0;i<20;i++){
    const x=sh.x-(sh.w+.35)/2+i*(sh.w+.35)/19;
    b.rod(v(x,sh.height+.32,sh.z-sh.d/2-.24),v(x,sh.height-.04,sh.z+sh.d/2+.24),.035,i%2?0x8aab8c:0x779b80);
  }
  b.rod(v(sh.x-sh.w/2-.18,sh.height+.36,sh.z-sh.d/2-.24),v(sh.x+sh.w/2+.18,sh.height+.36,sh.z-sh.d/2-.24),.045,0x93b398);
  // Shelves hold sacks, pots and seed envelopes; tools hang from the back wall.
  const rack=f.tools;
  for(const y of [.45,1.28,2.15])b.box(2.35,.07,.48,wood,rack.x,y,rack.z);
  for(const dx of [-1.1,1.1])b.box(.07,2,.07,wood,rack.x+dx,1.15,rack.z+.15);
  for(let i=0;i<3;i++){
    const x=rack.x-.72+i*.7;
    b.sphere(.25,0xc1ae80,x,.78,rack.z,new THREE.Vector3(.9,1.1,.7));
    b.box(.26,.34,.06,0xd0b889,x,1.57,rack.z-.06);
    b.box(.16,.11,.01,0x71924a,x,1.59,rack.z-.02);
    pot(x,1.32,rack.z+.1,.12);
  }
  for(let i=0;i<3;i++){
    const x=sh.x-1.22+i*.4,z=sh.z-sh.d/2+.16;
    b.rod(v(x,.62,z),v(x,1.8,z),.024,wood);b.rod(v(x,1.79,z),v(x,1.79,z+.13),.016,0xc6b17c);
    if(i===2){b.box(.35,.045,.05,metal,x,.62,z);for(let j=0;j<6;j++)b.box(.015,.12,.025,metal,x-.14+j*.055,.56,z);}
    else b.box(.24,.22,.045,metal,x,.61,z+.025,new THREE.Euler(i===0?.4:0,0,0));
  }
  const p=f.potting;
  b.box(p.w,.08,p.d,wood,p.x,.94,p.z);
  for(const dx of [-.24,.24])for(const dz of [-.6,.6])b.box(.06,.84,.06,olive,p.x+dx,.49,p.z+dz);
  for(let i=0;i<5;i++)pot(p.x,.99,p.z-.5+i*.24,.085);
  // Nursery trays, an attached slatted bench and shade cloth between workshop and fence.
  const n=f.nursery;
  b.box(n.w,.075,n.d,wood,n.x,.85,n.z);
  for(const dx of [-.5,.5])for(const dz of [-.45,.45])b.box(.06,.78,.06,olive,n.x+dx,.47,n.z+dz);
  for(let row=0;row<2;row++){
    const z=n.z-.28+row*.56;b.box(1.06,.055,.48,0x4d6950,n.x,.925,z);
    for(let i=0;i<10;i++){const x=n.x-.42+(i%5)*.21,pz=z-.12+Math.floor(i/5)*.24;pot(x,.95,pz,.065);leaf(x,1.05,pz,Math.PI/2,.09);leaf(x,1.05,pz,-Math.PI/2,.09);}
  }
  for(const x of [n.x-.58,n.x+.58])b.rod(v(x,.12,n.z+.48),v(x,1.95,n.z+.48),.026,wood);
  const netGeometry=new THREE.PlaneGeometry(n.w+.15,n.d+.35,10,6),netPos=netGeometry.attributes.position;
  for(let i=0;i<netPos.count;i++){const x=netPos.getX(i),z=netPos.getY(i);netPos.setXYZ(i,n.x+x,1.93+.08*Math.abs(x)-.08*Math.cos(z*3),n.z+z);}
  netGeometry.computeVertexNormals();
  const netCanvas=document.createElement('canvas');netCanvas.width=netCanvas.height=32;const nc=netCanvas.getContext('2d')!;nc.strokeStyle='#5c6b50';nc.lineWidth=2;
  for(let i=0;i<=32;i+=8){nc.beginPath();nc.moveTo(i,0);nc.lineTo(i,32);nc.moveTo(0,i);nc.lineTo(32,i);nc.stroke();}
  const netMap=new THREE.CanvasTexture(netCanvas);netMap.colorSpace=THREE.SRGBColorSpace;netMap.wrapS=netMap.wrapT=THREE.RepeatWrapping;netMap.repeat.set(6,6);
  root.add(new THREE.Mesh(netGeometry,new THREE.MeshStandardMaterial({map:netMap,alphaTest:.12,transparent:true,side:THREE.DoubleSide,depthWrite:false,roughness:1})));
  // Mature climbers grow against rear bamboo supports, outside all task approaches.
  const cropMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,side:THREE.DoubleSide});
  for(const bed of f.climbers){
    b.box(bed.w,.23,bed.d,clay[1],bed.x,.16,bed.z);
    for(const side of [-1,1])b.rod(v(bed.x+side*(bed.w/2-.1),.12,bed.z),v(bed.x+side*(bed.w/2-.1),2.35,bed.z),.034,bamboo);
    for(const y of [.65,1.25,1.85,2.3])b.rod(v(bed.x-bed.w/2,y,bed.z),v(bed.x+bed.w/2,y,bed.z),.023,bamboo);
    const geometry=createVegetableGeometry(bed.kind);
    for(let i=0;i<5;i++){const plant=new THREE.Mesh(geometry,cropMaterial);plant.position.set(bed.x-bed.w/2+.25+i*(bed.w-.5)/4,.29,bed.z);plant.scale.setScalar(1.45);plant.castShadow=plant.receiveShadow=true;root.add(plant);}
  }
  // Raised water tank, plumbing and separate vented compost bin mirror the concept.
  const s=f.waterStore,t=f.tap,c=f.compost;
  b.box(s.w,.12,s.d,0xa9aa8a,s.x,.1,s.z);
  b.box(1.5,.5,1.3,0xc7c7ac,s.x,.42,s.z);
  b.add(new THREE.CylinderGeometry(.68,.7,1.35,28),0x88aaa2,v(s.x,1.35,s.z));
  cylinder(.7,.07,0xa1b7a6,s.x,2.05,s.z);cylinder(.17,.08,metal,s.x,2.125,s.z);
  for(const y of [.84,1.3,1.84])b.add(new THREE.TorusGeometry(.69,.025,6,28),0xbbc9b1,v(s.x,y,s.z),new THREE.Euler(Math.PI/2,0,0));
  b.rod(v(s.x,.78,s.z+.65),v(s.x,.78,t.z),.038,metal);b.rod(v(t.x,.4,t.z),v(t.x,.78,t.z),.038,metal);
  const reelX=s.x-.85;for(let i=0;i<5;i++)b.add(new THREE.TorusGeometry(.31+i*.014,.023,6,24),0x577f67,v(reelX,.89+i*.01,s.z+.1),new THREE.Euler(0,Math.PI/2,0));
  b.box(.55,.04,.35,0x63776b,t.x,.095,t.z+.54);for(let i=0;i<7;i++)b.box(.015,.01,.29,0xb0baa0,t.x-.21+i*.07,.12,t.z+.54);
  const supplyZ=f.bounds.minZ+.2;b.rod(v(18,.13,supplyZ),v(s.x,.13,supplyZ),.027,metal);b.rod(v(s.x,.13,supplyZ),v(s.x,.13,s.z),.027,metal);
  for(let row=0;row<7;row++)for(const side of [-1,1]){
    b.box(c.w,.065,.045,wood,c.x,.15+row*.11,c.z+side*(c.d/2-.025));b.box(.045,.065,c.d,wood,c.x+side*(c.w/2-.025),.15+row*.11,c.z);
  }
  for(const dx of [-.4,.4])for(const dz of [-.58,.58])b.box(.075,.84,.075,olive,c.x+dx,.47,c.z+dz);
  for(let i=0;i<32;i++){const x=c.x+(random()-.5)*.65,z=c.z+(random()-.5)*1.05;b.sphere(.06,i%2?0x7d813f:0x9b9057,x,.78+random()*.08,z,new THREE.Vector3(1,.45,1));}
  // Harvest station, oriented across the front corner, with real storage below its top.
  const h=f.harvest;
  for(let i=0;i<6;i++)b.box(h.w,.035,(h.d-.06)/6-.008,i%2?0xae8e58:0xbd9c65,h.x,.80,h.z-(h.d-.06)/2+(i+.5)*(h.d-.06)/6);
  b.box(h.w-.15,.07,.07,wood,h.x,.56,h.z-.4);b.box(h.w-.15,.07,.07,wood,h.x,.56,h.z+.4);
  for(let level=0;level<2;level++)for(let cell=0;cell<3;cell++){
    const x=h.x-.77+cell*.77,y=.13+level*.23;
    b.box(.62,.025,.6,cell===0?0xc6a15d:0x648664,x,y,h.z);
    for(let slat=0;slat<2;slat++)for(const side of [-1,1]){const col=cell===0?0xc6a15d:0x76966c;b.box(.64,.055,.03,col,x,y+.05+slat*.1,h.z+side*.28);b.box(.03,.055,.56,col,x+side*.3,y+.05+slat*.1,h.z);}
  }
  b.box(.45,.07,.42,olive,h.x-.76,.86,h.z);b.box(.26,.22,.24,0x9aac85,h.x-.76,1,h.z);
  b.add(new THREE.CylinderGeometry(.23,.23,.035,16),0xd0d5b9,v(h.x-.76,1.14,h.z));
  b.add(new THREE.CylinderGeometry(.1,.1,.035,16),0xf0dfb9,v(h.x-.76,1.015,h.z-.14),new THREE.Euler(Math.PI/2,0,0));
  b.rod(v(h.x-.76,1.015,h.z-.162),v(h.x-.72,1.06,h.z-.162),.006,0x615738);
  for(const side of [-1,1]){b.box(.23,.025,.32,0xe3d7b1,h.x-.05+side*.12,.84,h.z+.03,new THREE.Euler(0,0,side*.06));for(let line=0;line<5;line++)b.box(.17,.003,.006,0x8e9670,h.x-.05+side*.12,.86,h.z-.08+line*.045);}
  b.rod(v(h.x-.25,.87,h.z+.13),v(h.x+.12,.87,h.z-.03),.01,0x5a7547);
  // Flowers and vine foliage soften the foreground fence and gate without filling the aisle.
  const border=f.frontBorder;b.box(border.w,.18,border.d,clay[1],border.x,.13,border.z);
  for(let i=0;i<35;i++){
    const x=border.x-border.w/2+.2+i*(border.w-.4)/34,z=border.z+(random()-.5)*.1;
    for(let j=0;j<3;j++)leaf(x,.25,z,j*2.4,.18);
    if(i%3===0){b.rod(v(x,.23,z),v(x,.55,z),.012,olive);for(let j=0;j<5;j++)b.sphere(.035,i%2?0xd9b759:0xc77770,x+Math.sin(j*1.256)*.045,.55,z+Math.cos(j*1.256)*.045);}
  }
  const geometry=b.finish();geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));worldAlignedUV(geometry,new THREE.Vector3(),.7);
  const material=createCampusSurfaces()('stone',0xffffff);material.vertexColors=true;material.side=THREE.DoubleSide;material.bumpScale=.012;
  const details=new THREE.Mesh(geometry,material);details.name='Concept garden · architecture and details';details.castShadow=details.receiveShadow=true;root.add(details);
  // Cadets work only on reserve crops and the potting bench; they never advance the player's tasks.
  const helpers=f.helpers.map(cfg=>{const rig=createCampusCharacter(cfg.kind);rig.group.scale.setScalar(.8);rig.group.position.set(cfg.x,.13,cfg.z);root.add(rig.group);return rig;});
  helpers[1].group.rotation.y=Math.PI/2;
  const helperCan=new THREE.Group();root.add(helperCan);
  const canMaterial=new THREE.MeshStandardMaterial({color:0x88b1a5,roughness:.8});
  const canBody=new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,.28,16),canMaterial);canBody.position.y=-.12;helperCan.add(canBody);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.16,.022,6,16),canMaterial);handle.position.set(0,.08,0);handle.rotation.y=Math.PI/2;helperCan.add(handle);
  const spout=new THREE.Mesh(new THREE.CylinderGeometry(.025,.055,.42,10),canMaterial);spout.position.set(0,-.02,.3);spout.rotation.x=Math.PI/2;helperCan.add(spout);
  const rose=new THREE.Mesh(new THREE.CylinderGeometry(.07,.045,.05,10),canMaterial);rose.position.set(0,-.02,.53);rose.rotation.x=Math.PI/2;helperCan.add(rose);
  const seedPot=new THREE.Mesh(new THREE.CylinderGeometry(.08,.06,.13,12),new THREE.MeshStandardMaterial({color:0xac7851,roughness:.9}));seedPot.position.set(0,-.29,.07);helpers[1].elbows[1].add(seedPot);
  const waterPositions=new Float32Array(54),waterGeometry=new THREE.BufferGeometry();waterGeometry.setAttribute('position',new THREE.BufferAttribute(waterPositions,3));
  const water=new THREE.Points(waterGeometry,new THREE.PointsMaterial({color:0xc0e1d7,size:.04,transparent:true,opacity:.65,depthWrite:false}));water.frustumCulled=false;root.add(water);
  const hand=new THREE.Vector3(),outlet=new THREE.Vector3(),waterEnd=v(f.reserve[1].x,.45,f.reserve[1].z);
  function update(time:number,reduced:boolean){
    for(const [i,rig] of helpers.entries()){
      animateCharacter(rig,time+i*1.7,false,reduced);const sway=reduced?0:Math.sin(time*1.7+i)*.06;
      rig.body.rotation.x=i?.12:.05;rig.head.rotation.x=.15+sway*.2;rig.rightArm.rotation.x=-.95+sway;rig.leftArm.rotation.x=-.65;rig.elbows.forEach(e=>e.rotation.x=-.55);rig.group.updateMatrixWorld(true);
    }
    hand.set(0,-.29,.04);helpers[0].elbows[1].localToWorld(hand);helperCan.position.copy(hand);helperCan.rotation.set(.3,0,0);helperCan.updateMatrixWorld(true);
    outlet.set(0,-.02,.55);helperCan.localToWorld(outlet);water.visible=!reduced;
    if(!reduced){for(let i=0;i<18;i++){const t=(time*.9+i/18)%1;waterPositions[i*3]=THREE.MathUtils.lerp(outlet.x,waterEnd.x+(i%3-.8)*.08,t);waterPositions[i*3+1]=THREE.MathUtils.lerp(outlet.y,waterEnd.y,t*t);waterPositions[i*3+2]=THREE.MathUtils.lerp(outlet.z,waterEnd.z,t);}waterGeometry.attributes.position.needsUpdate=true;}
  }
  update(0,true);
  return {update};
}
