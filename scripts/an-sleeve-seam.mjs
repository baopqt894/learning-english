import sharp from 'sharp';
import {Vector3} from 'three';

export async function cutSleeves(scan,uvs) {
 const {positions,normals,joints,weights,delta}=scan;
 const {data,info}=await sharp('public/models/tripo-h31/color-original.jpg').removeAlpha().raw().toBuffer({resolveWithObject:true});
 const isSkin=(u,v)=>{
  const x=Math.floor(u*(info.width-1)),y=Math.floor(v*(info.height-1)),k=(y*info.width+x)*info.channels;
  return data[k]>124 && data[k]>1.13*data[k+1];
 };
 const skin=Array.from({length:positions.length/3},(_,i)=>isSkin(uvs[i*2],uvs[i*2+1]));
 const onArm=i=>Math.abs(positions[i*3])>.23&&positions[i*3+1]>.44&&positions[i*3+1]<.92;
 const splitFaces=[];
 const cache=new Map(),alongEdge=new Map(),tags=new Set(),clothUV=new Map(),faces=[];
 const key=i=>positions.slice(3*i,3*i+3).map(n=>n.toFixed(5)).join(',');
 function crossing(a,b){
  const edge=[a,b].sort((a,b)=>a-b).join('/');
  if(cache.has(edge))return cache.get(edge);
  // a is the cloth endpoint. All UV copies use the same cut position,
  // but each island retains its own interpolated UV and normal.
  if(skin[a]&&onArm(a))[a,b]=[b,a];
  const geomEdge=key(a)+'/'+key(b);
  let t=alongEdge.get(geomEdge);
  if(t===undefined){
   let lo=0,hi=1;
   for(let k=0;k<10;k++){
    const f=(lo+hi)/2;
    const u=uvs[2*a]*(1-f)+uvs[2*b]*f,v=uvs[2*a+1]*(1-f)+uvs[2*b+1]*f;
    if(isSkin(u,v))hi=f;else lo=f;
   }
   t=Math.min(.995,Math.max(.005,(lo+hi)/2));alongEdge.set(geomEdge,t);
  }
  const id=positions.length/3;cache.set(edge,id);tags.add(id);skin.push(true);
  const du=uvs[2*b]-uvs[2*a],dv=uvs[2*b+1]-uvs[2*a+1];
  const shade=Math.max(0,t-4/Math.max(1,Math.hypot(du*info.width,dv*info.height)));
  clothUV.set(id,[uvs[2*a]+du*shade,uvs[2*a+1]+dv*shade]);
  for(const [arr,size] of [[positions,3],[normals,3],[uvs,2]])for(let k=0;k<size;k++)arr.push(arr[a*size+k]*(1-t)+arr[b*size+k]*t);
  new Vector3().fromArray(normals,id*3).normalize().toArray(normals,id*3);
  delta.push(0,0,0);
  const influences=new Map();
  for(const [i,f] of [[a,1-t],[b,t]])for(let k=0;k<4;k++){
   const j=joints[i*4+k];influences.set(j,(influences.get(j)||0)+weights[i*4+k]*f);
  }
  const best=[...influences].sort((x,y)=>y[1]-x[1]).slice(0,4),total=best.reduce((sum,v)=>sum+v[1],0);
  for(let k=0;k<4;k++){joints.push(best[k]?.[0]??0);weights.push((best[k]?.[1]??0)/total);}
  return id;
 }
 for(let i=0;i<scan.indices.length;i+=3){
  const tri=scan.indices.slice(i,i+3),flags=tri.map(j=>skin[j]&&onArm(j));
  if(flags.every(v=>v===flags[0])){faces.push(...tri);continue;}
  splitFaces.push(i/3);
  const outer=[],inner=[];
  for(let k=0;k<3;k++){
   const j=(k+1)%3;(flags[k]?inner:outer).push(tri[k]);
   if(flags[k]!==flags[j]){const v=crossing(tri[k],tri[j]);outer.push(v);inner.push(v);}
  }
  for(const poly of [outer,inner])for(let j=1;j<poly.length-1;j++)faces.push(poly[0],poly[j],poly[j+1]);
 }
 scan.splitFaces=splitFaces;scan.indices=faces;scan.skin=skin;scan.cuts=tags;
 // Choose a lining swatch from the original uniform. A single swatch avoids
 // interpolating across unrelated atlas islands on the underside of the hem.
 scan.liningUV=side=>{
  const candidates=[...clothUV].filter(([i])=>positions[i*3]*(side==='l'?1:-1)>0).map(([,uv])=>{
   const k=(Math.floor(uv[1]*(info.height-1))*info.width+Math.floor(uv[0]*(info.width-1)))*info.channels;
   return {uv,r:data[k],g:data[k+1],b:data[k+2]};
  }).filter(c=>c.g>c.b*1.2&&c.r<c.g*1.07).sort((a,b)=>a.g-b.g);
  if(!candidates.length)throw Error('No uniform swatch at sleeve');
  return candidates[Math.floor(candidates.length*.35)].uv;
 };
}

