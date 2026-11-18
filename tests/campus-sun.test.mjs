import test from 'node:test';
import assert from 'node:assert/strict';
import { DirectionalLight, OrthographicCamera, Vector3 } from 'three';
import { campusSunFitter } from '../src/lib/campus-sun.ts';
import { PHOTO_LIGHTS } from '../src/lib/campus-photo.ts';

test('shadow projection covers every visible corner and its upstream caster when turning, panning and zooming', () => {
  const sun=new DirectionalLight(), fit=campusSunFitter(sun);
  sun.shadow.mapSize.set(1024,1024);
  for(const aspect of [.46,1.85,3]) for(const zoom of [.12,.7,1.2,4]) for(const [x,z] of [[21,39],[-29,-13]]) {
    const cam=new OrthographicCamera(-15*aspect,15*aspect,15,-15,.1,1200);
    cam.position.set(65+x,27,-50+z);cam.lookAt(65,1,-50);cam.zoom=zoom;cam.updateProjectionMatrix();
    for(const look of Object.values(PHOTO_LIGHTS)) {
      const direction=new Vector3(...look.direction);
      assert.ok(fit(cam,direction));assert.equal(fit(cam,direction),false);
      sun.updateMatrixWorld();sun.target.updateMatrixWorld();sun.shadow.updateMatrices(sun);
      const forward=cam.getWorldDirection(new Vector3());
      for(const u of [-1,1]) for(const v of [-1,1]) for(const y of [-1,0,8,16]) {
        const corner=new Vector3(u,v,-1).unproject(cam);corner.addScaledVector(forward,(y-corner.y)/forward.y);
        for(const p of [corner,corner.clone().addScaledVector(direction,(16-y)/direction.y)]) {
          const projected=p.project(sun.shadow.camera);
          assert.ok(Math.max(Math.abs(projected.x),Math.abs(projected.y),Math.abs(projected.z)) <= 1.00001);
        }
      }
    }
  }
});
