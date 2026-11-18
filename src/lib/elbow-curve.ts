import { Quaternion, Vector3 } from 'three';

export const cadetElbowSpanRatio = .46;
export const elbowSegments = 6;
export function elbowGuideName(step: number, side: string) {
  return step === elbowSegments / 2 ? 'elbow_bend_' + side : 'elbow_curve_' + step + '_' + side;
}

export function elbowSpan(upperLength: number, lowerLength: number, ratio = .65) {
  return ratio * Math.min(upperLength, lowerLength);
}

/** A cross section on the quadratic arc between two points equidistant from
 * the elbow. All calculations use the upper arm's frame. */
export function elbowGuide(elbow: Vector3, wrist: Vector3, bind: Quaternion, t: number, spanRatio?: number) {
  const upper = elbow.clone().normalize();
  const lower = wrist.clone().normalize();
  const span = elbowSpan(elbow.length(), wrist.length(), spanRatio);
  const base = elbow.clone().addScaledVector(upper, -span * (1-t) ** 2);
  const inverseBind = bind.clone().invert();
  const restTangent = upper.clone().lerp(lower.clone().applyQuaternion(bind), t).normalize();
  const segment = new Vector3(), tangent = new Vector3(), rotated = new Vector3();
  const change = new Quaternion(), align = new Quaternion();
  return (rotation: Quaternion, centre: Vector3, frame: Quaternion) => {
    segment.copy(lower).applyQuaternion(rotation);
    centre.copy(base).addScaledVector(segment, span*t*t);
    change.copy(rotation).multiply(inverseBind);
    frame.identity().slerp(change, t);
    tangent.copy(upper).lerp(segment,t).normalize();
    rotated.copy(restTangent).applyQuaternion(frame);
    frame.premultiply(align.setFromUnitVectors(rotated,tangent)).normalize();
  };
}
