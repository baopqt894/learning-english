import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type CharacterKind = "cadet" | "linh" | "library" | "canteen";

/** Rounded, articulated figures based on the original CampusQuest character art. */
export function createCampusCharacter(kind: CharacterKind, backpack = false) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const uniform = kind === "cadet" || kind === "linh";
  const fabricCanvas=document.createElement("canvas");fabricCanvas.width=64;fabricCanvas.height=64;
  const fabricContext=fabricCanvas.getContext("2d")!;
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const shade=218+((x*17+y*31+x*y)%31);
    fabricContext.fillStyle=`rgb(${shade},${shade},${shade})`;fabricContext.fillRect(x,y,1,1);
  }
  const fabric=new THREE.CanvasTexture(fabricCanvas);fabric.wrapS=fabric.wrapT=THREE.RepeatWrapping;fabric.repeat.set(4,6);
  const materials = new Map<number, THREE.MeshStandardMaterial>();
  const material = (color: number) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: color===colors.skin ? .68:.92, map: color===colors.cloth || color===colors.pants ? fabric:null }));
    return materials.get(color)!;
  };
  const colors = {
    skin: 0xe7b58e, cheek: 0xd9a083, hair: 0x302a25,
    cloth: uniform ? 0x58643a : kind === "library" ? 0x909477 : 0xbea875,
    pants: uniform ? 0x454f30 : 0x4c4a36, boots: 0x343a29, gold: 0xc9a35d, red: 0xa84838,
  };
  const mesh = (geometry: THREE.BufferGeometry, color: number, parent: THREE.Object3D, x=0,y=0,z=0) => {
    const result = new THREE.Mesh(geometry, material(color));
    result.position.set(x,y,z);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  };
  const ellipsoid = (x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number,parent:THREE.Object3D=body) => {
    const result=mesh(new THREE.SphereGeometry(1,24,18),color,parent,x,y,z);
    result.scale.set(sx,sy,sz);
    return result;
  };
  const rounded = (w:number,h:number,d:number,color:number,parent:THREE.Object3D,x=0,y=0,z=0) => mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.22),color,parent,x,y,z);
  const capsule = (radius:number,length:number,color:number,parent:THREE.Object3D,x=0,y=0,z=0) => mesh(new THREE.CapsuleGeometry(radius,length,6,16),color,parent,x,y,z);
  const curve = (points:THREE.Vector3[],radius:number,color:number,parent:THREE.Object3D) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,radius,6,false),color,parent);
  const torso = mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.16,0),new THREE.Vector2(.205,.05),new THREE.Vector2(.21,.2),
    new THREE.Vector2(.255,.44),new THREE.Vector2(.24,.51),new THREE.Vector2(.15,.56),
  ],32),colors.cloth,body,0,.92,0);
  torso.scale.z=.66;
  capsule(.075,.1,colors.skin,body,0,1.52,0);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
  leftLeg.position.set(-.115,.92,0); rightLeg.position.set(.115,.92,0);
  body.add(leftLeg,rightLeg);
  const knees:THREE.Group[]=[];
  for(const leg of [leftLeg,rightLeg]) {
    capsule(.103,.26,colors.pants,leg,0,-.22,0);
    const knee=new THREE.Group(); knee.position.y=-.43; leg.add(knee); knees.push(knee);
    capsule(.086,.24,kind === "library" ? colors.skin : colors.pants,knee,0,-.17,0);
    ellipsoid(0,-.39,.055,.092,.075,.17,colors.boots,knee);
    rounded(.175,.028,.29,0x272d22,knee,0,-.445,.045);
  }
  if(kind === "library") {
    const skirt=mesh(new THREE.CylinderGeometry(.21,.34,.48,32),0x796b55,body,0,.72,0);
    skirt.scale.z=.7;
    rounded(.23,.44,.025,0xe8dfc7,body,0,1.18,.155);
  }
  rounded(.425,.065,.285,0x3b3c2b,body,0,.96,0);
  rounded(.07,.055,.022,colors.gold,body,0,.96,.15);
  // Folded collars and red shoulder tabs preserve the original cadet uniform.
  for(const side of [-1,1]) {
    const collar=rounded(.13,.12,.035,uniform ? colors.cloth : 0xe5d7b7,body,side*.075,1.425,.13);
    collar.rotation.z=side*.4;
    if(uniform) {
      rounded(.11,.065,.023,colors.red,body,side*.1,1.42,.151).rotation.z=side*.4;
      rounded(.115,.024,.14,colors.red,body,side*.225,1.47,0);
      ellipsoid(side*.215,1.49,.015,.012,.008,.012,colors.gold);
      rounded(.14,.14,.018,colors.cloth,body,side*.128,1.24,.155);
      rounded(.15,.03,.022,0x687449,body,side*.128,1.3,.17);
      ellipsoid(side*.128,1.285,.186,.009,.009,.004,colors.gold);
      curve([new THREE.Vector3(side*.128-.055,1.27,.173),new THREE.Vector3(side*.128-.055,1.18,.173),new THREE.Vector3(side*.128+.055,1.18,.173),new THREE.Vector3(side*.128+.055,1.27,.173)],.0025,0x899164,body);
    }
  }
  for(let i=0;i<4;i++) ellipsoid(0,1.34-i*.09,.172,.012,.012,.007,colors.gold);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();
  leftArm.position.set(-.285,1.43,0); rightArm.position.set(.285,1.43,0);
  body.add(leftArm,rightArm);
  const elbows:THREE.Group[]=[];
  for(const [i,arm] of [leftArm,rightArm].entries()) {
    const side=i ? 1:-1;
    capsule(.09,.19,colors.cloth,arm,0,-.13,0);
    const elbow=new THREE.Group(); elbow.position.y=-.31; arm.add(elbow); elbows.push(elbow);
    capsule(.068,.16,kind === "canteen" ? colors.skin : colors.cloth,elbow,0,-.105,0);
    if(uniform) rounded(.13,.038,.13,0x687449,elbow,0,-.2,0);
    ellipsoid(0,-.265,.015,.066,.09,.048,colors.skin,elbow);
    // Separate thumb and fingers avoid the block hands of the previous model.
    for(let f=0;f<4;f++) capsule(.012,.045,colors.skin,elbow,-.038+f*.024,-.33,.025);
    capsule(.018,.045,colors.skin,elbow,side*.065,-.26,.035).rotation.z=side*.6;
    arm.rotation.z=side*.07;
  }
  const head=new THREE.Group(); head.position.set(0,1.78,0); body.add(head);
  ellipsoid(0,.025,0,.219,.255,.205,colors.skin,head);
  ellipsoid(0,-.105,.04,.178,.14,.16,colors.skin,head);
  ellipsoid(0,.16,-.045,.226,.17,.19,colors.hair,head);
  ellipsoid(-.186,.04,-.047,.045,.15,.15,colors.hair,head);
  ellipsoid(.19,.07,-.06,.043,.13,.13,colors.hair,head);
  // Swept hair locks, sculpted along the forehead rather than a cubic hair cap.
  for(let i=0;i<5;i++) {
    const lock=ellipsoid(-.155+i*.067,.18-i*.015,.105,.075,.045,.115,colors.hair,head);
    lock.rotation.z=-.35;
  }
  const eyes:THREE.Group[]=[];
  for(const side of [-1,1]) {
    ellipsoid(side*.217,.015,0,.039,.065,.035,colors.skin,head);
    ellipsoid(side*.22,.014,.025,.017,.032,.012,colors.cheek,head);
    const eye=new THREE.Group(); eye.position.set(side*.086,.048,.187); head.add(eye); eyes.push(eye);
    ellipsoid(0,0,0,.052,.032,.016,0xf7efdb,eye);
    ellipsoid(side*-.004,-.002,.015,.023,.027,.008,0x63442b,eye);
    ellipsoid(side*-.004,-.002,.022,.013,.022,.005,0x25281f,eye);
    ellipsoid(-.008,.01,.027,.006,.007,.003,0xffffff,eye);
    curve([new THREE.Vector3(side*.04,.105,.18),new THREE.Vector3(side*.086,.115,.192),new THREE.Vector3(side*.13,.105,.165)],.009,colors.hair,head);
    ellipsoid(side*.13,-.045,.168,.041,.02,.008,colors.cheek,head);
  }
  ellipsoid(0,.005,.199,.03,.05,.036,colors.skin,head);
  ellipsoid(0,-.024,.221,.041,.022,.023,colors.skin,head);
  const mouth=new THREE.Group(); mouth.position.set(0,-.09,.189); head.add(mouth);
  const mouthInner=ellipsoid(0,0,0,.055,.012,.012,0x6c3830,mouth);
  const lowerLip=ellipsoid(0,-.012,.002,.052,.008,.012,0xba7c68,mouth);
  const upperLip=ellipsoid(0,.01,.003,.054,.007,.011,0xc38a72,mouth);
  const teeth=rounded(.073,.012,.007,0xf5ead7,mouth,0,.002,.014);
  if(uniform) {
    const cap=mesh(new THREE.CylinderGeometry(.235,.228,.105,32),colors.cloth,head,0,.247,-.012);
    cap.scale.z=.88;
    ellipsoid(0,.302,-.018,.225,.045,.195,0x657144,head);
    const visor=ellipsoid(0,.214,.185,.202,.018,.116,0x424d2e,head); visor.rotation.x=-.1;
    const badge=mesh(new THREE.CircleGeometry(.034,24),colors.red,head,0,.253,.2);
    badge.rotation.x=.04;
    const star=new THREE.Shape();
    for(let i=0;i<10;i++) {const a=Math.PI/2+i*Math.PI/5,r=i%2 ? .011:.025; if(!i) star.moveTo(Math.cos(a)*r,Math.sin(a)*r); else star.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
    star.closePath(); mesh(new THREE.ShapeGeometry(star),colors.gold,head,0,.253,.203);
  } else if(kind === "library") {
    ellipsoid(0,.02,-.19,.17,.145,.115,colors.hair,head);
    ellipsoid(.18,-.02,-.08,.058,.18,.045,colors.hair,head).rotation.z=-.22;
    for(const side of [-1,1]) {
      const glasses=mesh(new THREE.TorusGeometry(.064,.006,6,28),0xb6a073,head,side*.087,.05,.214);
      glasses.scale.y=.79;
    }
    rounded(.044,.006,.01,0xb6a073,head,0,.05,.22);
    const books=new THREE.Group(); leftArm.add(books); books.position.set(.06,-.35,.21); books.rotation.z=-.15;
    rounded(.19,.27,.065,0x4d6442,books); rounded(.16,.24,.025,0xe1d3b0,books,.01,0,.04);
    elbows[0].rotation.x=-.7;
  } else {
    const apron=mesh(new THREE.LatheGeometry([new THREE.Vector2(.185,0),new THREE.Vector2(.225,.15),new THREE.Vector2(.24,.4),new THREE.Vector2(.17,.58)],32),0x455b3a,body,0,.75,.018);
    apron.scale.z=.72;
    for(const side of [-1,1]) rounded(.035,.49,.02,0x455b3a,body,side*.16,1.26,.155).rotation.z=side*-.12;
    rounded(.19,.1,.02,0x536946,body,0,.94,.175);
    for(const side of [-1,1]) ellipsoid(side*.033,-.055,.196,.044,.014,.013,0x4b3829,head).rotation.z=side*.1;
  }
  if(backpack) {
    rounded(.33,.42,.17,0x9b8354,body,0,1.21,-.19);
    rounded(.26,.19,.07,0x806a42,body,0,1.1,-.29);
    for(const side of [-1,1]) rounded(.045,.47,.035,0xb49a69,body,side*.185,1.22,.152).rotation.z=side*.08;
  }
  if(kind === "linh") for(const side of [-1,1]) ellipsoid(side*.15,-.035,-.16,.06,.18,.06,colors.hair,head);
  return {group,body,head,leftLeg,rightLeg,leftArm,rightArm,knees,elbows,eyes,mouthInner,lowerLip,upperLip,teeth,kind};
}

