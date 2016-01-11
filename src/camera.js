// camera.js
// Provides a Camera with ModelView and Projection matrices

import {Vec3, Mat4} from './math';
import $ from './jquery-mini';


class Camera {

  constructor(opts) {
    opts = $.merge({
      fov: 45,
      near: 0.1,
      far: 500,
      aspect: 1,
      position: new Vec3(0, 0, 0),
      target: new Vec3(0, 0, -1),
      up: new Vec3(0, 1, 0)
    }, opts);
    this.fov = opts.fov;
    this.near = opts.near;
    this.far = opts.far;
    this.aspect = opts.aspect;
    this.position = opts.position;
    this.target = opts.target;
    this.up = opts.up;
    this.view = new Mat4();
    this.update();
  }

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


export class PerspectiveCamera extends Camera {

  update() {
    this.projection = new Mat4().perspective(this.fov, this.aspect, this.near, this.far);
    this.view.lookAt(this.position, this.target, this.up);
  }

}


export class OrthoCamera {

  update() {
    const ymax = this.near * Math.tan(this.fov * Math.PI / 360);
    const ymin = -ymax;
    const xmin = ymin * this.aspect;
    const xmax = ymax * this.aspect;
    this.projection = new Mat4().ortho(xmin, xmax, ymin, ymax, this.near, this.far);
    this.view.lookAt(this.position, this.target, this.up);
  }

}

// export default class Camera {
//
//   constructor(fov, aspect, near, far,
//     {type = 'perspective', position: pos, target, up}) {
//
//     this.type = type;
//     this.fov = fov;
//     this.near = near;
//     this.far = far;
//     this.aspect = aspect;
//     this.position = pos ? new Vec3(pos.x, pos.y, pos.z) : new Vec3();
//     this.target = target ? new Vec3(target.x, target.y, target.z) : new Vec3();
//     this.up = up && new Vec3(up.x, up.y, up.z) || new Vec3(0, 1, 0);
//     if (this.type === 'perspective') {
//       this.projection = new Mat4().perspective(fov, aspect, near, far);
//     } else {
//       const ymax = near * Math.tan(fov * Math.PI / 360);
//       const ymin = -ymax;
//       const xmin = ymin * aspect;
//       const xmax = ymax * aspect;
//       this.projection = new Mat4().ortho(xmin, xmax, ymin, ymax, near, far);
//     }
//     this.view = new Mat4();
//   }
//
//   update() {
//     if (this.type === 'perspective') {
//       this.projection =
//         new Mat4().perspective(this.fov, this.aspect, this.near, this.far);
//     } else {
//       const ymax = this.near * Math.tan(this.fov * Math.PI / 360);
//       const ymin = -ymax;
//       const xmin = ymin * this.aspect;
//       const xmax = ymax * this.aspect;
//       this.projection =
//         new Mat4().ortho(xmin, xmax, ymin, ymax, this.near, this.far);
//     }
//     this.view.lookAt(this.position, this.target, this.up);
//   }
//
//   // Set Camera view and projection matrix
//   setStatus(program) {
//     const pos = this.position;
//     const viewProjection = this.view.mulMat4(this.projection);
//     const viewProjectionInverse = viewProjection.invert();
//     program.setUniforms({
//       cameraPosition: [pos.x, pos.y, pos.z],
//       projectionMatrix: this.projection,
//       viewMatrix: this.view,
//       viewProjectionMatrix: viewProjection,
//       viewInverseMatrix: this.view.invert(),
//       viewProjectionInverseMatrix: viewProjectionInverse
//     });
//   }
//
// }
