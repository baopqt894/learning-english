// Dimensions and local fixture positions are in metres. All entrances face south (+z).
export const languageLab = {x:27.75,z:-2,w:25.5,d:21};
export const computerLab = {x:30.75,z:-23,w:20,d:16};
export const labEntrance = (room:typeof languageLab) => ({x:room.x,z:room.z+room.d/2});
export const languageMeetingPoint = {x:languageLab.x,z:labEntrance(languageLab).z-3.2};
export const computerRows = [-5.95,-3.80,3.55,5.70];

export const boothX=-languageLab.w/2+2.1;
export const listeningBooths=[-6.6,-4.15,-1.7,1.7,4.15,6.6];
export const conversationPods=[{x:8.4,z:-5.00},{x:8.4,z:5.30}];
export const shelf={x:8.8,z:-languageLab.d/2+1.0};
export const globe={x:4.5,z:-languageLab.d/2+1.24};
export const recordingDesk={x:-7.7,z:-languageLab.d/2+.85};
export const languageFurniture=[
  ...listeningBooths.map(z=>({x:boothX+.6,z,w:2.85,d:1.96})),
  ...conversationPods.map(p=>({...p,w:3.8,d:3.3})),
  {...shelf,w:3.36,d:1.2},
  {...globe,w:.94,d:1.02}, {...recordingDesk,w:2.3,d:.72},
];
