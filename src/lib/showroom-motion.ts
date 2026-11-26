import { AnimationClip, Euler, Quaternion, QuaternionKeyframeTrack } from 'three';

// All clips begin and end in the exported pose. Local rotations keep the bind
// lengths of the original arms, stitched sleeves, wrists and finger chains.
type Angle = readonly [number, number, number];
type Pose = Record<string, Angle>;
const rest: Angle = [0,0,0];
function gesture(name:string,duration:number,poses:Pose[]) {
  const keys=[{} as Pose,...poses,{} as Pose];
  const times=keys.map((_,i)=>i*duration/(keys.length-1));
  const joints=new Set(keys.flatMap(pose=>Object.keys(pose)));
  const tracks=[...joints].map(joint=>{
    const values=keys.flatMap(pose=>{
      const [x,y,z]=pose[joint]??rest;
      return new Quaternion().setFromEuler(new Euler(x,y,z)).toArray();
    });
    return new QuaternionKeyframeTrack(joint+'.quaternion',times,values);
  });
  return new AnimationClip(name,duration,tracks);
}

export function showroomClips(avatar:number) {
  const waveJoint=avatar===1?'rightArm':'leftArm';
  const waveSign=avatar===1?1:-1;
  return [
    gesture('Idle',3.4,[{spine_02:[-.023,0,.012],head:[.018,.025,0]},{spine_02:[-.01,.012,.004],head:[.007,.014,0]}]),
    gesture('Nod',2.3,[{head:[.14,0,.012]},{head:[-.035,-.025,0]},{head:[.08,-.02,0]}]),
    gesture('Look around',4.1,[{head:[-.035,.24,0],spine_02:[0,.06,0]},{head:[.03,.12,-.02]},{head:[-.02,-.19,.04],spine_02:[0,-.04,0]}]),
    gesture('Welcome',3.3,[
      {[waveJoint]:[-.13,0,waveSign*.16],head:[-.028,.08,.045]},
      {[waveJoint]:[-.18,.05,waveSign*.23],head:[.015,.13,.05]},
      {[waveJoint]:[-.1,-.03,waveSign*.16],head:[.045,.05,.018]},
    ]),
  ];
}
