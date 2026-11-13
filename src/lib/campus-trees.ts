import * as THREE from 'three';
import {spatialInstances} from './spatial-instances';
import { seededRandom } from './campus-surfaces';
type Spray={position:THREE.Vector3;radius:THREE.Vector3;color:number;density:number;flowering:boolean};
/** Curved branching silhouettes and instanced leaves, with no solid balls inside the crowns. */
export function createCampusTrees(scene:THREE.Scene,bark:THREE.MeshStandardMaterial,wind:{value:number}){
  const sprays:Spray[]=[];
  const tube=(points:THREE.Vector3[],base:number)=>{
    const curve=new THREE.CatmullRomCurve3(points),geo=new THREE.TubeGeometry(curve,10,base,7,false),pos=geo.attributes.position;
    for(let j=0;j<=10;j++){const center=curve.getPointAt(j/10),taper=1-j/10*.85;for(let k=0;k<=7;k++){const i=j*8+k;pos.setXYZ(i,center.x+(pos.getX(i)-center.x)*taper,center.y+(pos.getY(i)-center.y)*taper,center.z+(pos.getZ(i)-center.z)*taper);}}
    geo.computeVertexNormals();const m=new THREE.Mesh(geo,bark);m.castShadow=m.receiveShadow=true;scene.add(m);
  };
  function add(x:number,z:number,scale:number,flowering:boolean){
    const random=seededRandom(Math.floor((x+101)*241+(z+103)*601)),species=Math.floor(random()*10);
    const at=(dx:number,y:number,dz:number)=>new THREE.Vector3(x+dx*scale,y*scale,z+dz*scale);
    const spray=(p:THREE.Vector3,r:THREE.Vector3,color:number,density:number,flowers=false)=>sprays.push({position:p,radius:r.multiplyScalar(scale),color,density,flowering:flowers});
    if(species===0&&Math.abs(x)>18){
      // A clump of bamboo with slender canes and open, lanceolate foliage.
      for(let n=0;n<6;n++){const a=n*2.4,dx=Math.cos(a)*.26,dz=Math.sin(a)*.26,h=3.8+random()*1.5;
        tube([at(dx,0,dz),at(dx*1.4,h*.5,dz*1.3),at(dx*2,h,dz*2)],.035*scale);
        for(let j=0;j<5;j++){const y=1.8+j*.6,b=j*2.4+n,reach=.6+random()*.5,c=at(dx+Math.cos(b)*reach,y,dz+Math.sin(b)*reach);tube([at(dx,y-.2,dz),c],.012*scale);spray(c,new THREE.Vector3(.6,.24,.6),0x668a43,45);}
      }return;
    }
    if(species===1&&Math.abs(x)>18){
      // Areca palms: arched frond spines and narrow leaflets form a feathered crown.
      tube([at(0,0,0),at(.07,2.2,.04),at(.1,4.2,.09)],.12*scale);
      for(let n=0;n<9;n++){const a=n*Math.PI*2/9;const curve=new THREE.CatmullRomCurve3([at(.1,4.2,.09),at(Math.cos(a)*.9,4.65,Math.sin(a)*.9),at(Math.cos(a)*2,3.6,Math.sin(a)*2)]);tube(curve.getPoints(4),.026*scale);
        for(let j=1;j<8;j++){const t=j/8,p=curve.getPoint(t);for(const side of [-1,1]){const q=p.clone().add(new THREE.Vector3(Math.cos(a+side*.9)*.27,-.08,Math.sin(a+side*.9)*.27).multiplyScalar(scale));spray(q,new THREE.Vector3(.35,.055,.16),0x5c8242,9);}}
      }return;
    }
    const lean=(random()-.5)*.33,fork=at(lean,1.9,0);
    tube([at(0,0,0),at(lean*.3,.7,.07),fork,at(lean+.1,3.5,.07)],.185*scale);
    // Root flares sink into the soil and the trunk forks asymmetrically.
    for(let i=0;i<5;i++){const a=i*1.256;tube([at(Math.cos(a)*.43,0,Math.sin(a)*.43),at(Math.cos(a)*.11,.34,Math.sin(a)*.11)],.075*scale);}
    const count=flowering?15:12;
    for(let i=0;i<count;i++){
      const a=i*2.399+random()*.45,reach=.5+Math.sqrt(i/count)*1.5,height=2.5+random()*.9+(1-i/count)*.5;
      const p=at(lean+Math.cos(a)*reach,height,Math.sin(a)*reach);
      tube([fork,at(lean+Math.cos(a)*reach*.5,height-.35,Math.sin(a)*reach*.5),p],(.038+random()*.027)*scale);
      spray(p,new THREE.Vector3(.66+random()*.36,.34+random()*.15,.65+random()*.3),[0x47703b,0x66883d,0x789847,0x568044][i%4],Math.hypot(x,z)<40?165:90,flowering&&i%3===0);
    }
  }
  function finish(){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,-.5,0,-.24,-.08,0,-.14,.26,-.045,0,.5,0,.14,.26,-.045,.24,-.08,0,0,.02,.075],3));geo.setIndex([0,6,1,1,6,2,2,6,3,3,6,4,4,6,5,5,6,0]);geo.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.88});
    material.onBeforeCompile=shader=>{shader.uniforms.uCampusLeafWind=wind;shader.vertexShader='uniform float uCampusLeafWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z += sin(uCampusLeafWind*1.2+instanceMatrix[3].x*.71+instanceMatrix[3].z*.45)*(.04+position.y*.08);');};
    const leaves=new THREE.InstancedMesh(geo,material,sprays.reduce((n,s)=>n+s.density,0));leaves.receiveShadow=true;leaves.castShadow=true;
    const blossomGeo=new THREE.SphereGeometry(.055,5,3),flowerCount=sprays.filter(s=>s.flowering).length*22;
    const flowers=new THREE.InstancedMesh(blossomGeo,new THREE.MeshStandardMaterial({color:0xda6745,roughness:.9}),flowerCount);
    const random=seededRandom(10971),leaf=new THREE.Object3D(),color=new THREE.Color();let index=0,flower=0;
    for(const s of sprays){for(let i=0;i<s.density;i++){
      const h=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-h*h)*Math.cbrt(random());
      leaf.position.set(s.position.x+Math.cos(a)*r*s.radius.x,s.position.y+h*s.radius.y,s.position.z+Math.sin(a)*r*s.radius.z);
      leaf.rotation.set((random()-.5)*1.8,a,(random()-.5)*2.6);leaf.scale.set(.55+random()*.25,.38+random()*.26,.6);leaf.scale.multiplyScalar(Math.sqrt(s.radius.x));leaf.updateMatrix();leaves.setMatrixAt(index,leaf.matrix);color.setHex(s.color).multiplyScalar(.75+random()*.5+h*.14);leaves.setColorAt(index++,color);
      if(s.flowering&&i<22){leaf.scale.setScalar(.6+random()*.6);leaf.updateMatrix();flowers.setMatrixAt(flower++,leaf.matrix);}
    }}
    const leafChunks=spatialInstances(leaves),flowerChunks=spatialInstances(flowers);scene.add(leafChunks,flowerChunks);return leafChunks;
  }
  return {add,finish};
}