export type CampusCharacter=ReturnType<typeof createCampusCharacter>;

/** Speech is approximate syllabic motion, gated by the actual utterance lifecycle. */
export function animateCharacter(rig:CampusCharacter,time:number,speaking:boolean,reducedMotion:boolean) {
  const syllable=speaking ? .25+.75*Math.abs(Math.sin(time*12.8)*Math.cos(time*4.7)) : 0;
  rig.mouthInner.scale.y=1+syllable*3.3;
  rig.lowerLip.position.y=-.012-syllable*.025;
  rig.teeth.visible=syllable>.12;
  rig.teeth.position.y=.003+syllable*.005;
  if(reducedMotion) {
    rig.body.position.y=0; rig.head.rotation.set(0,0,0);
    rig.leftArm.rotation.x=0;rig.rightArm.rotation.x=0;rig.rightArm.rotation.z=.07;
    rig.elbows[1].rotation.x=0;
    rig.eyes.forEach(eye=>eye.scale.y=1);
    return;
  }
  const blinkPhase=time%4.9;
  const blink=blinkPhase<.15 ? 1-Math.sin(blinkPhase/.15*Math.PI)*.96 : 1;
  rig.eyes.forEach(eye=>eye.scale.y=blink);
  rig.body.position.y=Math.sin(time*1.6)*.008;
  rig.head.rotation.x=speaking ? Math.sin(time*2.3)*.035 : Math.sin(time*.8)*.012;
  rig.head.rotation.y=Math.sin(time*.6)*.025;
  rig.head.rotation.z=Math.sin(time*.9)*.018;
  rig.rightArm.rotation.z=speaking ? -.16-Math.sin(time*1.4)*.06 : .07;
  rig.rightArm.rotation.x=speaking ? -.18-Math.sin(time*2)*.12 : Math.sin(time)*.025;
  rig.elbows[1].rotation.x=speaking ? -.55-Math.sin(time*1.4)*.18 : -.06;
  if(rig.kind!=="library") rig.elbows[0].rotation.x=speaking ? -.15-Math.sin(time*1.3)*.1 : -.05;
}
