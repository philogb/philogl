// camera.js
// Provides a Camera with ModelView and Projection matrices

import {Vec3, Mat4} from './math';

export default class Camera {

  constructor(fov, aspect, near, far,
    {type = 'perspective', position: pos, target, up}) {

    this.type = type;
    this.fov = fov;
    this.near = near;
    this.far = far;
    this.aspect = aspect;
    this.position = pos ? new Vec3(pos.x, pos.y, pos.z) : new Vec3();
    this.target = target ? new Vec3(target.x, target.y, target.z) : new Vec3();
    this.up = up && new Vec3(up.x, up.y, up.z) || new Vec3(0, 1, 0);
    if (this.type === 'perspective') {
      this.projection = new Mat4().perspective(fov, aspect, near, far);
    } else {
      const ymax = near * Math.tan(fov * Math.PI / 360);
      const ymin = -ymax;
      const xmin = ymin * aspect;
      const xmax = ymax * aspect;
      this.projection = new Mat4().ortho(xmin, xmax, ymin, ymax, near, far);
    }
    this.view = new Mat4();
  }

  update() {
    if (this.type === 'perspective') {
      this.projection =
        new Mat4().perspective(this.fov, this.aspect, this.near, this.far);
    } else {
      const ymax = this.near * Math.tan(this.fov * Math.PI / 360);
      const ymin = -ymax;
      const xmin = ymin * this.aspect;
      const xmax = ymax * this.aspect;
      this.projection =
        new Mat4().ortho(xmin, xmax, ymin, ymax, this.near, this.far);
    }
    this.view.lookAt(this.position, this.target, this.up);
  }

  // Set Camera view and projection matrix
  setStatus(program) {
    const pos = this.position;
    const viewProjection = this.view.mulMat4(this.projection);
    const viewProjectionInverse = viewProjection.invert();
    program.setUniforms({
      cameraPosition: [pos.x, pos.y, pos.z],
      projectionMatrix: this.projection,
      viewMatrix: this.view,
      viewProjectionMatrix: viewProjection,
      viewInverseMatrix: this.view.invert(),
      viewProjectionInverseMatrix: viewProjectionInverse
    });
  }

}
