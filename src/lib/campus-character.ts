import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { sculptLoft, sculptCadetHead, sculptCadetHair, sculptHairLock, type SculptRing } from './cadet-sculpt.ts';
export type CharacterKind='cadet'|'linh'|'library'|'canteen';

/** Concept 01 proportions: about five head heights, a sculpted face and articulated cloth silhouettes. */
export function createCampusCharacter(kind:CharacterKind,backpack=false){
  const group=new THREE.Group(),body=new THREE.Group();group.add(body);
  const uniform=kind==='cadet'||kind==='linh',female=kind==='linh'||kind==='library';
  const colors={skin:0xeeb38a,hair:0x29251f,cloth:uniform?0x586542:0x71805b,pants:0x4e5b39,boots:0x423f30,gold:0xcda354,red:0xac4535};
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(128,128);
  for(let i=0;i<128*128;i++){const x=i%128,y=Math.floor(i/128),v=223+Math.sin(x*Math.PI/2)*9+Math.cos(y*Math.PI/2)*7+((x*13+y*7)%7);pixels.data.set([v,v,v,255],i*4);}ctx.putImageData(pixels,0,0);
  const fabric=new THREE.CanvasTexture(canvas);fabric.wrapS=fabric.wrapT=THREE.RepeatWrapping;fabric.repeat.set(2,2);
  const materials=new Map<number,THREE.MeshStandardMaterial>();
  function material(color:number){if(!materials.has(color)){const cloth=[colors.cloth,colors.pants,0x9b8354,0x806a42].includes(color);materials.set(color,new THREE.MeshStandardMaterial({color,roughness:color===colors.skin?.72:color===colors.gold?.47:.88,metalness:color===colors.gold?.22:0,map:cloth?fabric:null,bumpMap:cloth?fabric:null,bumpScale:.0035}));}return materials.get(color)!;}
  const mesh=(geo:THREE.BufferGeometry,color:number,parent:THREE.Object3D,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,material(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
  const oval=(x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,parent:THREE.Object3D=body)=>{const m=mesh(new THREE.SphereGeometry(1,24,16),color,parent,x,y,z);m.scale.set(sx,sy,sz);return m;};
  const patch=(w:number,h:number,d:number,color:number,parent:THREE.Object3D,x=0,y=0,z=0)=>mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.2),color,parent,x,y,z);
  const line=(points:number[][],radius:number,color:number,parent:THREE.Object3D)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))),24,radius,6,false),color,parent);
  const loft=(rings:SculptRing[],color:number,parent:THREE.Object3D,folds=0)=>mesh(sculptLoft(rings,32,40,folds),color,parent);
  loft([{y:.87,x:.001,z:.001},{y:.9,x:.19,z:.126},{y:1.02,x:.197,z:.137},{y:1.17,x:.2,z:.14},{y:1.34,x:.235,z:.145},{y:1.46,x:.251,z:.137},{y:1.52,x:.21,z:.1},{y:1.56,x:.108,z:.088},{y:1.57,x:.001,z:.001}],colors.cloth,body,.017);
  loft([{y:1.5,x:.077,z:.07},{y:1.66,x:.075,z:.069},{y:1.71,x:.098,z:.08}],colors.skin,body);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.113,.92,0);rightLeg.position.set(.113,.92,0);body.add(leftLeg,rightLeg);
  const knees:THREE.Group[]=[];
  for(const leg of [leftLeg,rightLeg]){
    loft([{y:.035,x:.081,z:.091},{y:-.04,x:.104,z:.115},{y:-.18,x:.105,z:.1},{y:-.32,x:.092,z:.087},{y:-.44,x:.078,z:.076}],colors.pants,leg,.035);
    const knee=new THREE.Group();knee.position.y=-.43;leg.add(knee);knees.push(knee);
    loft([{y:.035,x:.079,z:.076},{y:-.08,x:.087,z:.084},{y:-.19,x:.076,z:.073},{y:-.29,x:.063,z:.06},{y:-.32,x:.064,z:.061}],kind==='library'?colors.skin:colors.pants,knee,.038);
    const boot=loft([{y:-.27,x:.061,z:.065},{y:-.3,x:.07,z:.079},{y:-.35,x:.078,z:.117,cz:.025},{y:-.39,x:.085,z:.15,cz:.045},{y:-.43,x:.083,z:.151,cz:.046},{y:-.445,x:.076,z:.14,cz:.045}],colors.boots,knee);
    boot.name='Sculpted lace-up boot';patch(.169,.024,.298,0x2b2d24,knee,0,-.448,.047);
    for(let i=0;i<4;i++){const y=-.296-i*.024,z=.071+i*.015;line([[-.036,y,z],[.036,y-.018,z+.009]],.0035,0x93835c,knee);line([[.036,y,z],[-.036,y-.018,z+.009]],.0035,0x93835c,knee);}
    patch(.09,.13,.012,colors.cloth,leg,.064,-.19,.072);
  }
  if(kind==='library')loft([{y:.98,x:.195,z:.14},{y:.8,x:.255,z:.16},{y:.56,x:.3,z:.19},{y:.55,x:.297,z:.187}],colors.pants,body,.025);
  loft([{y:.94,x:.204,z:.14},{y:1,x:.203,z:.141}],0x45422e,body);
  patch(.075,.055,.022,colors.gold,body,0,.97,.148);patch(.044,.026,.024,0x45422e,body,0,.97,.16);
  for(const side of [-1,1]){
    const collar=patch(.135,.142,.028,colors.cloth,body,side*.08,1.485,.112);collar.rotation.z=side*.44;collar.rotation.x=-.15;
    const tab=patch(.071,.073,.008,colors.red,body,side*.098,1.465,.135);tab.rotation.z=side*.44;
    if(uniform){patch(.112,.022,.142,colors.red,body,side*.218,1.515,-.005);oval(side*.219,1.532,.018,.009,.005,.009,colors.gold);}
    patch(.139,.14,.02,colors.cloth,body,side*.124,1.285,.14);
    patch(.145,.042,.026,0x626d47,body,side*.124,1.345,.149);
    oval(side*.124,1.339,.166,.008,.008,.004,colors.gold);
    line([[side*.124-.057,1.322,.153],[side*.124-.057,1.225,.155],[side*.124+.057,1.225,.155],[side*.124+.057,1.322,.153]],.0016,0x8b8f60,body);
  }
  patch(.024,.4,.008,0x626d47,body,0,1.235,.151);
  for(let i=0;i<5;i++)oval(0,1.432-i*.092,.162,.01,.01,.006,colors.gold);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-.262,1.475,0);rightArm.position.set(.262,1.475,0);body.add(leftArm,rightArm);
  const elbows:THREE.Group[]=[];
  for(const [i,arm]of [leftArm,rightArm].entries()){
    const side=i?1:-1;
    loft([{y:.045,x:.001,z:.001},{y:.025,x:.073,z:.089},{y:-.07,x:.094,z:.101},{y:-.19,x:.084,z:.087},{y:-.315,x:.07,z:.073}],colors.cloth,arm,.038);
    const elbow=new THREE.Group();elbow.position.y=-.31;arm.add(elbow);elbows.push(elbow);
    loft([{y:.025,x:.072,z:.073},{y:-.04,x:.081,z:.08},{y:-.075,x:.077,z:.075},{y:-.088,x:.063,z:.065}],colors.cloth,elbow,.025);
    loft([{y:-.081,x:.059,z:.061},{y:-.12,x:.057,z:.058},{y:-.2,x:.043,z:.047},{y:-.23,x:.04,z:.043}],colors.skin,elbow);
    // One tapered palm surface; fingers follow its knuckles instead of floating spheres.
    loft([{y:-.215,x:.038,z:.04},{y:-.25,x:.05,z:.037,cz:.005},{y:-.284,x:.047,z:.033,cz:.009},{y:-.305,x:.032,z:.027,cz:.012}],colors.skin,elbow);
    for(let f=0;f<4;f++){const finger=loft([{y:-.28,x:.012,z:.015},{y:-.314,x:.012,z:.015,cz:.004},{y:-.341+Math.abs(f-1.5)*.008,x:.009,z:.012,cz:.01},{y:-.347+Math.abs(f-1.5)*.008,x:.001,z:.001,cz:.011}],colors.skin,elbow);finger.position.x=-.032+f*.022;}
    const thumb=loft([{y:-.246,x:.019,z:.02},{y:-.271,x:.019,z:.019,cz:.014},{y:-.297,x:.011,z:.013,cz:.025},{y:-.303,x:.001,z:.001,cz:.027}],colors.skin,elbow);thumb.position.x=-side*.046;thumb.rotation.z=-side*.23;arm.rotation.z=side*.085;
  }
  const head=new THREE.Group();head.position.set(0,1.84,0);head.scale.setScalar(.82);body.add(head);
  const face=mesh(sculptCadetHead(),colors.skin,head);face.material=material(colors.skin).clone();face.material.vertexColors=true;face.material.color.setHex(0xffffff);
  mesh(sculptCadetHair(female),colors.hair,head).material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.69,side:THREE.DoubleSide});
  for(let i=0;i<5;i++){
    const points=[[.12+i*.012,.17,.16],[.08-i*.017,.145,.219],[-.015-i*.026,.11-i*.004,.23],[-.065-i*.029,.076+i*.009,.207-i*.006]].map(p=>new THREE.Vector3(...p as [number,number,number]));
    const lock=mesh(sculptHairLock(points,.025),colors.hair,head);lock.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,side:THREE.DoubleSide});
  }
  const eyes:THREE.Group[]=[];
  for(const side of [-1,1]){
    const ear=oval(side*.205,-.018,-.005,.033,.059,.029,colors.skin,head);ear.rotation.z=side*-.13;
    oval(side*.219,-.014,.017,.013,.032,.009,0xd28b6b,head);
    const eye=new THREE.Group();eye.position.set(side*.084,.024,.17);eye.rotation.y=side*.42;head.add(eye);eyes.push(eye);
    oval(0,0,0,.045,.022,.012,0xf7eddc,eye);
    oval(-side*.002,.001,.015,.028,.022,.005,0x926737,eye);
    oval(-side*.002,.001,.021,.017,.019,.004,0x261e16,eye);
    oval(-.007,.007,.026,.0055,.006,.002,0xffffff,eye);
    line([[-.048,.002,.003],[-.032,.021,.012],[0,.027,.019],[.032,.02,.013],[.048,.001,.003]],female?.004:.003,0x5e382b,eye);
    line([[-.045,-.003,.003],[-.022,-.023,.013],[.012,-.024,.016],[.044,-.005,.005]],.0022,0xc78f72,eye);
    eye.scale.y=1.4;
    line([[side*.043,.083,.178],[side*.079,.098,.18],[side*.124,.087,.151]],female?.007:.009,colors.hair,head);
    // Nostrils sit on the integrated nose, never a separate button sphere.
    oval(side*.017,-.039,.204,.005,.0025,.0025,0xac7659,head);
  }
  line([[-.054,-.111,.17],[-.025,-.125,.185],[.012,-.127,.188],[.048,-.112,.174]],.004,0x8c5142,head);
  line([[-.035,-.129,.183],[0,-.135,.188],[.031,-.129,.182]],.0035,0xd09074,head);
  if(uniform){
    const cap=loft([{y:.17,x:.218,z:.19,cz:-.02},{y:.185,x:.23,z:.202,cz:-.021},{y:.25,x:.228,z:.2,cz:-.035},{y:.294,x:.19,z:.174,cz:-.036},{y:.318,x:.1,z:.1,cz:-.038},{y:.325,x:.001,z:.001,cz:-.04}],colors.cloth,head,.012);
    cap.name='Soft field cap';
    const visor=oval(0,.176,.165,.212,.016,.12,0x4c5938,head);visor.rotation.x=-.12;
    line([[-.19,.175,.2],[-.1,.163,.274],[.09,.164,.277],[.19,.175,.2]],.002,0x99a16a,head);
    for(const a of [-.8,0,.8])line([[Math.sin(a)*.21,.184,Math.cos(a)*.195-.02],[Math.sin(a)*.205,.25,Math.cos(a)*.18-.03],[Math.sin(a)*.07,.316,Math.cos(a)*.07-.04]],.0015,0x82905e,head);
    const star=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.01:.025;if(!i)star.moveTo(Math.cos(a)*r,Math.sin(a)*r);else star.lineTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();mesh(new THREE.ShapeGeometry(star),colors.gold,head,0,.236,.177);
  }
  if(female){
    const braid=new THREE.Group();braid.position.set(.14,-.035,-.12);braid.rotation.z=-.15;head.add(braid);
    for(let i=0;i<8;i++)oval(Math.sin(i*Math.PI)*.016,-i*.045,-.01,.038-i*.002,.036,.032-i*.0015,colors.hair,braid);
    patch(.057,.024,.05,colors.red,braid,0,-.29,-.01);
  }
  if(kind==='library'){
    for(const side of [-1,1]){const glasses=mesh(new THREE.TorusGeometry(.055,.004,8,36),0x8c7857,head,side*.084,.027,.204);glasses.scale.y=.78;}patch(.048,.005,.009,0x8c7857,head,0,.03,.212);
    patch(.18,.265,.06,0x536e50,leftArm,.06,-.36,.2);patch(.16,.24,.026,0xe1d3b0,leftArm,.06,-.36,.238);elbows[0].rotation.x=-.7;
  }
  if(kind==='canteen'){
    const apron=loft([{y:.68,x:.21,z:.14},{y:.97,x:.22,z:.155},{y:1.29,x:.19,z:.15}],0x42593f,body);apron.position.z=.024;
    for(const side of [-1,1])patch(.035,.49,.018,0x42593f,body,side*.16,1.29,.149).rotation.z=side*-.12;
    for(const side of [-1,1])oval(side*.028,-.075,.19,.033,.01,.008,0x4b3829,head).rotation.z=side*.13;
  }
  if(backpack){
    patch(.32,.4,.15,0x9b8354,body,0,1.24,-.185);patch(.275,.19,.06,0x806a42,body,0,1.13,-.273);
    patch(.26,.025,.018,0x604e32,body,0,1.22,-.31);
    for(const side of [-1,1]){patch(.042,.48,.027,0x9b8354,body,side*.176,1.28,.155).rotation.z=side*.08;patch(.037,.04,.014,colors.gold,body,side*.176,1.15,.174);}
  }
  // Bake the surfaces at each articulated pivot, keeping cloth texture and painted surfaces separate.
  // Hands, face details and boot laces no longer each cost an individual draw call.
  const painted=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.74});
  const woven=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.89,map:fabric,bumpMap:fabric,bumpScale:.0035});
  const obsoleteMaterials=new Set<THREE.Material>();
  group.traverse(parent=>{
    if(!(parent instanceof THREE.Group))return;
    for(const textile of [false,true]){
      const parts=parent.children.filter((o):o is THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>=>o instanceof THREE.Mesh&&o.material instanceof THREE.MeshStandardMaterial&&!!o.material.map===textile);
      if(!parts.length)continue;
      const geos=parts.map(o=>{o.updateMatrix();const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrix);const count=geo.attributes.position.count,values=new Float32Array(count*3),base=o.material.color;for(let i=0;i<count;i++){const tint=o.material.vertexColors&&geo.attributes.color?new THREE.Color().fromBufferAttribute(geo.attributes.color,i).multiply(base):base;tint.toArray(values,i*3);}geo.setAttribute('color',new THREE.BufferAttribute(values,3));return geo;});
      const geometry=mergeGeometries(geos);geos.forEach(g=>g.dispose());if(!geometry)continue;
      const surface=new THREE.Mesh(geometry,textile?woven:painted);surface.castShadow=surface.receiveShadow=true;
      parts.forEach(o=>{o.removeFromParent();o.geometry.dispose();obsoleteMaterials.add(o.material);});parent.add(surface);
    }
  });
  obsoleteMaterials.forEach(m=>m.dispose());
  return {group,body,head,leftLeg,rightLeg,leftArm,rightArm,knees,elbows,eyes,kind};
}
export type CampusCharacter=ReturnType<typeof createCampusCharacter>;
export function animateCharacter(rig:CampusCharacter,time:number,speaking:boolean,reducedMotion:boolean){
  const t=reducedMotion?0:time,phase=t%4.9,blink=!reducedMotion&&phase<.15?1-Math.sin(phase/.15*Math.PI)*.96:1;
  rig.eyes.forEach(eye=>eye.scale.y=1.4*blink);rig.body.position.y=Math.sin(t*1.6)*.006;
  rig.head.rotation.set(speaking?Math.sin(t*2.3)*.025:Math.sin(t*.8)*.009,Math.sin(t*.6)*.02,Math.sin(t*.9)*.012);
  rig.rightArm.rotation.z=speaking?-.12-Math.sin(t*1.4)*.05:.085;
  rig.rightArm.rotation.x=speaking?-.18-Math.sin(t*2)*.09:Math.sin(t)*.02;
  rig.elbows[1].rotation.x=speaking?-.55-Math.sin(t*1.4)*.14:-.06;
  if(rig.kind!=='library')rig.elbows[0].rotation.x=speaking?-.15-Math.sin(t*1.3)*.08:-.05;
}
