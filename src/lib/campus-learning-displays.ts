import * as THREE from 'three';
import { paths } from '../components/icon';
import { DISTRICT_STRUCTURES } from './campus-districts-layout';
import { FARM_LAYOUT } from './campus-spaces';
import { SPORTS_VENUES, TRACK_STANDS } from './sports-layout';
import { courtEquipment, orchardTrees, signalBoards } from './recreation-park';
import { sceneryKit } from './campus-scenery-kit';

type Card = readonly [icon:string, caption:string];
type Display = readonly [colour:string, title:string, ...cards:Card[]];
const exhibits:Record<string,Display>={
  language:['#136567','Sound studio',['headphones','Listen closely'],['mic','Say it aloud'],['sound','Listen again']],
  computer:['#365b80','At the keyboard',['computer','Sign in'],['pencil','Enter an answer'],['check','Submit your work']],
  classroom:['#9b553a','Our class library',['book','Read a page'],['chat','Ask a friend'],['pencil','Write a sentence']],
  classroomB:['#4e657d','Giving directions',['map','Read the map'],['arrow','Turn right'],['flag','Meet here']],
  kitchen:['#97462e','The recipe bench',['leaf','Fresh herbs'],['pot','Simmer gently'],['food','Serve warm']],
  'light-lab':['#385c84','Through a prism',['bulb','White light'],['prism','Glass prism'],['palette','Colour spectrum']],
  'plant-lab':['#426948','Growth diary',['sprout','Seedling'],['leaf','First leaves'],['orchard','Mature tree']],
  weather:['#376e88','Forecast desk',['weather','Rain showers'],['flag','Wind direction'],['pencil','Record changes']],
  music:['#5c5576','Ensemble rehearsal',['music','Set the tempo'],['headphones','Listen for the beat'],['users','Play together']],
  art:['#9c5345','Sketchbook studies',['pencil','Draw a contour'],['palette','Mix a colour'],['image','Frame your work']],
  pavilion:['#597055','Readers’ corner',['book','Choose a story'],['bulb','Find the main idea'],['chat','Share a thought']],
  housing:['#596c60','Before breakfast',['bed','Make the bed'],['bag','Pack your bag'],['clock','Be on time']],
  dining:['#926344','At the table',['cup','A glass of water'],['food','A balanced meal'],['chat','Enjoy your lunch']],
  hall:['#895567','On the stage',['stage','Take your place'],['mic','Speak clearly'],['users','Face the audience']],
};
function print(display:Display,width:number,height:number){
  const [colour,title,...cards]=display;
  const c=document.createElement('canvas');c.width=768;c.height=244;
  const ctx=c.getContext('2d')!;
  ctx.fillStyle='#e8d7ac';ctx.fillRect(0,0,768,244);
  ctx.fillStyle=colour;ctx.fillRect(6,6,756,232);
  ctx.fillStyle='#fff1cd';ctx.font='bold 37px sans-serif';ctx.fillText(title,25,53);
  cards.forEach(([icon,caption],i)=>{
    const x=24+i*244;ctx.fillStyle=i===1?'#e8ce9b':'#f9edcf';ctx.fillRect(x,72,230,145);
    ctx.save();ctx.translate(x+87,82);ctx.scale(2.45,2.45);ctx.strokeStyle=colour;ctx.lineWidth=1.6;ctx.lineJoin=ctx.lineCap='round';ctx.stroke(new Path2D(paths[icon]));ctx.restore();
    ctx.fillStyle='#263e40';ctx.font='bold 22px sans-serif';ctx.textAlign='center';ctx.fillText(caption,x+115,189,207);ctx.textAlign='left';
  });
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map}));
}
type Room={kind:string;x:number;w:number;d:number;h:number};
export function roomLearningDisplay(room:Room){
  const exhibit=exhibits[room.kind==='classroom'&&room.x>0?'classroomB':room.kind];
  const group=new THREE.Group();
  if(!exhibit)return group;
  const width=Math.min(room.d*.38,7), height=width*244/768;
  const panel=print(exhibit,width,height);
  panel.position.set(-room.w/2+.22,Math.min(room.h-height/2-.12,2.15),0);
  panel.rotation.y=Math.PI/2;group.add(panel);
  const kit=sceneryKit('display-fittings');
  for(const side of [-1,1])kit.block(panel.position.x-.06,panel.position.y*.57,side*width*.39,.07,panel.position.y*.90,.075,0x715641);
  if(room.kind==='classroom'){
    const geography=room.x>0;
    for(const side of [-1,1])for(let row=0;row<4;row++){
      const x=side*room.w*.28,z=-room.d/2+1.8+row*1.8;
      if(geography){
        kit.drum(x,1.08,z,.32,.09,.32,0x8f6741);kit.drum(x,1.21,z,.07,.24,.07,0xb39b67);
        kit.globe(x,1.46,z,.48,.48,.48,0x748fa3);kit.leaf(x-.07,1.5,z+.19,.22,.21,.08,0x9db17f,-.3);
      }else{
        kit.pot(x,1.19,z,.22,.28,.22,0xb06c4b);
        for(let i=0;i<4;i++)kit.drum(x+(i-1.5)*.034,1.39,z,.024,.29,.024,[0x395e64,0xccaa64,0xa75b51,0x56866f][i],(i-1.5)*.14);
      }
    }
  }
  if(room.kind==='housing'){
    // A peg rail, labelled lockers and a timetable on the rear wall of the dorm.
    for(let i=0;i<6;i++){
      const x=(i-2.5)*.67,z=-room.d/2+.26;
      kit.block(x,1.40,z,.63,2.14,.31,i%2?0x78948a:0x66877f);
      for(let l=0;l<3;l++)kit.block(x,2.25-l*.065,z+.17,.28,.017,.02,0x354e4d);
      kit.block(x+.19,1.32,z+.19,.045,.16,.035,0xdacf9e);
      kit.block(x,1.90,z+.17,.18,.09,.02,0xf1d9a7);
    }
  }
  if(room.kind==='hall'){
    // Ribbon bunting above the stage and a lectern within its footprint.
    const z=-room.d/2+.85;
    for(let i=0;i<21;i++){
      const x=(i-10)*.77,y=room.h-.36+.0027*x*x;
      kit.block(x,y,z,.79,.028,.028,0x645440, .0054*x);
      kit.block(x,y-.14,z,.22,.22,.034,[0xb95c4c,0x54938c,0xe3b66d][i%3],Math.PI/4);
    }
    kit.block(-2.2,1.30,z+.16,.74,1.1,.5,0x885d3d);kit.block(-2.2,1.89,z+.17,1,.09,.72,0xb98e5c,0,0,-.12);
    kit.drum(-2.1,2.09,z+.1,.04,.36,.04,0x313e40);
  }
  group.add(kit.finish());
  return group;
}

