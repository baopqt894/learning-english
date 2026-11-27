import * as THREE from 'three';
import type {WorkshopId} from './workshop-wing';

const guides={
  weather:{title:'Weather observatory',labels:['TEMPERATURE','WIND SPEED','RAINFALL'],hue:'#386079'},
  music:{title:'Ensemble rehearsal',labels:['LISTEN','COUNT FOUR','PLAY TOGETHER'],hue:'#305e57'},
  kitchen:{title:'Teaching kitchen',labels:['PREPARE','COOK','SERVE'],hue:'#95583b'},
  art:{title:'Colour workshop',labels:['SKETCH','MIX','PAINT'],hue:'#80576a'},
  'light-lab':{title:'The optics bench',labels:['LIGHT SOURCE','PRISM','SPECTRUM'],hue:'#34556e'},
  'plant-lab':{title:'From seed to seedling',labels:['SOW','WATER','OBSERVE'],hue:'#4b704f'},
} as const;

export function workshopTeachingBoard(kind:WorkshopId,width:number){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=320;
  const c=canvas.getContext('2d')!,guide=guides[kind],cream='#faebc8',gold='#edbe6a',mint='#9ad2b0';
  c.fillStyle=guide.hue;c.fillRect(0,0,1024,320);
  c.strokeStyle='#dcbf87';c.lineWidth=3;c.strokeRect(9,9,1006,302);
  c.fillStyle=cream;c.font='bold 47px sans-serif';c.fillText(guide.title,36,66);
  c.lineWidth=2;c.beginPath();c.moveTo(36,85);c.lineTo(984,85);c.stroke();
  const circle=(x:number,y:number,r:number,color:string)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  const line=(x:number,y:number,ex:number,ey:number,color:string,w:number)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.stroke();};
  const poly=(points:number[][],color:string)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  for(let i=0;i<3;i++){
    const x=186+i*326;
    if(i)line(x-161,110,x-161,284,'#cebd94',2);
    if(kind==='weather'){
      if(i===0){line(x,132,x,204,cream,16);circle(x,208,20,cream);line(x,163,x,205,'#cf775b',8);circle(x,207,13,'#cf775b');}
      if(i===1){for(let j=0;j<3;j++){const a=j*2.094;line(x,176,x+Math.cos(a)*48,176+Math.sin(a)*48,cream,5);circle(x+Math.cos(a)*48,176+Math.sin(a)*48,15,mint);}circle(x,176,9,gold);}
      if(i===2){for(const [dx,dy,r] of [[-30,0,23],[0,-10,30],[30,2,21]])circle(x+dx,163+dy,r,cream);for(let j=0;j<4;j++)line(x-32+j*20,197,x-40+j*20,219,mint,5);}
    }else if(kind==='music'){
      for(let n=0;n<5;n++)line(x-83,148+n*12,x+83,148+n*12,'#c3c8a6',2);
      for(let n=0;n<=i+1;n++){const px=x-56+n*33,py=191-(n%3)*12;circle(px,py,9,gold);line(px+7,py,px+7,py-42,cream,4);}
    }else if(kind==='art'){
      if(i===0){line(x-42,213,x+40,131,gold,15);poly([[x-44,205],[x-36,215],[x-55,225]],cream);}
      if(i===1){circle(x-22,165,30,'#e39a6e');circle(x+22,167,30,'#90c3b4');circle(x,196,28,gold);}
      if(i===2){c.fillStyle=cream;c.fillRect(x-67,132,134,86);circle(x+28,153,14,gold);poly([[x-62,214],[x-17,163],[x+10,193],[x+30,173],[x+62,214]],'#649184');}
    }else if(kind==='kitchen'){
      if(i===0){c.fillStyle=gold;c.fillRect(x-66,149,132,61);for(let n=0;n<4;n++)circle(x-40+n*25,181,11,'#c7754a');}
      if(i===1){c.fillStyle=cream;c.fillRect(x-49,166,98,47);line(x-60,160,x+60,160,gold,8);circle(x,151,10,gold);for(const s of [-1,1])line(x+s*49,177,x+s*65,177,cream,7);}
      if(i===2){c.strokeStyle=cream;c.lineWidth=7;c.beginPath();c.ellipse(x,186,67,25,0,0,Math.PI*2);c.stroke();for(let n=0;n<3;n++)circle(x-24+n*24,178,13,n===1?mint:gold);}
    }else if(kind==='light-lab'){
      if(i===0){circle(x,173,31,gold);line(x-16,212,x+16,212,cream,7);}
      if(i===1){poly([[x,127],[x-61,211],[x+61,211]],mint);line(x-63,185,x+31,166,cream,6);}
      if(i===2){for(let n=0;n<5;n++)line(x-67,175,x+65,139+n*18,['#dc8a78',gold,cream,mint,'#89afcf'][n],7);}
    }else{
      c.fillStyle='#b6845a';c.fillRect(x-54,197,108,17);
      if(i===0){circle(x,192,9,gold);}
      else{line(x,199,x,184-i*14,mint,6);for(const s of [-1,1]){c.fillStyle=mint;c.beginPath();c.ellipse(x+s*13,171-(i-1)*15,20,9,s*.65,0,Math.PI*2);c.fill();}}
    }
    c.fillStyle=cream;c.font='bold 24px sans-serif';c.textAlign='center';c.fillText(guide.labels[i],x,272,280);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(width,width*320/1024),new THREE.MeshBasicMaterial({map:texture}));
}
