import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {diningLayout} from './dining-layout.ts';

type Room = Parameters<typeof diningLayout>[0];
export function createDiningRoom(b:Room) {
  const group=new THREE.Group();
  group.name='Dining hall interior';
  const {tables,stations}=diningLayout(b);
  const steel=0xa4b6af, dark=0x455453, sage=0x577663, wood=0xb57945, cream=0xf2e4c6;
  const matte=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.83});
  const metal=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.36});
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>([[matte,[]],[metal,[]]]);
  function part(geo:THREE.BufferGeometry,color:number,x:number,y:number,z:number,finish=matte) {
    const flat=geo.index?geo.toNonIndexed():geo;
    if(flat!==geo)geo.dispose();
    const tone=new THREE.Color(color), length=flat.getAttribute('position').count;
    const colors=new Float32Array(length*3);
    for(let i=0;i<length;i++)tone.toArray(colors,i*3);
    flat.setAttribute('color',new THREE.BufferAttribute(colors,3));
    flat.translate(x,y,z);
    batches.get(finish)!.push(flat);
  }
  const box=(w:number,h:number,d:number,color:number,x:number,y:number,z:number,finish=matte)=>
    part(new THREE.BoxGeometry(w,h,d),color,x,y,z,finish);
  const round=(rt:number,rb:number,h:number,color:number,x:number,y:number,z:number,finish=matte)=>
    part(new THREE.CylinderGeometry(rt,rb,h,16),color,x,y,z,finish);
  function label(lines:string[],w:number,h:number,x:number,y:number,z:number) {
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=Math.max(96,Math.round(640*h/w));
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#284d40';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='#ceb87d';ctx.lineWidth=6;ctx.strokeRect(7,7,canvas.width-14,canvas.height-14);
    const lineH=(canvas.height-18)/lines.length;
    ctx.textAlign='center';ctx.textBaseline='middle';
    lines.forEach((line,i)=>{ctx.font='bold '+Math.floor(lineH*.65)+'px sans-serif';ctx.fillStyle=i?'#f7f2dc':'#f3d392';ctx.fillText(line,320,9+(i+.5)*lineH,600);});
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));
    mesh.position.set(x,y,z);group.add(mesh);
  }

  // Glazed splashback, ceramic floor joints and painted skirting.
  const back=b.z-b.d/2+.12;
  box(b.w-.2,1.7,.06,0xc2d7c9,b.x,1.17,back);
  box(b.w-.2,.09,.09,sage,b.x,2.04,back+.015);
  for(let x=b.x-b.w/2+.75;x<b.x+b.w/2;x+=.75)box(.015,1.64,.025,0x92afa1,x,1.17,back+.04);
  for(let y=.58;y<2;y+=.36)box(b.w-.2,.015,.025,0x92afa1,b.x,y,back+.04);
  for(let x=b.x-b.w/2+1;x<b.x+b.w/2;x++)box(.014,.008,b.d-.24,0xb5af96,x,.295,b.z);
  for(let z=b.z-b.d/2+1;z<b.z+b.d/2;z++)box(b.w-.24,.008,.014,0xb5af96,b.x,.295,z);

  const {wash,trays,counter,fridge,returns}=stations;
  for(const s of [wash,trays,counter]){
    box(s.w-.12,.77,s.d-.15,sage,s.x,.775,s.z);
    box(s.w,.1,s.d,steel,s.x,1.21,s.z,metal);
    box(s.w-.2,.08,s.d-.2,dark,s.x,.35,s.z);
  }
  // Handwashing basin, raised tap and soap dispenser.
  box(1.25,.02,.69,dark,wash.x,1.27,wash.z);
  box(1.03,.026,.47,0x91a6a3,wash.x,1.28,wash.z);
  round(.042,.042,.52,steel,wash.x,1.50,wash.z-.36,metal);
  box(.085,.08,.28,steel,wash.x,1.75,wash.z-.25,metal);
  box(.19,.25,.16,0xd4b56c,wash.x+.66,1.4,wash.z-.35);
  for(let i=0;i<7;i++)box(1.15,.036,.62,i%2?steel:dark,trays.x,1.29+i*.037,trays.z,metal);
  label(['WASH HANDS'],1.85,.36,wash.x,2.3,back+.09);
  label(['TRAYS'],1.6,.36,trays.x,2.3,back+.09);

  // Service rail, rice cooker, inset hot wells and a transparent sneeze guard.
  round(.44,.38,.48,cream,counter.x-2.94,1.5,counter.z);
  round(.46,.42,.09,steel,counter.x-2.94,1.78,counter.z,metal);
  box(.22,.09,.09,dark,counter.x-2.94,1.86,counter.z);
  for(const [i,color] of [0x65874b,0xc58a47,0xbfa256].entries()){
    const x=counter.x-1.55+i*1.43;
    box(1.22,.06,.84,steel,x,1.29,counter.z,metal);
    box(1.07,.07,.69,dark,x,1.31,counter.z);
    box(.96,.075,.58,color,x,1.33,counter.z);
    for(let j=0;j<5;j++)round(.095,.11,.055,j%2?color:0xcfa25d,x-.34+j*.15,1.39,counter.z+(j%2?-.12:.08));
  }
  for(const dx of [-2.12,2.33])round(.035,.035,.72,steel,counter.x+dx,1.60,counter.z+.5,metal);
  box(4.53,.055,.065,steel,counter.x+.105,1.96,counter.z+.5,metal);
  const glass=new THREE.Mesh(new THREE.BoxGeometry(4.43,.52,.024),new THREE.MeshStandardMaterial({color:0xcbe5dd,transparent:true,opacity:.23,depthWrite:false}));
  glass.position.set(counter.x+.105,1.68,counter.z+.5);group.add(glass);
  label(['TODAY’S MENU','Rice  ·  Fish  ·  Greens'],4.25,1.03,counter.x,2.53,back+.09);
  // A covered tea urn with a spigot and an enamel cup at the end of service.
  const urnX=counter.x+3.1;
  round(.29,.28,.62,0x7a9a8a,urnX,1.6,counter.z,metal);
  round(.31,.29,.07,steel,urnX,1.94,counter.z,metal);
  box(.12,.07,.18,dark,urnX,1.46,counter.z+.32);
  round(.085,.068,.12,cream,urnX,1.33,counter.z+.44);
  // Slatted extract vents above the hot wells.
  for(const dx of [-2.85,2.85]){
    box(.93,.48,.07,steel,counter.x+dx,2.66,back+.10,metal);
    for(let row=0;row<4;row++)box(.76,.035,.035,dark,counter.x+dx,2.50+row*.09,back+.15);
  }
  for(let i=0;i<5;i++){const x=counter.x-3.04+i*1.52;
    box(1.43,.61,.05,0x789887,x,.80,counter.z+.54);
    box(.28,.04,.055,steel,x,1.02,counter.z+.59,metal);}
  box(fridge.w,2.15,fridge.d,steel,fridge.x,1.40,fridge.z,metal);
  for(const side of [-1,1]){
    box(.73,1.76,.045,0xc0ccc3,fridge.x+side*.39,1.46,fridge.z+.64,metal);
    box(.04,.45,.06,dark,fridge.x+side*.095,1.4,fridge.z+.70);}
  for(let i=0;i<5;i++)box(1.38,.025,.025,dark,fridge.x,.4+i*.045,fridge.z+.64);

  for(const t of tables){
    box(t.w,.12,1.02,wood,t.x,1.12,t.z);
    for(const dx of [-1.32,1.32]){
      for(const dz of [-.34,.34])box(.08,.77,.08,dark,t.x+dx,.68,t.z+dz,metal);
      box(.085,.085,1.82,dark,t.x+dx,.43,t.z,metal);
      for(const side of [-1,1])box(.08,.31,.08,dark,t.x+dx,.55,t.z+side*.84,metal);}
    for(const side of [-1,1]){
      for(const slat of [-.09,.09])box(t.w-.12,.085,.16,wood,t.x,.72,t.z+side*.84+slat);
      for(const dx of [-1.05,1.05]){
        const z=t.z+side*.30;
        round(.16,.09,.115,cream,t.x+dx,1.235,z);
        round(.13,.13,.014,0xd2bc90,t.x+dx,1.295,z);
        for(const gap of [0,.035])box(.018,.02,.32,0x764a31,t.x+dx+.23+gap,1.195,z);
      }
    }
    round(.105,.11,.21,sage,t.x,1.28,t.z);
    for(const dx of [-.045,.03])box(.025,.24,.025,wood,t.x+dx,1.45,t.z);
  }
  for(const dx of [-.96,.96])for(const dz of [-.28,.28])round(.04,.04,.99,steel,returns.x+dx,.84,returns.z+dz,metal);
  for(const y of [.48,.85,1.32])box(returns.w,.055,returns.d,steel,returns.x,y,returns.z,metal);
  for(let j=0;j<5;j++)round(.25,.21,.045,cream,returns.x+.45,1.37+j*.04,returns.z);
  label(['TRAY RETURN'],1.86,.31,returns.x,1.13,returns.z+.38);
  for(const [material,parts] of batches){
    const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
    if(geometry){const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}
  }
  group.visible=false;
  return group;
}