// Find the actual closed boundary of the exposed skin on the Tripo scan.
// UV islands duplicate vertices; trace the boundary by bind-space position.
export function sleeveSeam({positions,normals,indices,skin,cuts,side,upperJoint,joints,weights,delta,upper}) {
 const pts=Array.from({length:positions.length/3},(_,i)=>new Vector3().fromArray(positions,i*3));
 const keys=pts.map(p=>p.toArray().map(v=>v.toFixed(5)).join(','));
 const sign=side==='l'?1:-1;
 const eligible=pts.map((p,i)=>skin[i] && (cuts.has(i)?sign*p.x>0:sign*p.x>.23 && p.y>.44 && p.y<.92));
 const boundary=new Map(),removed=new Set(),hiddenFaces=[];
 for(let i=0;i<indices.length;i+=3){
  const tri=indices.slice(i,i+3);
  if(!tri.every(v=>eligible[v]))continue;
  hiddenFaces.push(i);
  for(let j=0;j<3;j++){
   const a=tri[j],b=tri[(j+1)%3],id=[keys[a],keys[b]].sort().join('/');
   removed.add(keys[a]);
   if(boundary.has(id))boundary.delete(id);else boundary.set(id,[a,b]);
  }
 }
 const next=new Map([...boundary.values()].map(([a,b])=>[keys[a],b]));
 const first=boundary.values().next().value?.[0],rim=[];
 if(first===undefined)throw Error('Missing sleeve on '+side);
 let slot=first;
 do{
  if(slot===undefined||rim.length>=boundary.size)throw Error('Open sleeve on '+side);
  rim.push({point:pts[slot],normal:new Vector3().fromArray(normals,slot*3),source:slot});
  slot=next.get(keys[slot]);
 }while(keys[slot]!==keys[first]);
 if(rim.length!==boundary.size||rim.length<12)throw Error('Expected one closed sleeve cuff on '+side);
 const centre=rim.reduce((sum,v)=>sum.add(v.point),new Vector3()).divideScalar(rim.length);
 // Let a little upper arm show below the short sleeve. Blend the fold
 // over the nearby fabric, with an exact common edge at the opening.
 const hemShift=upper.clone().multiplyScalar(-.028);
 const lining=centre.clone().add(hemShift).addScaledVector(upper,-.018);
 for(let i=0;i<pts.length;i++){
  const key=keys[i],p=pts[i];
  if(sign*p.x<.16||p.y<.43||p.y>1.01)continue;
  const inside=removed.has(key);
  // Fold the old skin into the sleeve. Every copy of a sewn vertex is
  // identical on both sides of the seam at every animation sample.
  if(inside&&!next.has(key))lining.clone().sub(p).toArray(delta,i*3);
  const nearest=inside?0:Math.sqrt(Math.min(...rim.map(v=>p.distanceToSquared(v.point))));
  if(nearest>=.085)continue;
  const t=nearest/.085,keep=t*t*(3-2*t);
  if(!inside||next.has(key)){
   const limit=Math.max(0,Math.min(1,(sign*p.x-.23)/.02,(.91-p.y)/.02));
   const fade=next.has(key)?1:limit*limit*(3-2*limit);
   hemShift.clone().multiplyScalar(fade*(1-keep)).toArray(delta,3*i);
  }
  const mix=new Map([[upperJoint,1-keep]]);
  for(let k=0;k<4;k++){
   const j=joints[i*4+k];mix.set(j,(mix.get(j)||0)+keep*weights[i*4+k]);
  }
  const best=[...mix].sort((a,b)=>b[1]-a[1]).slice(0,4),total=best.reduce((s,b)=>s+b[1],0);
  for(let k=0;k<4;k++){joints[i*4+k]=best[k]?.[0]??0;weights[i*4+k]=(best[k]?.[1]??0)/total;}
 }
 for(const v of rim)v.point=v.point.clone().add(hemShift);
 return {rim,centre:centre.add(hemShift),hiddenFaces,lining};
}

