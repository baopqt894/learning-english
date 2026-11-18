import {Vector3,Quaternion} from 'three';

/** Spread pronation through the forearm instead of wringing it at the wrist. */
export function setHandWithForearmRoll(side,desired,{byName,rest}){
 const forearm=byName.get('lowerarm_'+side),hand=byName.get('hand_'+side);
 const axis=hand.getWorldPosition(new Vector3()).sub(forearm.getWorldPosition(new Vector3())).normalize();
 const bindAxis=rest.get('middle_01_'+side).world.clone().sub(rest.get('hand_'+side).world).normalize();
 const bindPalm=new Vector3(0,0,1).addScaledVector(bindAxis,-bindAxis.z).normalize();
 const forearmQ=forearm.getWorldQuaternion(new Quaternion());
 const currentPalm=bindPalm.clone().applyQuaternion(forearmQ.clone().multiply(rest.get(forearm.name).worldQ.clone().invert()));
 const wantedPalm=bindPalm.clone().applyQuaternion(desired.clone().multiply(rest.get(hand.name).worldQ.clone().invert()));
 currentPalm.addScaledVector(axis,-currentPalm.dot(axis)).normalize();wantedPalm.addScaledVector(axis,-wantedPalm.dot(axis)).normalize();
 const angle=Math.atan2(axis.dot(currentPalm.clone().cross(wantedPalm)),currentPalm.dot(wantedPalm));
 const rolled=new Quaternion().setFromAxisAngle(axis,angle*.9).multiply(forearmQ);
 forearm.quaternion.copy(forearm.parent.getWorldQuaternion(new Quaternion()).invert().multiply(rolled));forearm.updateMatrixWorld(true);
 hand.quaternion.copy(hand.parent.getWorldQuaternion(new Quaternion()).invert().multiply(desired)).normalize();hand.updateMatrixWorld(true);
}
