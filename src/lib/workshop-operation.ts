import * as THREE from 'three';
import { demonstrationBays,type EquipmentName } from './campus-detail-layout';

// A single shared set of working parts is only drawn while a station is being operated.
export function createWorkshopOperation(scene:THREE.Scene) {
  const group=new THREE.Group();
  const wheel=new THREE.Group(),oven=new THREE.Group(),mallet=new THREE.Group();
  const clay=new THREE.MeshStandardMaterial({color:0xc88668,roughness:.76});
  const bowl=new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(.15,0),new THREE.Vector2(.25,.05),new THREE.Vector2(.41,.31),
    new THREE.Vector2(.38,.33),new THREE.Vector2(.31,.22),new THREE.Vector2(.12,.06),new THREE.Vector2(0,.06),
  ],28),clay);
  const mark=new THREE.Mesh(new THREE.SphereGeometry(.047,10,8),new THREE.MeshStandardMaterial({color:0xeac6a4}));
  mark.position.set(.375,.275,0);wheel.add(bowl,mark);wheel.position.set(.69,1.55,.42);
  const tray=new THREE.Mesh(new THREE.BoxGeometry(2.24,.055,.90),new THREE.MeshStandardMaterial({color:0xadb2ab,metalness:.58,roughness:.38}));
  tray.position.set(-.15,1.6,1.02);oven.add(tray);
  const heat=new THREE.MeshBasicMaterial({color:0xff9f3f});
  for(const y of [.82,1.75]){
    const bar=new THREE.Mesh(new THREE.BoxGeometry(2.41,.045,.04),heat);
    bar.position.set(-.18,y,.95);oven.add(bar);
  }
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.034,.04,.81,10),clay);
  handle.rotation.z=-1.15;handle.position.x=.34;handle.position.y=.16;mallet.add(handle);
  mallet.add(new THREE.Mesh(new THREE.SphereGeometry(.115,12,8),new THREE.MeshStandardMaterial({color:0x434d5f})));
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=120;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  const readout=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  readout.position.set(0,3.85,0);readout.scale.set(3.84,.60,1);
  group.add(wheel,oven,mallet,readout);group.visible=false;scene.add(group);
  let lastName:EquipmentName|undefined,lastValue='',elapsed=0;
  return function update(name:EquipmentName|undefined,value:string,dt:number,still:boolean){
    if(!name){group.visible=false;lastName=undefined;return;}
    if(name!==lastName || value!==lastValue){
      const station=demonstrationBays.find(b=>b.name===name)!;
      group.position.set(station.x,0,station.z);group.visible=true;
      oven.visible=name==='Bread oven' && !!value;
      tray.visible=['Top','Middle','Bottom'].includes(value);
      if(tray.visible)tray.position.y=value==='Top'?2:value==='Middle'?1.52:.86;
      heat.color.setHex(value==='80 °C'?0xd78342:value==='108 °C'?0xf29a49:0xffb260);
      wheel.visible=name==='Pottery wheel';mallet.visible=name==='Xylophone' && !!value;
      const tall=value==='Tall and narrow',flat=value==='Flat and square';
      wheel.position.x=value==='On the rim'?1.04:value==='Beside the pedal'?1.56:.69;
      wheel.position.y=value==='Beside the pedal'?.32:1.55;
      wheel.scale.set(tall?.68:1,flat?.38:tall?1.9:1, tall?.68:1);
      readout.visible=!!value;
      if(ctx && value){
        ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#193a32';
        ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#ffedb8';
        ctx.font='bold 63px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(value,384,60,730);texture.needsUpdate=true;
      }
      elapsed=0;lastName=name;lastValue=value;
    }
    elapsed+=dt;
    if(!still && wheel.visible && value)wheel.rotation.y+=dt*(value==='Fast'?5:value==='Slow'?1:2.5);
    if(mallet.visible){
      const notes=value.split(' '),beat=Math.min(notes.length-1,Math.floor(elapsed/.27));
      const note=notes[beat];mallet.position.set(-1.94+({D:1,E:2}[note]??0)*.35,
        1.72+(still||elapsed>=notes.length*.27||note==='rest'?.32:.40*Math.abs(Math.cos(elapsed*Math.PI/.27))),.24);
    }
  };
}
