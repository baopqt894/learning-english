import { gap } from './level-questions.ts';
import type { EnglishTier } from './cadet-tiers.ts';
import { PARK_ZONES } from './recreation-park.ts';

type Item=[string,string,string,string,string];
const lessons:Record<typeof PARK_ZONES[number]['id'],Record<EnglishTier,Item[]>>={
  orchard:{
    A1:[
      ['Which part of the tree grows underground?','The roots','The fruit','The leaves','Roots grow in the soil.'],
      ['Put the ripe oranges in the ___.','basket','net over the court','pencil case','Use a basket to carry fruit.'],
      ['Pick a ripe fruit. What does ripe mean?','Ready to eat','Too young to eat','Made of wood','Ripe fruit is ready to eat.']],
    A2:[
      ['We picked ___ oranges than yesterday.','more','much','most of','More compares two amounts.'],
      ['Carry the pears gently so they do not ___.','bruise','bloom','sprout','A bruise forms when fruit is knocked.'],
      ['Pick from the row beside the gate. Which row?','The one next to the gate','The farthest row','Every row','Beside means next to.']],
    B1:[
      ['By the time the rain began, we ___ the harvest.','had finished','are finishing','will finish','The harvest ended before the rain started.'],
      ['The fruit was sorted according to ripeness. What determined each group?','How ready the fruit was to eat','Who collected each basket','How tall the tree was','Ripeness describes how mature the fruit is.'],
      ['Which note helps the next team?','Pick row three tomorrow and leave the green pears.','Fruit is interesting.','We enjoyed today.','A clear location and instruction guide the next harvest.']]},
  basketball:{
    A1:[
      ['Pass the ball to your ___.','teammate','basket','bench','A teammate plays on your side.'],
      ['Which word means to bounce the ball as you move?','Dribble','Catch','Sit','Players dribble a basketball.'],
      ['Your team scores. What can you say?','Nice shot!','Turn the page!','Lights out!','Nice shot praises a basket.']],
    A2:[
      ['The ball went out. Where should we stand to restart?','Outside the sideline','Under the bench','On the scoreboard','Sidelines mark the edges of the court.'],
      ['I was tying my shoes when the game ___.','started','starts','starting','Use the past simple for the event.'],
      ['Your teammate cannot see you. What is a helpful call?','I am open on your left!','I left the ball at home!','The gym was closed!','Give your teammate your position.']],
    B1:[
      ['We would have tied the game if the last shot ___.','had gone in','goes in','is going in','A past unreal condition takes the past perfect.'],
      ['“Keep an eye on the clock” means to ___.','check the remaining time','change the scoreboard','watch the ball only','The clock shows how long is left.'],
      ['Which report describes a comeback?','We were behind but took the lead.','We led from the start.','The match was postponed.','A team comes back from a losing position.']]},
  volleyball:{
    A1:[
      ['Hit the ball over the ___.','net','bench','door','A net divides the volleyball court.'],
      ['Which word starts a rally?','Serve','Rest','Count','A serve puts the ball into play.'],
      ['The ball is coming to you. Call ___.','Mine!','Goodbye!','Lunch!','Mine tells teammates you will play it.']],
    A2:[
      ['Please rotate ___ before the next serve.','clockwise','yesterday','louder','Clockwise describes a direction.'],
      ['The referee said “out”. Where did the ball land?','Outside the court','In the middle','On the service line','Out means beyond the boundary.'],
      ['We practise ___ the ball to a teammate.','passing','pass','passed','Practise is followed by a verb ending in -ing.']],
    B1:[
      ['Had we called for the ball, we ___ collided.','might not have','are not','will not','This describes an alternative past outcome.'],
      ['“Cover the back row” asks you to ___.','defend the rear of the court','sit behind the referee','replace the net','Cover means take responsibility for that space.'],
      ['Which instruction is clearest before a serve?','Move two steps behind the line.','Stand over there somewhere.','Do the usual thing.','A distance and landmark make the instruction specific.']]},
  'signal-arcade':{
    A1:[
      ['Which shape has four equal sides and four right angles?','A square','A circle','A triangle','A square has four right angles.'],
      ['The yellow light is on the left. Which side is it on?','Left','Right','Middle','Left is the side named in the instruction.'],
      ['The round button is blue. What colour is it?','Blue','Red','Green','The sentence names the colour.']],
    A2:[
      ['Select the circle ___ the two squares.','between','above all','during','Between refers to the space separating two things.'],
      ['Wait until the panel ___ green.','turns','turning','to turn','Use the present simple after until here.'],
      ['The display is flashing. What is it doing?','Switching on and off','Making a loud noise','Moving to the left','A light flashes when it switches on and off.']],
    B1:[
      ['Choose the blue panel unless it flashes. It is flashing. What now?','Leave the blue panel alone','Choose the blue panel','Switch off every panel','Unless introduces an exception.'],
      ['Only one pattern ___ since we started.','has changed','changes yesterday','will change last night','Since connects a past starting point to the present.'],
      ['Which note records a sequence precisely?','Amber appeared twice before teal.','There were lights.','It looked different.','The note records the colours, count and order.']]}
};
export function recreationQuestions(id:keyof typeof lessons,tier:EnglishTier){
  return lessons[id][tier].map(row=>gap(...row));
}
