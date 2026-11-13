import * as THREE from 'three';

export type SculptRing = {y:number; x:number; z:number; cx?:number; cz?:number};
/** A continuous, closed elliptical loft. Catmull-Rom interpolation removes primitive joints. */
export function sculptLoft(rings: SculptRing[], segments=32, steps=48, folds=0) {
  if(rings[0].y>rings[rings.length-1].y)rings=[...rings].reverse();
  const profile=new THREE.CatmullRomCurve3(rings.map(r=>new THREE.Vector3(r.x,r.y,r.z)),false,'catmullrom',.3);
  const center=new THREE.CatmullRomCurve3(rings.map(r=>new THREE.Vector3(r.cx||0,r.y,r.cz||0)),false,'catmullrom',.3);
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(let j=0;j<=steps;j++){
    const v=j/steps,p=profile.getPoint(v),c=center.getPoint(v);
    for(let i=0;i<=segments;i++){
      const u=i/segments,a=u*Math.PI*2;
      const wrinkle=1+folds*Math.sin(a*5+v*17)*Math.sin(Math.PI*v)**2+folds*.4*Math.sin(a*9-v*29);
      positions.push(c.x+Math.sin(a)*Math.max(.0001,p.x)*wrinkle,p.y,c.z+Math.cos(a)*Math.max(.0001,p.z)*wrinkle);
      uvs.push(u,v);
      if(i<segments&&j<steps){const k=j*(segments+1)+i;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const normals=geometry.attributes.normal;for(let j=0;j<=steps;j++){const a=j*(segments+1),b=a+segments,n=new THREE.Vector3(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}
  return geometry;
}

/** One sculpted cranium/jaw surface, with integrated cheeks, eye sockets, muzzle and nose bridge. */
export function sculptCadetHead() {
  const geometry=sculptLoft([
    {y:-.232,x:.001,z:.001,cz:.015},{y:-.215,x:.085,z:.09,cz:.022},
    {y:-.16,x:.151,z:.139,cz:.012},{y:-.085,x:.194,z:.177},
    {y:.015,x:.207,z:.184},{y:.105,x:.2,z:.176,cz:-.012},
    {y:.185,x:.159,z:.142,cz:-.022},{y:.226,x:.075,z:.075,cz:-.024},{y:.238,x:.001,z:.001,cz:-.024},
  ],64,72);
  const p=geometry.attributes.position,colors:number[]=[];
  const base=new THREE.Color(0xeeb38a),blush=new THREE.Color(0xdd8d75);
  const g=(x:number,y:number,sx:number,sy:number)=>Math.exp(-x*x/sx-y*y/sy);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),front=THREE.MathUtils.smoothstep(z,.06,.15);
    const cheek=g(Math.abs(x)-.118,y+.065,.003,.003)*front;
    const nose=(.03*g(x,y+.015,.0009,.001)+.012*g(x,y-.04,.0005,.006))*front;
    const socket=.009*g(Math.abs(x)-.084,y-.032,.0018,.0014)*front;
    const muzzle=.009*g(x,y+.13,.007,.0015)*front;
    p.setZ(i,z+nose-socket+muzzle+cheek*.006);
    const c=base.clone().lerp(blush,cheek*.37);colors.push(c.r,c.g,c.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const normal=geometry.attributes.normal;for(let j=0;j<=72;j++){const a=j*65,b=a+64,n=new THREE.Vector3(normal.getX(a)+normal.getX(b),normal.getY(a)+normal.getY(b),normal.getZ(a)+normal.getZ(b)).normalize();normal.setXYZ(a,n.x,n.y,n.z);normal.setXYZ(b,n.x,n.y,n.z);}
  return geometry;
}

/** Continuous hair shell with an asymmetric swept fringe; no overlapping hair balls. */
export function sculptCadetHair(female=false) {
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[],colors:number[]=[];
  const segments=80,rows=28;
  for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){
    const u=i/segments,a=u*Math.PI*2,front=Math.max(0,Math.cos(a));
    const fringe=1.9-front*.75+front*(.085*Math.sin(a*5-.7)+.035*Math.sin(a*9));
    const theta=.006+j/rows*fringe;
    const ridge=1+.019*Math.sin(a*18+theta*7)*Math.sin(theta);
    positions.push(Math.sin(theta)*Math.sin(a)*.227*ridge,Math.cos(theta)*.263-.003,Math.sin(theta)*Math.cos(a)*.224*ridge-.009+front*.02);
    uvs.push(u,j/rows);
    const c=new THREE.Color(0x29251f).multiplyScalar(.87+.18*Math.sin(a*18+theta*7));colors.push(c.r,c.g,c.b);
    if(i<segments&&j<rows){const k=j*(segments+1)+i;indices.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  if(female)geo.scale(1.015,1,1.015);return geo;
}

/** A tapered sculpted ribbon follows the swept fringe, adding real overlapping locks and fine ridges. */
export function sculptHairLock(points:THREE.Vector3[],width:number){
  const curve=new THREE.CatmullRomCurve3(points),pos:number[]=[],colors:number[]=[],uv:number[]=[],index:number[]=[];
  for(let j=0;j<=24;j++){const t=j/24,p=curve.getPoint(t),d=curve.getTangent(t),perp=new THREE.Vector3(-d.y,d.x,0).normalize(),w=width*(.45+.55*Math.sin(Math.PI*t))*(1-t*.94);
    for(let k=0;k<=4;k++){const u=k/2-1,v=p.clone().addScaledVector(perp,u*w);v.z+=(1-u*u)*.009*(1-t);pos.push(v.x,v.y,v.z);uv.push(k/4,t);const c=new THREE.Color(0x393029).multiplyScalar(.83+Math.sin(k*2+j*.2)*.11);colors.push(c.r,c.g,c.b);if(j<24&&k<4){const a=j*5+k;index.push(a,a+5,a+1,a+1,a+5,a+6);}}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);geo.computeVertexNormals();return geo;
}