// Mount outdoor guides on existing equipment or within its collision footprint.
export function outdoorLearningDisplays(){
  const group=new THREE.Group(), stands=sceneryKit('field-guide-frames');
  function mount(x:number,z:number,y:number,width:number,display:Display){
    const height=width*244/768, card=print(display,width,height);
    stands.block(x,y,z,width+.12,height+.12,.10,0x785942);
    for(const side of [-1,1])stands.block(x+side*width*.41,y/2,z,.068,y,.07,0x785942);
    card.position.set(x,y,z+.067);group.add(card);
  }
  const guides:Record<string,Display>={
    'feed-store':['#8a653a','Feeding time',['hen','Scatter grain'],['cup','Fresh water'],['clock','Check daily']],
    'fish-shed':['#307476','Pond notebook',['fish','Count the fish'],['cup','Measure feed'],['pencil','Record growth']],
    'training-shelter':['#9b623e','Balance course',['run','Walk slowly'],['flag','Look ahead'],['check','Reach the end']],
    'changing-rooms':['#327087','At the pool',['pool','Swim a length'],['flag','Touch the end'],['clock','Check your time']],
  };
  for(const s of DISTRICT_STRUCTURES)if(guides[s.id])mount(s.x,s.z+s.d/2-.05,1.66,3.5,guides[s.id]);
  for(const [id,venue] of Object.entries(SPORTS_VENUES)){
    if(id==='pool')continue;
    mount(venue.desk.x,venue.desk.z-.45,1.79,3.3,id==='track'?
      ['#904c3d','Track meet',['flag','Start line'],['run','Stay in lane'],['clock','Finish time']]:
      ['#487054','Field games',['users','Form a team'],['ball','Pass the ball'],['flag','Finish together']]);
  }
  for(const d of courtEquipment.filter(e=>e.unit==='official'))mount(d.x,d.z-.49,1.94,3.15,d.sport==='basketball'?
    ['#8c5037','Basketball',['ball','Dribble'],['users','Pass'],['hoop','Shoot']]:
    ['#326c73','Volleyball',['ball','Serve'],['users','Set'],['net','Spike']]);
  const s=signalBoards[0];mount(s.x,s.z,2.77,2.85,['#5e647a','Signal sequence',['signal','Watch'],['clock','Remember'],['check','Choose']]);
  const tree=orchardTrees[2];mount(tree.x,tree.z+.18,1.35,2.75,['#66783d','Orchard notes',['leaf','Inspect leaves'],['orchard','Pick ripe fruit'],['bag','Weigh the crop']]);
  const shed=FARM_LAYOUT.shed;
  mount(shed.x,shed.z+shed.d/2,1.72,3.1,['#537040','Kitchen garden',['sprout','Sow seeds'],['cup','Water the soil'],['bag','Gather the crop']]);
  const stand=TRACK_STANDS[1];
  mount(stand.x,stand.z+stand.d/2-.12,2.2,4.2,['#477057','Match day',['flag','Kick-off'],['users','Pass to a friend'],['ball','Score a goal']]);
  group.add(stands.finish());return group;
}
