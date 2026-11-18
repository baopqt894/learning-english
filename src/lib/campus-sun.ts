import { Box3, Matrix4, Vector3, type DirectionalLight, type OrthographicCamera } from 'three';

// Fit one directional shadow map to the visible ground and rooftops, including
// casters just outside the view that can project a shadow onto the ground.
export function campusSunFitter(sun: DirectionalLight) {
  const world = new Matrix4(), projection = new Matrix4(), previousSun = new Vector3();
  const forward = new Vector3(), right = new Vector3(), up = new Vector3(), light = new Vector3();
  const corner = new Vector3(), point = new Vector3(), projected = new Vector3();
  const bounds = new Box3();
  const floor = -1, roof = 16;

  return (camera: OrthographicCamera, offset: Vector3) => {
    camera.updateWorldMatrix(true, false);
    if (world.equals(camera.matrixWorld) && projection.equals(camera.projectionMatrix) && previousSun.equals(offset)) return false;
    world.copy(camera.matrixWorld);
    projection.copy(camera.projectionMatrix);
    previousSun.copy(offset);
    camera.getWorldDirection(forward);
    light.copy(offset).normalize();
    right.crossVectors(sun.up, light).normalize();
    up.crossVectors(light, right);
    bounds.makeEmpty();
    for (const x of [-1,1]) for (const y of [-1,1]) {
      corner.set(x,y,-1).unproject(camera);
      for (const level of [floor,roof]) {
        point.copy(corner).addScaledVector(forward,(level-corner.y)/forward.y);
        bounds.expandByPoint(projected.set(right.dot(point),up.dot(point),light.dot(point)));
      }
    }
    const margin = 2;
    const halfWidth = Math.ceil((bounds.max.x-bounds.min.x)/2) + margin;
    const halfHeight = Math.ceil((bounds.max.y-bounds.min.y)/2) + margin;
    const texelX = 2*halfWidth/sun.shadow.mapSize.x, texelY = 2*halfHeight/sun.shadow.mapSize.y;
    const x = Math.round((bounds.max.x+bounds.min.x)/(2*texelX))*texelX;
    const y = Math.round((bounds.max.y+bounds.min.y)/(2*texelY))*texelY;
    sun.target.position.copy(right).multiplyScalar(x).addScaledVector(up,y).addScaledVector(light,bounds.min.z-margin);
    const depth = bounds.max.z-bounds.min.z+(roof-floor)/light.y+2*margin;
    sun.position.copy(sun.target.position).addScaledVector(light,depth);
    const shadow = sun.shadow.camera;
    if (shadow.right!==halfWidth || shadow.top!==halfHeight || shadow.far!==depth+margin) {
      Object.assign(shadow, {left:-halfWidth,right:halfWidth,top:halfHeight,bottom:-halfHeight,near:.1,far:depth+margin});
      shadow.updateProjectionMatrix();
    }
    return true;
  };
}
