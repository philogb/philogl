/* eslint-disable guard-for-in */
import $ from './jquery-mini';
import {createGLContext} from './webgl';

export default class Application {

  constructor(canvas, options) {
    this.canvas = typeof canvas === 'string' ? getElementById(canvas) : canvas;
    this.gl = createGLContext(this.canvas, options);
    // handle framebuffers
    this.frameBuffers = {};
    this.frameBufferMemo = {};
    // handle renderbuffers
    this.renderBuffers = {};
    this.renderBufferMemo = {};
  }

  setFrameBuffer(name, opt = {}) {
    const gl = this.gl;

    // bind/unbind framebuffer
    if (typeof opt !== 'object') {
      gl.bindFramebuffer(gl.FRAMEBUFFER, opt ? this.frameBuffers[name] : null);
      return this;
    }
    // get options
    opt = {
      ...this.frameBufferMemo[name],
      width: 0,
      height: 0,
      //  All texture params
      bindToTexture: false,
      textureOptions: {attachment: gl.COLOR_ATTACHMENT0},
      //  All render buffer params
      bindToRenderBuffer: false,
      renderBufferOptions: {attachment: gl.DEPTH_ATTACHMENT},
      ...opt
    };

    const bindToTexture = opt.bindToTexture;
    const bindToRenderBuffer = opt.bindToRenderBuffer;
    const hasBuffer = name in this.frameBuffers;
    const frameBuffer = hasBuffer ?
      this.frameBuffers[name] : gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    if (!hasBuffer) {
      this.frameBuffers[name] = frameBuffer;
    }

    if (bindToTexture) {
      bindToTexture.bind();
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        opt.textureOptions.attachment,
        bindToTexture.target,
        bindToTexture.texture,
        0
      );
    }

    if (bindToRenderBuffer) {
      const rbBindOpt = $.extend({
        width: opt.width,
        height: opt.height
      }, $.type(bindToRenderBuffer) === 'object' ? bindToRenderBuffer : {});
      const rbName = name + '-renderbuffer';
      const rbOpt = opt.renderBufferOptions;

      this.setRenderBuffer(rbName, rbBindOpt);

      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        rbOpt.attachment,
        gl.RENDERBUFFER,
        this.renderBuffers[rbName]
      );
    }

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.frameBufferMemo[name] = opt;

    return this;
  }

  setFrameBuffers(obj) {
    for (var name in obj) {
      this.setFrameBuffer(name, obj[name]);
    }
    return this;
  }

  setRenderBuffer(name, opt) {
    const gl = this.gl;

    if (typeof opt !== 'object') {
      gl.bindRenderbuffer(
        gl.RENDERBUFFER,
        opt ? this.renderBufferMemo[name] : null
      );
      return this;
    }

    opt = $.extend(this.renderBufferMemo[name] || {
      storageType: gl.DEPTH_COMPONENT16,
      width: 0,
      height: 0
    }, opt || {});

    const hasBuffer = name in this.renderBuffers;
    const renderBuffer = hasBuffer ?
      this.renderBuffers[name] : gl.createRenderbuffer(gl.RENDERBUFFER);

    if (!hasBuffer) {
      this.renderBuffers[name] = renderBuffer;
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

    gl.renderbufferStorage(
      gl.RENDERBUFFER, opt.storageType, opt.width, opt.height);

    this.renderBufferMemo[name] = opt;

    return this;
  }

  setRenderBuffers(obj) {
    for (var name in obj) {
      this.setRenderBuffer(name, obj[name]);
    }
    return this;
  }

  use(program) {
    const gl = this.gl;
    gl.useProgram(program.program);
    // remember last used program.
    this.usedProgram = program;
    return this;
  }
}