// A short return inside the sleeve gives the garment thickness. Its two
// edges coincide in the untouched comparison pose and separate in motion.
export function sleeveLining(seam,scan,uvs,upper,upperJoint){
 const outer=[],inner=[],innerRim=[];
 // The cut follows individual clothing texels. Keep that edge on the cloth,
 // but fit the skin to an oval just inside it, away from its jagged rim.
 const centre=seam.centre.clone().addScaledVector(upper,-.016);
 const rim=seam.rim;
 const swatch=scan.liningUV(centre.x>0?'l':'r');
 const perimeter=[0];
 for(let i=0;i<rim.length;i++)perimeter.push(perimeter[i]+rim[i].point.distanceTo(rim[(i+1)%rim.length].point));
 for(const [i,v] of rim.entries()){
  const radial=v.point.clone().sub(seam.centre);
  const projected=radial.clone().addScaledVector(upper,-radial.dot(upper));
  const radius=projected.length(),direction=projected.clone().normalize();
  const filtered=new Vector3();let total=0;
  for(const [j,neighbour] of rim.entries()){
   const arc=Math.abs(perimeter[i]-perimeter[j]);
   const distance=Math.min(arc,perimeter.at(-1)-arc);
   const weight=Math.exp(-.5*(distance/.014)**2)*(perimeter[j+1]-perimeter[j]);
   filtered.addScaledVector(neighbour.point.clone().sub(seam.centre),weight);total+=weight;
  }
  filtered.divideScalar(total);
  const axial=filtered.dot(upper);
  const innerRadius=Math.min(radius*.97,filtered.addScaledVector(upper,-axial).length()*.93);
  const inset=centre.clone().addScaledVector(direction,innerRadius).addScaledVector(upper,axial*.32);
  const inward=projected.negate().normalize().multiplyScalar(.52).addScaledVector(upper,.85).normalize();
  const bind=new Vector3().fromArray(scan.positions,3*v.source);
  for(const [ring,dest] of [[outer,v.point],[inner,inset]]){
   const id=scan.positions.length/3;
   ring.push(id);scan.positions.push(...bind.toArray());
   scan.normals.push(...inward.toArray());
   uvs.push(...swatch);
   scan.joints.push(upperJoint,0,0,0);scan.weights.push(1,0,0,0);
   scan.delta.push(...dest.clone().sub(bind).toArray());
   if(ring===inner)innerRim.push({source:id,point:inset,normal:inward});
  }
 }
 for(let k=0;k<outer.length;k++){
  const j=(k+1)%outer.length;
  scan.indices.push(outer[k],outer[j],inner[j],outer[k],inner[j],inner[k]);
 }
 return {rim:innerRim,centre};
}
