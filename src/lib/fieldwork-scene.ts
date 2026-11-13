import * as THREE from 'three';
import { STUDY_DESK, STUDY_POSITION } from './campus-map';
import { FARM_LAYOUT } from './campus-spaces';
import { createCampusSurfaces, worldAlignedUV } from './campus-surfaces';
import { createFarmCraft, createVegetableGeometry } from './farm-craft';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CampusCharacter } from './campus-character';
import { WORK_STATIONS, nextWorkTask, type Fieldwork, type Tool, type WorkKind } from './fieldwork';

/** Dynamic work props are separate from the static campus batches. All geometry is reused. */
export function createFieldworkScene(scene:THREE.Scene,player:CampusCharacter){
  const root=new THREE.Group();scene.add(root);const finishes=createCampusSurfaces();
  const mats=new Map<number,THREE.MeshStandardMaterial>();
  const mat=(color:number)=>{if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));return mats.get(color)!;};
  const mesh=(g:THREE.BufferGeometry,c:number,p:THREE.Object3D,x=0,y=0,z=0)=>{const m=new THREE.Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;};
  const box=(w:number,h:number,d:number,c:number,p:THREE.Object3D,x=0,y=0,z=0)=>mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.15),c,p,x,y,z);
  const sphere=(r:number,c:number,p:THREE.Object3D,x=0,y=0,z=0)=>mesh(new THREE.SphereGeometry(r,10,8),c,p,x,y,z);
  const rod=(a:THREE.Vector3,b:THREE.Vector3,r:number,c:number,p:THREE.Object3D)=>{const m=mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),8),c,p);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());return m;};
  const sign=(text:string,x:number,y:number,z:number,width=1.9,turn=0,supports=true)=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#ded1a4';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#839061';ctx.lineWidth=6;ctx.strokeRect(5,5,502,118);ctx.fillStyle='#354b31';ctx.font='bold 38px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64,480);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const board=new THREE.Mesh(new THREE.BoxGeometry(width,.28,.035),new THREE.MeshStandardMaterial({map:texture,roughness:1}));board.position.set(x,y,z);root.add(board);
    board.rotation.y=turn;
    const half=width*(turn?.5:.35),dx=Math.cos(turn)*half,dz=-Math.sin(turn)*half;
    if(supports){rod(new THREE.Vector3(x-dx,.05,z-dz),new THREE.Vector3(x-dx,y,z-dz),.035,0x8b724d,root);
    rod(new THREE.Vector3(x+dx,.05,z+dz),new THREE.Vector3(x+dx,y,z+dz),.035,0x8b724d,root);}

  };
  const farm=FARM_LAYOUT,bounds=farm.bounds;
  const ground=box(bounds.maxX-bounds.minX,.07,bounds.maxZ-bounds.minZ,0xb1a489,root,farm.center.x,.005,farm.center.z);
  worldAlignedUV(ground.geometry,ground.position,.75);ground.material=finishes('stone',0xb6ab8e);
  for(const path of [farm.aisle,farm.sideAisle,farm.tapAccess]){
    const slab=box(path.w,.025,path.d,0xbfb294,root,path.x,.06,path.z);worldAlignedUV(slab.geometry,slab.position,.75);slab.material=finishes('stone',0xbfb294);
  }
  box(2.9,.025,2.15,0xbfb294,root,16.5,.06,farm.gate.z);
  const plantGeometry=createVegetableGeometry('lettuce');
  const plantMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,side:THREE.DoubleSide});
  const crops:THREE.Group[][]=[],seeds:THREE.Mesh[][]=[],soils:THREE.Mesh[]=[],furrows:THREE.Group[]=[];
  for(let i=0;i<3;i++){
    const {x,z,w,d}=farm.beds[i];
    const plot=new THREE.Group();plot.position.set(x,.13,z);root.add(plot);plot.userData.station=`bed-${i}`;
    box(w-.13,.18,d-.13,0x69563b,plot,0,.04,0);
    const soil=box(w-.25,.13,d-.25,0x8a6947,plot,0,.14,0);soil.material=finishes('clay',0x8a6947).clone();soils.push(soil);
    const rows=new THREE.Group();plot.add(rows);furrows.push(rows);
    for(let r=0;r<7;r++){const ridge=sphere(1,r%2?0x795b3b:0x705335,rows,0,.207,-d/2+.4+r*(d-.8)/6);ridge.scale.set(w/2-.2,.018,.055);}
    for(let p=0;p<24;p++){const pebble=sphere(.023,0xaf9672,plot,Math.sin(p*7.3)*(w/2-.22),.22,Math.cos(p*4.8)*(d/2-.2));pebble.scale.y=.5;}
    const plants:THREE.Group[]=[],bedSeeds:THREE.Mesh[]=[];
    for(let n=0;n<28;n++){
      const px=-w/2+.55+(n%4)*(w-1.1)/3,pz=-d/2+.5+Math.floor(n/4)*(d-1)/6;
      const seed=sphere(.028,0xd0af6a,plot,px,.219,pz);seed.scale.set(1,.5,1.4);bedSeeds.push(seed);
      const plant=new THREE.Group();plant.position.set(px,.24,pz);plot.add(plant);plants.push(plant);
      const leaves=new THREE.Mesh(plantGeometry,plantMaterial);leaves.castShadow=leaves.receiveShadow=true;plant.add(leaves);
    }
    crops.push(plants);seeds.push(bedSeeds);sign(`BED ${i+1}`,x+w/2-.55,.55,z-d/2+.06,.9);
  }
  for(const [index,bed] of farm.reserve.entries()){
    const geometry=createVegetableGeometry((['cabbage','carrot','lettuce'] as const)[index%3]);
    box(bed.w-.15,.19,bed.d-.15,0x6e5b3e,root,bed.x,.14,bed.z);
    const soil=box(bed.w-.25,.07,bed.d-.25,0x695b3d,root,bed.x,.25,bed.z);soil.material=finishes('clay',0x695b3d);
    const cols=5,rows=Math.max(3,Math.floor(bed.d/.55)),count=cols*rows;
    for(let n=0;n<count;n++){const plant=new THREE.Mesh(geometry,plantMaterial);plant.scale.setScalar(index===1?1:.97);plant.position.set(bed.x-bed.w/2+.5+(n%cols)*(bed.w-1)/(cols-1),.3,bed.z-bed.d/2+.4+Math.floor(n/cols)*(bed.d-.8)/(rows-1));plant.castShadow=plant.receiveShadow=true;root.add(plant);}
    sign(['CABBAGE','CARROTS','GREENS'][index%3],bed.x+bed.w/2-.6,.54,bed.z+bed.d/2-.04,.9);
  }
  const tap=farm.tap;
  box(.66,.12,.6,0xaaa995,root,tap.x,.16,tap.z);box(.38,.72,.25,0xc1c4a9,root,tap.x,.55,tap.z);
  rod(new THREE.Vector3(tap.x,.5,tap.z),new THREE.Vector3(tap.x,1.21,tap.z),.04,0x718d8c,root);
  rod(new THREE.Vector3(tap.x,1.21,tap.z),new THREE.Vector3(tap.spout.x,1.21,tap.spout.z),.035,0x718d8c,root);
  box(.24,.035,.04,0xa35c43,root,tap.x,1.23,tap.z);
  sign('WATER · 3 L',farm.waterStore.x,.46,farm.waterStore.z+.68,1.2,0,false);
  sign('TOOLS & SEEDS',farm.shed.x,2.58,farm.shed.z-farm.shed.d/2+.075,2,0,false);
  const harvest=farm.harvest;
  box(harvest.w,.08,harvest.d,0xa58a5d,root,harvest.x,.75,harvest.z);
  for(const dx of [-.98,.98])for(const dz of [-.4,.4])box(.075,.64,.075,0x64765c,root,harvest.x+dx,.4,harvest.z+dz);
  sign('HARVEST LOG',harvest.x,.6,harvest.z-harvest.d/2-.02,1.4,0,false);
  const baskets:THREE.Group[]=[],basketContents:THREE.Group[]=[];
  function makeBasket(parent:THREE.Object3D){
    const g=new THREE.Group();parent.add(g);
    const base=mesh(new THREE.CylinderGeometry(.34,.25,.32,16),0xb89a5e,g,0,.16,0);base.material=finishes('bark',0xb89a5e);
    for(let row=0;row<5;row++){const rim=mesh(new THREE.TorusGeometry(.26+row*.019,.016,6,16),0xc4a86c,g,0,.025+row*.072,0);rim.rotation.x=Math.PI/2;}
    mesh(new THREE.TorusGeometry(.31,.024,6,16,Math.PI),0x9d7e48,g,0,.32,0);return g;
  }
  for(let i=0;i<3;i++){
    const basket=makeBasket(root);basket.scale.setScalar(i<2?.55:.8);basket.position.set(harvest.x-.77+i*.77,i<2?.39:.84,harvest.z);baskets.push(basket);
    const contents=new THREE.Group();basket.add(contents);basketContents.push(contents);
    for(let leaf=0;leaf<4;leaf++){const vegetable=new THREE.Mesh(plantGeometry,plantMaterial);vegetable.scale.setScalar(.4);vegetable.position.set((leaf%2-.5)*.25,.32,Math.floor(leaf/2)*.2-.1);contents.add(vegetable);}
  }
  // Open dormitory B. Real bed frame, mattress, pillow and a subdivided cloth sheet.
  const bx=-29.2,bz=-3.1;
  for(const x of [bx-.58,bx+.58])for(const z of [bz-1.05,bz+1.05])box(.065,.66,.065,0x53655b,root,x,.5,z);
  box(1.35,.12,2.45,0x52675b,root,bx,.72,bz);box(1.28,.18,2.32,0xd9d5bf,root,bx,.86,bz);box(1.3,.65,.08,0x53655b,root,bx,1.1,bz-1.15);
  box(.75,.13,.42,0xe8e0c7,root,bx,.99,bz-.86);
  const clothGeo=new THREE.PlaneGeometry(1.18,1.85,16,24);clothGeo.rotateX(-Math.PI/2);
  const fabricCanvas=document.createElement('canvas');fabricCanvas.width=fabricCanvas.height=64;const fabricContext=fabricCanvas.getContext('2d')!;
  const fabricPixels=fabricContext.createImageData(64,64);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){const v=220+((x+y)%2)*17+((x*13+y*7)%11);const i=(y*64+x)*4;fabricPixels.data[i]=fabricPixels.data[i+1]=fabricPixels.data[i+2]=v;fabricPixels.data[i+3]=255;}
  fabricContext.putImageData(fabricPixels,0,0);const clothTexture=new THREE.CanvasTexture(fabricCanvas);clothTexture.wrapS=clothTexture.wrapT=THREE.RepeatWrapping;clothTexture.repeat.set(7,10);clothTexture.colorSpace=THREE.SRGBColorSpace;
  const clothMaterial=mat(0x71815c);clothMaterial.map=clothTexture;clothMaterial.bumpMap=clothTexture;clothMaterial.bumpScale=.006;
  const blanket=mesh(clothGeo,0x71815c,root,bx,1.02,bz+.17);(blanket.material as THREE.MeshStandardMaterial).side=THREE.DoubleSide;
  const original=Float32Array.from(clothGeo.attributes.position.array);
  const folded=box(.58,.16,.85,0x71815c,root,bx-.295,1.05,bz-.2925);box(.59,.018,.86,0x9da782,folded,0,.065,0);folded.visible=false;
  const dust:THREE.Group[]=[];
  for(let i=0;i<3;i++){const station=WORK_STATIONS.find(s=>s.id===`dust-${i}`)!;const group=new THREE.Group();group.position.set(station.x,.305,station.z);root.add(group);group.userData.station=station.id;dust.push(group);
    for(let j=0;j<24;j++){const l=mesh(new THREE.CircleGeometry(.065,5),j%2?0xa98145:0xbfa06c,group,Math.sin(j*6.7)*.5,.003,Math.cos(j*3.2)*.3);l.rotation.x=-Math.PI/2;l.rotation.z=j;}
  }
  const pan=box(.48,.035,.45,0x5d7778,root,-27,.29,-.7);box(.5,.1,.035,0x6e8582,pan,0,.035,-.2);
  // Table and shelf correspond to navigation obstacles, with moving book props.
  box(1.35,.12,1.1,0xa78a5d,root,-24.6,1,-3.7);for(const x of [-25.15,-24.05])for(const z of [-4.1,-3.3])box(.06,.8,.06,0x53655b,root,x,.58,z);
  box(.75,1.6,.05,0x8c7656,root,-24.1,1,-1.8);for(const x of [-24.45,-23.75])box(.06,1.6,.65,0x8c7656,root,x,1,-1.5);for(const y of [.5,1,1.5])box(.8,.055,.7,0xc7ad7b,root,-24.1,y,-1.5);
  const tableBooks=new THREE.Group();tableBooks.position.set(-24.6,1.11,-3.7);root.add(tableBooks);
  function addBooks(parent:THREE.Object3D){for(let j=0;j<3;j++){box(.42,.075,.3,[0x93644c,0x4f7366,0xb59d63][j],parent,0,j*.09,0);box(.38,.04,.27,0xe7d9b3,parent,.012,j*.09+.025,.012);}}
  addBooks(tableBooks);const shelfBooks=new THREE.Group();shelfBooks.position.set(-24.1,1.04,-1.5);root.add(shelfBooks);addBooks(shelfBooks);
  sign('DUTY · CLEAN & CARE',-23.8,1.7,.8,2.6);
  const toolRoot=new THREE.Group();scene.add(toolRoot);const tools={} as Record<Tool,THREE.Group>;
  for(const key of ['hands','hoe','seeds','can','basket','broom'] as Tool[]){const g=new THREE.Group();toolRoot.add(g);tools[key]=g;}
  rod(new THREE.Vector3(),new THREE.Vector3(0,0,1.2),.025,0xba925c,tools.hoe);box(.34,.045,.23,0x63736a,tools.hoe,0,-.02,1.17).rotation.x=.4;
  rod(new THREE.Vector3(),new THREE.Vector3(0,0,1.25),.023,0xae8d5c,tools.broom);for(let j=0;j<15;j++)rod(new THREE.Vector3((j-7)*.018,0,1.12),new THREE.Vector3((j-7)*.025,0,1.5),.012,j%2?0xd2b77d:0xb99e62,tools.broom);
  // Grip the shaft partway down: the bristles/blade land on the floor instead of below it.
  for(const part of tools.broom.children)part.position.z-=.5;
  for(const part of tools.hoe.children)part.position.z-=.2;
  const can=tools.can;mesh(new THREE.CylinderGeometry(.2,.24,.38,16),0x7da3a0,can,0,0,.1);rod(new THREE.Vector3(.12,0,.12),new THREE.Vector3(0,.05,.72),.055,0x82aba7,can);const rose=mesh(new THREE.CylinderGeometry(.11,.07,.06,12),0xaac3b8,can,0,.05,.74);rose.rotation.x=Math.PI/2;const canHandle=mesh(new THREE.TorusGeometry(.23,.025,6,16),0x567e79,can,0,.18,.05);canHandle.rotation.y=Math.PI/2;
  box(.28,.34,.13,0xb99b6d,tools.seeds,0,-.08,0);box(.16,.13,.015,0x5d8153,tools.seeds,0,-.08,.08);
  makeBasket(tools.basket).scale.setScalar(.8);
  const craft=createFarmCraft(root);
  const openBook=new THREE.Group();openBook.position.set(STUDY_POSITION.x,1.1,STUDY_DESK.z+.1);root.add(openBook);
  for(const side of [-1,1]){const half=box(.3,.035,.42,0xf0e5c9,openBook,side*.15,0,0);half.rotation.z=side*-.08;for(let line=0;line<5;line++)box(.22,.003,.007,0x9d9d83,half,0,.022,-.13+line*.055);}
  const carriedBooks=new THREE.Group();scene.add(carriedBooks);addBooks(carriedBooks);
  const harvestTransfer=new THREE.Mesh(plantGeometry,plantMaterial);harvestTransfer.scale.setScalar(.55);harvestTransfer.castShadow=true;scene.add(harvestTransfer);
  const basketProduce=new THREE.Mesh(plantGeometry,plantMaterial);basketProduce.position.set(0,.32,0);basketProduce.scale.setScalar(.45);tools.basket.add(basketProduce);
  const panLeaves=new THREE.Group();pan.add(panLeaves);for(let j=0;j<8;j++){const l=mesh(new THREE.CircleGeometry(.045,5),0xb59965,panLeaves,Math.sin(j*7)*.16,.03,Math.cos(j*4)*.15);l.rotation.x=-Math.PI/2;}
  const particleGeo=new THREE.BufferGeometry();const particleArray=new Float32Array(48*3);particleGeo.setAttribute('position',new THREE.BufferAttribute(particleArray,3));
  const particles=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:0xb9e4ec,size:.065,transparent:true,opacity:.85,depthWrite:false}));particles.frustumCulled=false;scene.add(particles);
  // These positions move in world space between distant stations; fixed bounds would cull the stream.
  const streamPositions=new Float32Array(48*6),streamGeometry=new THREE.BufferGeometry();streamGeometry.setAttribute('position',new THREE.BufferAttribute(streamPositions,3));
  const stream=new THREE.LineSegments(streamGeometry,new THREE.LineBasicMaterial({color:0xc0e8e7,transparent:true,opacity:.75,depthWrite:false}));stream.frustumCulled=false;scene.add(stream);
  const targetRing=new THREE.Mesh(new THREE.RingGeometry(.43,.49,40),new THREE.MeshBasicMaterial({color:0xffda8a,side:THREE.DoubleSide,transparent:true,opacity:.9}));targetRing.rotation.x=-Math.PI/2;scene.add(targetRing);
  const hand=new THREE.Vector3(),target=new THREE.Vector3(),spout=new THREE.Vector3(),forward=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),soilWet=new THREE.Color(0x433b2b);
  const clothPos=clothGeo.attributes.position as THREE.BufferAttribute;
  let lastCloth=-1,lastState='';
  function update(f:Fieldwork,kind:WorkKind|null,tool:Tool,actionProgress:number,working:boolean,time:number,reduced:boolean){
    craft.update(time,reduced);
    const task=kind?nextWorkTask(f,kind):null,station=kind?WORK_STATIONS.find(s=>s.id===(task?.station||(kind==='garden'?'garden-board':'duty-board'))):null;
    targetRing.visible=!!station;
    if(station)targetRing.position.set(station.approach.x,.3,station.approach.z);
    const growth=working&&task?.action==='grow'?THREE.MathUtils.smoothstep(actionProgress,0,1):0;
    for(let i=0;i<3;i++){
      const stage=f.garden.beds[i],workHere=working&&task?.station===`bed-${i}`;
      furrows[i].visible=stage>0||(workHere&&task?.action==='till'&&actionProgress>.12);
      const wet=stage>=3&&stage<5?1:workHere&&task?.action==='water'?actionProgress:0;
      (soils[i].material as THREE.MeshStandardMaterial).color.setHex(0x8a6947).lerp(soilWet,wet);
      for(let n=0;n<crops[i].length;n++){
        seeds[i][n].visible=stage===2||(workHere&&task?.action==='plant'&&n/crops[i].length<actionProgress);
        const plant=crops[i][n];plant.visible=stage>=3&&stage<5;
        const harvest=workHere&&task?.action==='harvest'?THREE.MathUtils.clamp((actionProgress*crops[i].length-n),0,1):0;
        plant.scale.setScalar((stage===4?.92:.16+growth*.76)*(1-harvest));
        plant.rotation.z=reduced?0:Math.sin(time*1.9+n)*.025;
      }
      basketContents[i].visible=f.garden.beds[i]===5;
    }
    for(let i=0;i<3;i++){
      const complete=!!(f.duty.swept&(1<<i)),p=working&&task?.station===`dust-${i}`?actionProgress:0;
      dust[i].visible=!complete;
      if(p>0)pan.position.set(dust[i].position.x+.2,.29,dust[i].position.z+.3);
      dust[i].children.forEach((leaf,j)=>{leaf.position.x=Math.sin(j*6.7)*.5*(1-p)+p*.2;leaf.position.z=Math.cos(j*3.2)*.3*(1-p)+p*.3;leaf.scale.setScalar(1-p*.9);});
    }
    const foldProgress=f.duty.folds+(working&&task?.action==='fold'?actionProgress:0);
    if(lastCloth!==foldProgress){lastCloth=foldProgress;
      for(let n=0;n<clothPos.count;n++){
        let x=original[n*3],y=original[n*3+1],z=original[n*3+2];
        const smooth=1-Math.min(1,foldProgress);y+=smooth*(Math.sin(x*23+z*13)*.025+Math.cos(z*27)*.017);
        const a=THREE.MathUtils.clamp(foldProgress-1,0,1)*Math.PI;
        if(x>0){const curl=Math.sin(a)*Math.sin(x/.59*Math.PI);y+=Math.sin(a)*x-curl*.035+.014*(a/Math.PI);x=Math.cos(a)*x+curl*.07;}
        const b=THREE.MathUtils.clamp(foldProgress-2,0,1)*Math.PI;
        if(z>0){const curl=Math.sin(b)*Math.sin(z/.925*Math.PI);y+=Math.sin(b)*z-curl*.05+.022*(b/Math.PI);z=Math.cos(b)*z+curl*.09;}
        clothPos.setXYZ(n,x,y,z);
      }clothPos.needsUpdate=true;clothGeo.computeVertexNormals();
    }
    blanket.visible=foldProgress<2.98;folded.visible=foldProgress>=2.98;
    tableBooks.position.set(-24.6,1.11,-3.7);tableBooks.rotation.y=0;
    tableBooks.visible=f.duty.books===0;shelfBooks.visible=f.duty.books===2;carriedBooks.visible=kind==='duty'&&f.duty.books===1;
    const state=`${kind}/${tool}`;if(state!==lastState){lastState=state;Object.entries(tools).forEach(([id,g])=>g.visible=!!kind&&tool===id);}
    toolRoot.visible=!!kind;particles.visible=false;stream.visible=false;harvestTransfer.visible=false;panLeaves.visible=f.duty.swept!==0;basketProduce.visible=f.garden.beds.some(b=>b===5);
    if(!kind)return;
    if(reduced&&!working){player.body.rotation.set(0,0,0);player.leftLeg.rotation.x=player.rightLeg.rotation.x=0;player.knees.forEach(k=>k.rotation.x=0);}
    // Override only the active joints after the normal gait has run.
    if(working&&station&&task){
      player.group.rotation.y=Math.atan2(station.x-player.group.position.x,station.z-player.group.position.z);
      const cycle=reduced?0:Math.sin(time*(task.action==='sweep'?5.5:4));
      const reach=Math.sin(Math.min(1,actionProgress*5)*Math.PI/2);
      const bend=['till','plant','harvest','fold','sweep'].includes(task.action)? .35:.08;
      player.body.rotation.x=bend*reach;player.body.position.y=-bend*.35*reach;
      player.knees.forEach(k=>k.rotation.x=bend*1.1);player.leftLeg.rotation.x=player.rightLeg.rotation.x=-bend*.45;
      player.rightArm.rotation.x=-.9+cycle*(task.action==='sweep'?.23:.12);player.rightArm.rotation.z=-.12;
      player.leftArm.rotation.x=['fold','harvest','books','shelve'].includes(task.action)?-1.05:-.4;
      player.elbows[1].rotation.x=-.45-cycle*.15;player.elbows[0].rotation.x=-.5;
      if(task.action==='plant'||task.action==='harvest'){player.body.position.y=-.24;player.knees[0].rotation.x=.85;player.leftLeg.rotation.x=-.55;player.head.rotation.x=.18;}
      if(task.action==='fold'){player.leftArm.rotation.x=-1.1+cycle*.1;player.rightArm.rotation.x=-1.1-cycle*.1;}
      if(task.action==='till')player.rightArm.rotation.x=-.8+cycle*.4;
    }
    if(f.duty.books===1&&kind==='duty'){player.leftArm.rotation.x=-1.1;player.elbows[0].rotation.x=-.7;}
    player.group.updateMatrixWorld(true);
    hand.set(0,-.29,.04);player.elbows[1].localToWorld(hand);toolRoot.position.copy(hand);
    forward.set(0,0,1).applyAxisAngle(up,player.group.rotation.y);
    target.copy(hand).addScaledVector(forward,.75);
    if(tool==='broom'||tool==='hoe')target.y=.32;
    const activeBed=station?.id.startsWith('bed-')?farm.beds[Number(station.id.split('-')[1])]:null;
    const workZ=activeBed?activeBed.z-activeBed.d/2+.35:station?.z??0;
    if(working&&station){target.set(station.x,.25,workZ);if(task?.action==='sweep'){target.y=.325;target.x+=Math.sin(time*5.5)*.35;}if(task?.action==='till')target.y+=.15+Math.max(0,Math.sin(time*4))*.45;}
    toolRoot.lookAt(target);
    tools.broom.position.z=tool==='broom'&&working?hand.distanceTo(target)-1:0;
    if(tool==='can'){toolRoot.quaternion.copy(player.group.quaternion);toolRoot.rotateX(working&&task?.action==='water'?.38:0);}
    if(tool==='basket'||tool==='seeds')toolRoot.quaternion.copy(player.group.quaternion);
    if(carriedBooks.visible){carriedBooks.position.set(0,-.29,.16);player.elbows[0].localToWorld(carriedBooks.position);carriedBooks.quaternion.copy(player.group.quaternion);}
    if(working&&task?.action==='books'){
      target.set(0,-.29,.16);player.elbows[0].localToWorld(target);
      const t=THREE.MathUtils.smoothstep(actionProgress,.15,1);tableBooks.position.lerp(target,t);tableBooks.position.y+=Math.sin(t*Math.PI)*.15;tableBooks.rotation.y=player.group.rotation.y*t;
    }
    if(working&&task?.action==='shelve'){
      const t=THREE.MathUtils.smoothstep(actionProgress,.1,1);carriedBooks.position.lerp(shelfBooks.position,t);carriedBooks.rotation.y=player.group.rotation.y*(1-t);
    }
    if(working&&station&&task?.action==='harvest'){
      const index=Number(task.station.split('-')[1]),count=crops[index].length,n=Math.min(count-1,Math.floor(actionProgress*count)),t=(actionProgress*count)%1;
      crops[index][n].getWorldPosition(harvestTransfer.position);target.copy(hand);target.y+=.3;
      harvestTransfer.position.lerp(target,t);harvestTransfer.position.y+=Math.sin(t*Math.PI)*.45;harvestTransfer.visible=true;
    }
    if(working&&station&&task&&['water','fill','plant','till'].includes(task.action)&&!reduced){
      particles.visible=true;const water=task.action==='water'||task.action==='fill';(particles.material as THREE.PointsMaterial).color.setHex(water?0xb1e1ea:task.action==='plant'?0xdbb777:0x997650);
      if(task.action==='fill')spout.set(farm.tap.spout.x,farm.tap.spout.y,farm.tap.spout.z);else{spout.set(0,.05,.74);toolRoot.localToWorld(spout);}
      stream.visible=water;
      for(let p=0;p<48;p++){
        const s=((time*(water?1.6:1)+p/48)%1);const endX=task.action==='fill'?hand.x:station.x+Math.sin(p*9.4)*.6,endZ=task.action==='fill'?hand.z:workZ+Math.cos(p*7.7)*.2;
        particleArray[p*3]=THREE.MathUtils.lerp(spout.x,endX,s);particleArray[p*3+1]=THREE.MathUtils.lerp(spout.y,task.action==='fill'?hand.y:.3,s*s);particleArray[p*3+2]=THREE.MathUtils.lerp(spout.z,endZ,s);
        if(water){const previous=Math.max(0,s-.065);streamPositions[p*6]=THREE.MathUtils.lerp(spout.x,endX,previous);streamPositions[p*6+1]=THREE.MathUtils.lerp(spout.y,task.action==='fill'?hand.y:.3,previous*previous);streamPositions[p*6+2]=THREE.MathUtils.lerp(spout.z,endZ,previous);streamPositions[p*6+3]=particleArray[p*3];streamPositions[p*6+4]=particleArray[p*3+1];streamPositions[p*6+5]=particleArray[p*3+2];}
      }particleGeo.attributes.position.needsUpdate=true;
      if(water)streamGeometry.attributes.position.needsUpdate=true;
    }
  }
  // Object picking includes generous, invisible hit boxes, not only thin leaves.
  const picks:THREE.Mesh[]=[];
  for(const s of WORK_STATIONS){const bed=s.id.startsWith('bed-')?farm.beds[Number(s.id.split('-')[1])]:null;const hit=new THREE.Mesh(new THREE.BoxGeometry(bed?.w??1.3,1.5,bed?.d??1.3),new THREE.MeshBasicMaterial({visible:false}));hit.position.set(s.x,.65,s.z);hit.userData.station=s.id;root.add(hit);picks.push(hit);}
  return {root,picks,update,study:(active:boolean)=>{openBook.visible=active;},dispose:()=>{mats.forEach(m=>m.dispose());}};
}
