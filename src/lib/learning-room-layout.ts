// Relative to the room centre. The door and the route to Trâm remain on the centre aisle.
export const listeningBooths=[-2.15,.05,2.25];
export const languageFurniture=[
  ...listeningBooths.map(z=>({x:-5.42,z,w:2.65,d:1.96})),
  {x:4.8,z:-.4,w:3.8,d:3.3}, // conversation group
  {x:4.9,z:-3.68,w:3.36,d:1.2}, // reading shelf
  {x:4.9,z:2.95,w:2.65,d:.86}, // role-play card table
  {x:2.05,z:-3.43,w:.94,d:1.02}, // reference globe
  {x:-4.8,z:-3.9,w:2.3,d:.72}, // recording console
];
