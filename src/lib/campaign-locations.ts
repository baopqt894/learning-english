import {EXPLORATION_ZONES,EXPANSION_BUILDINGS,isOpenRoom} from './campus-map.ts';
import {DISTRICT_AREAS} from './campus-districts-layout.ts';
import {FARM_LAYOUT} from './campus-spaces.ts';
import {PLACES,type Place} from './game.ts';
import type {StoryLocation} from './campaign.ts';
export function storyPosition(location:StoryLocation){if(Object.hasOwn(PLACES,location)){const p=PLACES[location as Place];return {x:p.position[0],z:p.position[1]+1};}const zone=EXPLORATION_ZONES.find(z=>z.id===location)!;return {x:zone.x,z:zone.z};}
export function nearStoryLocation(location:StoryLocation,point:{x:number;z:number}){
 const district=DISTRICT_AREAS.find(d=>d.id===location);
 if(district)return point.x>=district.minX&&point.x<=district.maxX&&point.z>=district.minZ&&point.z<=district.maxZ;
 if(location==='vegetable-garden'){const b=FARM_LAYOUT.bounds;return point.x>=b.minX-2.5&&point.x<=b.maxX&&point.z>=b.minZ&&point.z<=b.maxZ;}
 const room=EXPANSION_BUILDINGS.find(b=>location==='dormitory'?b.kind==='housing'&&isOpenRoom(b):location==='classrooms'?b.kind==='classroom'&&b.x<0:location==='classroom-b'?b.kind==='classroom'&&b.x>0:location==='computer'?b.kind==='computer':location==='language'?b.kind==='language':location==='dining'?b.kind==='dining':location==='hall'?b.kind==='hall':false);
 if(room)return Math.abs(point.x-room.x)<room.w/2+.6&&Math.abs(point.z-room.z)<room.d/2+.6;
 const target=storyPosition(location);return Math.hypot(point.x-target.x,point.z-target.z)<4;
}
