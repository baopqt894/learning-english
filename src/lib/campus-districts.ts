import { createFarmFamilies } from './campus-farm-families';
import * as THREE from 'three';
import {petStatus,type PetCare,type PetId} from './pet-care.ts';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {PEN_HABITATS,CAMPUS_EXTENT,DISTRICT_PATHS,BASE_LIVESTOCK_PENS as LIVESTOCK_PENS,BASE_FISH_POND as FISH_POND,BASE_FEED_DECK as FEED_DECK,BASE_SWIMMING_POOL as SWIMMING_POOL,BASE_TRAINING_GROUND as TRAINING_GROUND,BASE_BALANCE_BEAM as BALANCE_BEAM,BASE_TRAINING_CONES as TRAINING_CONES,BASE_DISTRICT_STRUCTURES as DISTRICT_STRUCTURES,BASE_DISTRICT_BENCHES as DISTRICT_BENCHES,BASE_DISTRICT_STATIONS as DISTRICT_STATIONS,DISTRICT_TRANSFORMS,baseDistrictAt,districtPoint,type DistrictStationId} from './campus-districts-layout.ts';
import {seededRandom,createCampusSurfaces,worldAlignedUV} from './campus-surfaces';

/** Actual walkable districts. Static colored geometry is batched; animal joints and water stay live. */
export function createCampusDistricts(scene:THREE.Scene){
  const root=new THREE.Group();root.name='Expanded cadet campus';scene.add(root);
  const staticRoot=new THREE.Group();root.add(staticRoot);
  const solid=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.87});
  const random=seededRandom(41982),surfaces=createCampusSurfaces();
  function part(geometry:THREE.BufferGeometry,color:number,parent:THREE.Object3D=staticRoot,x=0,y=0,z=0){
    const count=geometry.attributes.position.count,c=new THREE.Color(color),values=new Float32Array(count*3);
    for(let i=0;i<count;i++)c.toArray(values,i*3);geometry.setAttribute('color',new THREE.BufferAttribute(values,3));
    const mesh=new THREE.Mesh(geometry,solid);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  const box=(w:number,h:number,d:number,c:number,x:number,y:number,z:number,p:THREE.Object3D=staticRoot)=>part(new THREE.BoxGeometry(w,h,d),c,p,x,y,z);
  const round=(w:number,h:number,d:number,c:number,x:number,y:number,z:number,p:THREE.Object3D=staticRoot)=>part(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.2),c,p,x,y,z);
  const oval=(sx:number,sy:number,sz:number,c:number,x:number,y:number,z:number,p:THREE.Object3D=staticRoot)=>{const m=part(new THREE.SphereGeometry(1,20,12),c,p,x,y,z);m.scale.set(sx,sy,sz);return m;};
  const cyl=(r:number,h:number,c:number,x:number,y:number,z:number,p:THREE.Object3D=staticRoot)=>part(new THREE.CylinderGeometry(r,r,h,12),c,p,x,y,z);
  const pipe=(a:number[],b:number[],r:number,c:number,p:THREE.Object3D=staticRoot)=>{const from=new THREE.Vector3(...a as [number,number,number]),to=new THREE.Vector3(...b as [number,number,number]);const m=cyl(r,from.distanceTo(to),c,0,0,0,p);m.position.copy(from).lerp(to,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());return m;};
  const ring=(r:number,t:number,c:number,x:number,y:number,z:number,p:THREE.Object3D=staticRoot)=>part(new THREE.TorusGeometry(r,t,8,32),c,p,x,y,z);
  function surface(w:number,d:number,color:number,x:number,z:number,kind:'turf'|'pavers'|'stone'='pavers',y=.055){
    const geo=new THREE.BoxGeometry(w,.05,d);worldAlignedUV(geo,new THREE.Vector3(x,y,z),3.5);const mesh=new THREE.Mesh(geo,surfaces(kind,color));mesh.position.set(x,y,z);mesh.receiveShadow=true;root.add(mesh);return mesh;
  }
  function label(text:string,x:number,y:number,z:number,w=3,h=.45){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#304c3b';ctx.fillRect(0,0,768,128);ctx.strokeStyle='#bbaa72';ctx.lineWidth=5;ctx.strokeRect(9,9,750,110);ctx.fillStyle='#f2e4bf';ctx.font='600 43px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,384,65,716);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.9,side:THREE.DoubleSide}));m.position.set(x,y,z);root.add(m);return m;
  }
  const plank=(w:number,d:number,x:number,y:number,z:number)=>{for(let i=0;i<Math.ceil(w/.21);i++)box(.19,.075,d,i%3?0xa98a5d:0xb89a6b,x-w/2+.1+i*.21,y,z);};
  function fence(x:number,z:number,w:number,d:number){
    const sides=[{x,z:z-d/2,w,d:0},{x,z:z+d/2,w,d:0},{x:x-w/2,z,w:0,d},{x:x+w/2,z,w:0,d}];
    for(const s of sides){const length=s.w||s.d,count=Math.ceil(length/1.7);box(s.w||.2,.18,s.d||.2,0xa87b59,s.x,.13,s.z);for(const y of [.55,1.02])box(s.w||.075,.07,s.d||.075,0x667c50,s.x,y,s.z);for(let i=0;i<=count;i++){const a=i/count-.5;round(.11,1.22,.11,0x526b47,s.x+s.w*a,.64,s.z+s.d*a);}}
  }
  function shelter(x:number,z:number,w:number,d:number,h:number,open=true,roofColor=0x526e59){
    box(w+.3,.14,d+.3,0xb6b09a,x,.08,z);
    if(!open){box(w,h,d,0xd4be91,x,h/2,z);for(let i=0;i<Math.floor(w/.5);i++)box(.025,h,.028,0xb9a477,x-w/2+i*.5,h/2,z+d/2+.02);round(.9,1.95,.09,0x46634e,x,.99,z+d/2+.06);box(.7,.55,.018,0x91b4aa,x,1.45,z+d/2+.12);}
    else {box(w,.8,.12,0xc7af86,x,.48,z-d/2);for(const side of [-1,1])for(const end of [-1,1])round(.12,h,.12,0x677557,x+side*(w/2-.09),h/2,z+end*(d/2-.09));}
    for(const side of [-1,1]){const roof=box(w+.65,.12,d/2+.5,roofColor,x,h+.16,z+side*(d/4+.1));roof.rotation.x=side*.22;for(let i=0;i<Math.ceil(w/.34);i++){const rib=box(.035,.045,d/2+.5,new THREE.Color(roofColor).lerp(new THREE.Color(0xffeed3),.18).getHex(),x-w/2-.25+i*.34,h+.23,z+side*(d/4+.1));rib.rotation.x=side*.22;}}
    box(w+.7,.1,.14,0x789074,x,h+.4,z);
  }
  // The new outer fence replaces the old internal campus boundary.
  const midX=(CAMPUS_EXTENT.minX+CAMPUS_EXTENT.maxX)/2,midZ=(CAMPUS_EXTENT.minZ+CAMPUS_EXTENT.maxZ)/2;
  const spanX=CAMPUS_EXTENT.maxX-CAMPUS_EXTENT.minX+2,spanZ=CAMPUS_EXTENT.maxZ-CAMPUS_EXTENT.minZ+2;
  for(const z of [CAMPUS_EXTENT.minZ-1,CAMPUS_EXTENT.maxZ+1]){box(spanX,.07,.07,0xb8b99a,midX,.75,z);for(let x=CAMPUS_EXTENT.minX-1;x<=CAMPUS_EXTENT.maxX+1;x+=2)box(.07,.9,.07,0xb8b99a,x,.45,z);}
  for(const x of [CAMPUS_EXTENT.minX-1,CAMPUS_EXTENT.maxX+1]){box(.07,.07,spanZ,0xb8b99a,x,.75,midZ);for(let z=CAMPUS_EXTENT.minZ-1;z<=CAMPUS_EXTENT.maxZ+1;z+=2)box(.07,.9,.07,0xb8b99a,x,.45,z);}
  for(const p of DISTRICT_PATHS){surface(p.w,p.d,0xd4c49d,p.x,p.z).userData.fixed=true;for(const side of [-1,1]){if(p.w>p.d)box(p.w,.07,.12,0xad9874,p.x,.08,p.z+side*p.d/2);else box(.12,.07,p.d,0xad9874,p.x+side*p.w/2,.08,p.z);}}
  for(const child of staticRoot.children)child.userData.fixed=true;
  for(const b of DISTRICT_STRUCTURES.filter(b=>b.id!=='training-shelter'))shelter(b.x,b.z,b.w,b.d,b.h,false);
  label('FEED & TOOLS',70.5,2.3,21.08,3,.35);label('FEEDING STATION',69.5,2.3,-.92,3,.35);
  for(const [i,x] of [51,56,61].entries()){
    box(1.12,2.08,.09,0x4a695c,x,1.09,-52.09);
    box(.93,1.92,.058,0x719483,x,.99,-52.03);
    box(.07,.12,.055,0xd8c69c,x+.29,.96,-51.997);
    for(let vent=0;vent<5;vent++)box(.59,.032,.024,0x3b625a,x,.39+vent*.1,-51.996);
    label(['CHANGING','SHOWERS','CHANGING'][i],x,2.32,-51.99,2.8,.23);
  }
  for(const b of DISTRICT_BENCHES){if(b.w>b.d){plank(b.w,b.d,b.x,.57,b.z);for(const s of [-1,1])box(.12,.54,.5,0x5e6f52,b.x+s*(b.w/2-.3),.29,b.z);box(b.w,.48,.08,0x9e7c50,b.x,.9,b.z-.32);}else {plank(b.w,b.d,b.x,.57,b.z);for(const s of [-1,1])box(.5,.54,.12,0x5e6f52,b.x,.29,b.z+s);}}

  const animals:{group:THREE.Group;head:THREE.Group;legs:THREE.Group[];x:number;z:number;phase:number;kind:string}[]=[];
  function animal(kind:string,x:number,z:number,size=1){
    const g=new THREE.Group();g.position.set(x,.13,z);g.scale.setScalar(size);g.rotation.y=random()*6.28;root.add(g);
    const head=new THREE.Group(),legs:THREE.Group[]=[];g.add(head);
    const bird=kind==='chicken'||kind==='duck',c=kind==='pig'?0xdca495:kind==='goat'?0xc6b18b:kind==='duck'?0xe8e2c7:0xc09a63;
    oval(bird?.23:.39,bird?.24:.29,bird?.33:.59,c,0,bird?.37:.58,0,g);
    if(bird){head.position.set(0,.62,.25);oval(.135,.17,.14,c,0,0,0,head);const beak=part(new THREE.ConeGeometry(.075,.16,4),0xd49a42,head,0,-.015,.18);beak.rotation.x=Math.PI/2;oval(.17,.13,.23,c===0xc09a63?0x805c3a:0xd6d5bb,.19,.43,-.02,g).rotation.z=-.25;oval(.17,.13,.23,c===0xc09a63?0x805c3a:0xd6d5bb,-.19,.43,-.02,g).rotation.z=.25;
      if(kind==='chicken'){for(let i=0;i<3;i++)oval(.035,.06,.045,0xb74c38,0,.15,i*.05-.04,head);oval(.04,.07,.045,0xb74c38,0,-.12,.08,head);}
      else oval(.16,.07,.16,0xc7c9b0,0,.42,-.35,g);
    }else {head.position.set(0,.65,.49);oval(kind==='pig'?.245:.19,.225,.26,c,0,0,0,head);
      for(const s of [-1,1]){const ear=oval(.09,.13,.055,c,s*.2,.14,.015,head);ear.rotation.z=s*-.48;}
      if(kind==='pig'){oval(.14,.09,.07,0xc78076,0,-.045,.25,head);for(const s of [-1,1])oval(.021,.017,.008,0x8c5b50,s*.057,-.04,.315,head);const tail=ring(.055,.014,c,0,.63,-.58,g);tail.rotation.y=Math.PI/2;}
      else {for(const s of [-1,1]){pipe([s*.1,.16,-.01],[s*.12,.34,-.09],.023,0x746550,head);}oval(.04,.09,.045,0x988360,0,-.24,.12,head);}
    }
    for(const s of [-1,1])oval(bird?.018:.025,bird?.023:.029,.014,0x292b22,s*(bird?.11:.13),bird?.025:.03,bird?.082:.205,head);
    for(let i=0;i<(bird?2:4);i++){const leg=new THREE.Group();leg.position.set((i%2?1:-1)*(bird?.1:.22),bird?.22:.38,bird?.015:(i<2?.32:-.36));g.add(leg);legs.push(leg);cyl(bird?.022:.056,bird?.2:.3,bird?0xb79b55:c,0,-.1,0,leg);round(bird?.09:.12,.055,bird?.14:.14,bird?0xc6a45e:0x665d4b,0,-(bird?.19:.24),.025,leg);}
    if(kind==='chicken'){
      for(let i=0;i<3;i++)oval(.065,.26,.09,[0x795236,0xa16a41,0x82603b][i],(i-1)*.078,.55,-.30-i*.035,g).rotation.x=-.57;
    }else if(kind==='goat'){
      oval(.17,.21,.31,0xe3d1ac,.27,.64,.13,g);
      oval(.095,.26,.11,0x90755b,0,-.22,.15,head);
    }else if(kind==='pig'){
      oval(.16,.14,.21,0xc88e80,.31,.66,-.16,g);
    }
    // Bake each local mesh set; articulated head and feet remain independent.
    for(const p of [g,head,...legs])bake(p);
    animals.push({group:g,head,legs,x,z,phase:random()*8,kind});
  }
  for(const pen of LIVESTOCK_PENS){
    const {x,z,kind}=pen;
    const house=PEN_HABITATS[kind];
    shelter(x+house.dx,z+house.dz,house.w,house.d,house.h,true,house.roof);
    surface(pen.w,pen.d,house.ground,x,z,kind==='goat'||kind==='duck'?'turf':'stone');
    fence(x,z,pen.w,pen.d);
    label(pen.label,x,1.02,z+pen.d/2+.08,2,.35);
    if(kind==='chicken'){
      // Raised timber henhouse, individual nests and a cleated access ramp.
      box(4.1,.92,1.7,0xb18653,x-1.9,1.15,z-2);
      for(const dx of [-3.15,-1.95,-.75]){
        box(.78,.56,.10,0x604f3c,x+dx,1.27,z-1.09);
        oval(.37,.09,.24,0xd4b772,x+dx,1.02,z-.95);
        oval(.085,.12,.075,0xf1e1b8,x+dx,1.10,z-.9);
      }
      box(.76,.12,1.95,0xad895e,x-3,.58,z-.12).rotation.x=.46;
      for(let i=0;i<6;i++)box(.76,.055,.08,0xe2bb7b,x-3,.99-i*.126,z-.84+i*.25);
      pipe([x+1.5,.65,z-1.8],[x+4,.65,z-1.8],.08,0x886a48);
      for(const dx of [1.5,4])cyl(.08,.68,0x886a48,x+dx,.35,z-1.8);
    }else if(kind==='goat'){
      for(let i=0;i<3;i++){
        const h=.38+i*.35;
        round(1.15,h,1.48,0xab875b,x-3.6+i*.98,h/2+.1,z-1.8);
        box(1.18,.09,1.52,0xc5a06c,x-3.6+i*.98,h+.12,z-1.8);
      }
      for(let i=0;i<4;i++)oval(.46,.35+i%2*.18,.37,0x99997e,x-4+i*.55,.22,z+.05);
      round(1.55,.58,1,0xbfa557,x+2.8,.39,z-1.35);
    }else if(kind==='pig'){
      for(const dx of [-4.1,-1.8,.5])box(.19,.85,1.86,0xba9584,x+dx,.55,z-1.92);
      oval(1.64,.055,1.18,0x8a7156,x+2.3,.14,z+.1);
      for(const dx of [1.9,2.6])oval(.58,.019,.31,0x988165,x+dx,.19,z+.16);
    }else{
      oval(2.55,.08,1.88,0xb7af88,x+1.6,.13,z-.56);
      oval(2.36,.065,1.70,0x6ba59c,x+1.6,.20,z-.56);
      for(let i=0;i<12;i++){
        const a=i*.21,h=.4+(i%3)*.16;
        cyl(.028,h,0x788b4f,x+1.6+2.3*Math.cos(a),.2+h/2,z-.56-1.61*Math.sin(a));
      }
      plank(1.45,.72,x-.56,.30,z+.59);
    }
    const positions=[[-3.55,1.43],[-1.44,.29],[.62,1.62],[2.87,.75]];
    positions.forEach(([dx,dz],i)=>animal(kind,x+dx,z+dz,(kind==='goat'?1.48:kind==='pig'?1.42:1.34)*(i===1?.84:1)));
    round(2.65,.32,.52,0x877858,x,.28,z+2.84);
    box(2.45,.045,.36,0xc7ad68,x,.46,z+2.84);
    cyl(.35,.23,0x859789,x+4.15,.24,z+2.07);cyl(.29,.024,0x72a6a1,x+4.15,.365,z+2.07);
  }
  label('ANIMAL CARE',55.5,3.1,12.7,6,.55);for(const x of [52.5,58.5])round(.14,3.3,.14,0x5d724e,x,1.65,12.6);
  // Feed sacks, compost bins, washing station, boot brush and a parked wheelbarrow.
  for(let i=0;i<5;i++)oval(.25,.42,.25,0xb8a378,69.5+(i%2)*.65,.46,22.5+Math.floor(i/2)*.6);
  for(let i=0;i<2;i++)cyl(.35,.75,0x617e68,71+i*.85,.47,25.8);
  box(1.5,.12,.6,0xb8bca2,71,1.1,29);for(const s of [-1,1])pipe([70.4+s*.1,.1,29],[70.4+s*.1,1.1,29],.035,0x667964);pipe([71.4,1.1,29],[71.4,1.5,29],.025,0x7e9690);pipe([71.4,1.5,29],[71,1.5,29],.025,0x7e9690);
  const barrow=round(.8,.3,1.1,0x66806a,70,.64,32);barrow.rotation.x=.12;const wheel=ring(.23,.06,0x414b3d,70,.3,32.5);wheel.rotation.y=Math.PI/2;for(const s of [-1,1])pipe([70+s*.32,.5,32],[70+s*.4,.78,30.9],.025,0x8a7655);

  const waterTime={value:0};
  function water(w:number,d:number,x:number,z:number,pool=false){
    const mat=new THREE.MeshStandardMaterial({color:pool?0x53b4cc:0x5a9486,transparent:true,opacity:pool?.7:.58,roughness:.23,metalness:.12,depthWrite:false});
    mat.onBeforeCompile=shader=>{shader.uniforms.uDistrictWater=waterTime;shader.vertexShader='varying vec2 vDistrictWater;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDistrictWater=position.xy;');shader.fragmentShader='uniform float uDistrictWater;varying vec2 vDistrictWater;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat ripple=sin(vDistrictWater.x*10.+sin(vDistrictWater.y*8.+uDistrictWater)*2.-uDistrictWater*1.8);float caustic=sin(vDistrictWater.x*17.+vDistrictWater.y*13.+uDistrictWater)*sin(vDistrictWater.y*19.-vDistrictWater.x*7.-uDistrictWater*.7);diffuseColor.rgb*=.95+.06*ripple+.15*pow(max(0.,caustic),5.);');};
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);m.rotation.x=-Math.PI/2;m.position.set(x,.23,z);root.add(m);return m;
  }
  const pond=FISH_POND;surface(pond.w+3,pond.d+3,0xb6ab86,pond.x,pond.z,'stone');box(pond.w,.08,pond.d,0x687b5f,pond.x,.02,pond.z);water(pond.w,pond.d,pond.x,pond.z);
  for(const side of [-1,1]){box(pond.w+.6,.22,.5,0x9e9c7f,pond.x,.21,pond.z+side*(pond.d/2+.25));box(.5,.22,pond.d,0x9e9c7f,pond.x+side*(pond.w/2+.25),.21,pond.z);}
  plank(FEED_DECK.w,FEED_DECK.d,FEED_DECK.x,.105,FEED_DECK.z);
  for(const x of [FEED_DECK.x-2.4,FEED_DECK.x+2.4]){for(const z of [3.1,5.8])box(.08,1.05,.08,0x6d8060,x,.56,z);box(.07,.07,3,0x78906b,x,1.04,4.5);}
  label('FISH POND',60.8,1.6,6.5,3.2,.45);for(const x of [59.4,62.2])box(.08,1.9,.08,0x6d8060,x,.95,6.5);
  const fish:{group:THREE.Group;tail:THREE.Mesh;phase:number;radius:number}[]=[];
  for(let i=0;i<22;i++){const g=new THREE.Group();root.add(g);g.position.y=.135;oval(.14,.09,.35,[0xb6a974,0x8c9b82,0xc29166][i%3],0,0,0,g);for(const s of [-1,1])oval(.016,.016,.012,0x263b2f,s*.1,.02,.23,g);const fin=part(new THREE.ConeGeometry(.17,.23,3),0x7c8d70,g,0,0,-.36);fin.rotation.x=Math.PI/2;fin.scale.z=.14;bake(g);const tail=part(new THREE.ConeGeometry(.16,.2,3),0x8d987b,g,0,0,-.38);tail.rotation.x=Math.PI/2;tail.scale.z=.12;fish.push({group:g,tail,phase:i*2.399,radius:1+i%7*.8});}
  // Aerator paddle, floating service buoys, reeds and a rainwater channel.
  const aerator=new THREE.Group();aerator.position.set(62,.35,-7);root.add(aerator);for(const s of [-1,1])round(.3,.3,2.2,0x708d89,62+s*.8,.3,-7);pipe([61,.6,-7],[63,.6,-7],.04,0x869385);for(let i=0;i<6;i++){const blade=box(1.5,.06,.45,0xb4c4a6,0,0,0,aerator);blade.rotation.x=i*Math.PI/3;}box(.5,.4,.5,0x5a6f55,62,.65,-7);
  for(let i=0;i<45;i++){const x=pond.x-pond.w/2+.3+random()*(pond.w-.6),z=pond.z-pond.d/2-.55;pipe([x,.1,z],[x+(random()-.5)*.2,.55+random()*.55,z],.018,0x6a7f40);}
  const net=ring(.36,.018,0xb5b095,71,.95,-.5);net.rotation.y=.4;pipe([71,.7,-.5],[71,.12,1.1],.025,0x8b7853);round(.6,.6,.6,0x708672,70,.4,1);round(.6,.6,.6,0x708672,71,.4,1);

  const pool=SWIMMING_POOL;
  surface(pool.deckW,pool.deckD,0xd4d9c8,pool.x,pool.z,'pavers');
  const basin = { x: 56, z: -40, w: 18, d: 12 };
  box(basin.w,.06,basin.d,0x6eb8ce,basin.x,.02,basin.z);
  water(basin.w,basin.d,basin.x,basin.z,true);
  for(const side of [-1,1]){
    const z=basin.z+side*(basin.d/2+.14),x=basin.x+side*(basin.w/2+.14);
    box(basin.w+.55,.24,.32,0xf0efe1,basin.x,.17,z);
    box(.32,.24,basin.d,0xf0efe1,x,.17,basin.z);
    box(basin.w,.045,.055,0x458e9a,basin.x,.19,z-side*.13);
    box(.055,.045,basin.d,0x458e9a,x-side*.13,.19,basin.z);
  }
  for(let lane=0;lane<4;lane++){
    const z=basin.z+3*(lane-1.5);
    box(16.2,.018,.11,0x245668,basin.x,.07,z);
    for(const x of [48.4,63.6])box(.11,.02,1.15,0x245668,x,.071,z);
    if(lane<3){
      const ropeZ=z+1.5;
      box(18,.022,.024,0xd2e6da,56,.265,ropeZ);
      for(let i=0;i<54;i++){
        const x=47.15+i*.335;
        const float=cyl(.102,.19,i<6||i>47?0xd17962:i%8<4?0xffefd3:0x3c8ba2,x,.272,ropeZ);
        float.rotation.z=Math.PI/2;
      }
    }
  }
  for(const x of [48,64]){for(const side of [-1,1]){pipe([x+side*.35,.25,-33.5],[x+side*.35,1.1,-33.5],.03,0xa2b5a9);pipe([x+side*.35,1.1,-33.5],[x+side*.35,1.1,-34.3],.03,0xa2b5a9);pipe([x+side*.35,1.1,-34.3],[x+side*.35,.05,-34.3],.03,0xa2b5a9);}for(let i=0;i<3;i++)pipe([x-.35,.2+i*.22,-34.25],[x+.35,.2+i*.22,-34.25],.025,0xa2b5a9);}
  // Deck drains, depth labels, rescue equipment and shower cubicles.
  for(const z of [-46.8,-33.2])for(let i=0;i<53;i++)box(.14,.018,.24,0x8e9f90,46.4+i*.37,.1,z);
  label('1.2 m',47,.35,-33.1,1,.22);label('WATER SAFETY',57,.45,-33.1,3,.26);label('CAMPUS AQUATICS',53,3.15,-27.8,6.3,.67);
  for(const x of [49.9,56.1])round(.13,3.5,.13,0x607455,x,1.75,-28);
  for(const x of [61,62]){const life=ring(.34,.085,0xe1aa62,x,1.1,-32.05);for(const side of [-1,1])round(.09,.7,.1,0xe4d8b7,x+side*.12,1.1,-32);life.name='Rescue ring';}box(1.6,.08,.6,0x687958,61,.3,-32);
  for(let i=0;i<3;i++){const x=51+i*3;pipe([x,.1,-51.5],[x,2.2,-51.5],.03,0x9fae9a);pipe([x,2.2,-51.5],[x,2.2,-50.9],.03,0x9fae9a);oval(.12,.035,.12,0x8a9e91,x,2.17,-50.9);box(.8,.04,.8,0xb0b7a1,x,.1,-51.2);}
  const throwRing=ring(.32,.07,0xe4a363,0,0,0,root);throwRing.visible=false;

  const training=TRAINING_GROUND;surface(training.w,training.d,0xc5b18a,training.x,training.z,'stone');label('CONFIDENCE COURSE',0,3.15,-32.4,8,.5);
  for(const x of [-4,4])round(.12,3.5,.12,0x687957,x,1.75,-32.5);
  // Six paired tyres, a real beam with feet, a knotted climbing net and pull-up bars.
  for(let row=0;row<4;row++)for(const side of [-1,1]){const t=ring(.43,.13,0x4b5143,-10+side*.8,.18,-45+row*1.25);t.rotation.x=-Math.PI/2;for(let j=0;j<10;j++){const a=j*.628;const tread=box(.1,.08,.09,0x626352,-10+side*.8+Math.cos(a)*.43,.3,-45+row*1.25+Math.sin(a)*.43);tread.rotation.y=-a;}}
  round(BALANCE_BEAM.w,.16,BALANCE_BEAM.d,0xa08a62,-2,BALANCE_BEAM.top-.08,-43);for(const z of [-45,-41])box(.75,.37,.25,0x6d7654,-2,.265,z);
  for(const x of [6.5,11.5])round(.14,3.1,.14,0x6e7959,x,1.55,-48);pipe([6.5,3.05,-48],[11.5,3.05,-48],.07,0x6e7959);
  for(let i=0;i<9;i++)pipe([6.7+i*.57,.15,-48],[6.7+i*.57,3,-48],.018,0xa99b70);for(let i=0;i<7;i++){pipe([6.7,.25+i*.43,-48],[11.3,.25+i*.43,-48],.018,0xa99b70);for(let j=0;j<9;j++)oval(.032,.032,.03,0xb9aa7c,6.7+j*.57,.25+i*.43,-48);}
  box(3,1.15,.4,0x8b9a70,5,.63,-41);for(let i=0;i<6;i++)box(3,.03,.43,0xb9ba88,5,.18+i*.2,-41);
  for(const x of [9.3,12.7])cyl(.055,2.3,0x68785b,x,1.2,-37.5);pipe([9.3,2.3,-37.5],[12.7,2.3,-37.5],.04,0x9caa8a);
  shelter(-12,-34,6,3.5,2.6);label('REST · DRINK WATER',-12,2.1,-32.1,4,.35);
  for(let i=0;i<4;i++)cyl(.13,.4,0x779385,-14+i*.35,1.05,-34);box(2,.1,.7,0xa88b5e,-13.5,.8,-34);
  for(const {x,z} of TRAINING_CONES)part(new THREE.ConeGeometry(.13,.4,10),0xc58a4d,staticRoot,x,.28,z);

  const picks:THREE.Object3D[]=[];
  for(const s of DISTRICT_STATIONS){
    const target=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.6,1.1),new THREE.MeshBasicMaterial({visible:false}));target.position.set(s.x,.8,s.z);target.userData.district=s.id;root.add(target);picks.push(target);
    const marker=new THREE.Mesh(new THREE.RingGeometry(.48,.54,32),new THREE.MeshBasicMaterial({color:0xdfc888,side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.set(s.x,.125,s.z);root.add(marker);
  }
  const foodGeometry=new THREE.SphereGeometry(.025,4,3),food=new THREE.InstancedMesh(foodGeometry,new THREE.MeshStandardMaterial({color:0xcdb06a,roughness:1}),36);food.visible=false;food.frustumCulled=false;root.add(food);const dummy=new THREE.Object3D();
  function bake(parent:THREE.Object3D){const meshes=parent.children.filter((c):c is THREE.Mesh=>c instanceof THREE.Mesh&&c.material===solid);if(!meshes.length)return;const geos=meshes.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);return g;});const merged=mergeGeometries(geos);geos.forEach(g=>g.dispose());if(!merged)return;const m=new THREE.Mesh(merged,solid);m.castShadow=m.receiveShadow=true;parent.add(m);meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose();});}
  // Enlarge real district footprints while retaining human/animal size and vertical clearances.
  const families=createFarmFamilies();scene.add(families.root);
  const animalGroups=new Set(animals.map(a=>a.group));
  for(const object of [...staticRoot.children,...root.children]){
    if(object===staticRoot||object===food||object===throwRing||object.userData.fixed)continue;
    const id=baseDistrictAt(object.position);if(!id)continue;
    const t=DISTRICT_TRANSFORMS[id],point=districtPoint(id,object.position);
    if(animalGroups.has(object as THREE.Group)){object.position.set(point.x,object.position.y,point.z);continue;}
    const transform=new THREE.Matrix4().makeScale(t.scale,1,t.scale);transform.setPosition(t.toX-t.x*t.scale,0,t.toZ-t.z*t.scale);
    if(object.parent===staticRoot&&object instanceof THREE.Mesh){object.updateMatrix();object.geometry.applyMatrix4(transform.multiply(object.matrix));object.position.set(0,0,0);object.rotation.set(0,0,0);object.scale.set(1,1,1);}
    else object.applyMatrix4(transform);
  }
  bake(staticRoot);
  const speciesFor: Record<string,PetId> = { chicken:'chickens',pig:'pigs',goat:'goats',duck:'ducks' };
  let stateBySpecies: Partial<Record<PetId,ReturnType<typeof petStatus>>> = {};
  let lastCare: PetCare | undefined, lastHealthCheck = -Infinity;
  return {picks,updateWater(time:number){waterTime.value=time;},update(time:number,reduced:boolean,active:DistrictStationId|null,percent:number,care:PetCare|undefined,viewer:{x:number;z:number}){
    families.update(time,reduced,viewer);
    care??={};
    const t=reduced?0:time;waterTime.value=t;aerator.rotation.x=t*1.8;
    if(lastCare!==care||time-lastHealthCheck>=1){lastCare=care;lastHealthCheck=time;stateBySpecies={};}
    const statusFor=(species:PetId)=>stateBySpecies[species]??=petStatus(care!,species);
    for(const a of animals){
      const species=speciesFor[a.kind],status=statusFor(species);
      const g=a.group;
      g.userData.careScale??=g.scale.x;
      g.scale.setScalar(g.userData.careScale*status.scale);
      const home=g.userData.home??=g.position.clone();
      const phase=a.phase+t*.42,walk=status.health<40||reduced?0:1;
      const feeding=active===`feed-${species}`;
      g.position.x=home.x+Math.sin(phase)*.32*walk;
      g.position.z=home.z+Math.cos(phase)*.19*walk;
      g.rotation.y=feeding?Math.atan2(75-home.x,38-home.z):Math.atan2(.32*Math.cos(phase),-.19*Math.sin(phase));
      g.rotation.z=status.health<40?.10:0;
      a.head.rotation.x=reduced?0:feeding?.22+Math.sin(t*5+a.phase)*.18:.08+Math.sin(t*1.4+a.phase)*.12;
      for(const [i,leg] of a.legs.entries())leg.rotation.x=feeding?0:Math.sin(phase*4+(i===1||i===2?Math.PI:0))*.13*walk;
    }
    for(const f of fish){f.group.scale.setScalar(1.5*statusFor('fish').scale);const feeding=active==='feed-fish',r=feeding?.8+f.radius*.22:f.radius,centerZ=feeding?.6:-4;const p=districtPoint('fish-pond',{x:56+Math.cos(t*.22+f.phase)*r,z:centerZ+Math.sin(t*.22+f.phase)*r*.65});f.group.position.set(p.x,.14,p.z);f.group.rotation.y=-t*.22-f.phase;f.tail.rotation.z=Math.sin(t*5+f.phase)*.3;}
    food.visible=!!active&&active.startsWith('feed-')&&percent<1&&!reduced;
    if(food.visible){const station=DISTRICT_STATIONS.find(s=>s.id===active)!;for(let i=0;i<36;i++){const phase=(percent*5+i/36)%1;dummy.position.set(THREE.MathUtils.lerp(station.x,station.look.x,phase)+Math.sin(i*19)*phase*.35,1.15+Math.sin(phase*Math.PI)*.7-phase,THREE.MathUtils.lerp(station.z,station.look.z,phase)+Math.cos(i*8)*phase*.35);const p=districtPoint(baseDistrictAt(station),dummy.position);dummy.position.x=p.x;dummy.position.z=p.z;dummy.scale.setScalar(1);dummy.updateMatrix();food.setMatrixAt(i,dummy.matrix);}food.instanceMatrix.needsUpdate=true;}
    throwRing.visible=active==='rescue-ring';if(throwRing.visible){const p=THREE.MathUtils.smoothstep(percent,.18,.85);const at=districtPoint('swimming',{x:56,z:-32-p*5});throwRing.position.set(at.x,1.3+Math.sin(p*Math.PI)*2.3-p*1.04,at.z);throwRing.rotation.set(Math.PI/2+p*.3,0,p*2.2);}
  }};
}
