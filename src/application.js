/* eslint-disable guard-for-in */
import $ from './jquery-mini';
import {createGLContext} from './webgl';

export default class Application {

  constructor(canvas, options) {
    this.canvas = typeof canvas === 'string' ? getElementById(canvas) : canvas;
    this.gl = createGLContext(this.canvas, options);
  }

  use(program) {
    const gl = this.gl;
    gl.useProgram(program.program);
    // remember last used program.
    this.usedProgram = program;
    return this;
  }
}
