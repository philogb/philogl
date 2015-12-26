/* eslint-disable guard-for-in */
import $ from './jquery-mini';

export default class Application {

  constructor(options) {
    this.$$family = 'application';
    // copy program, scene, camera, etc.
    for (var prop in options) {
      this[prop] = options[prop];
    }
    // handle buffers
    this.buffers = {};
    this.bufferMemo = {};
    // handle framebuffers
    this.frameBuffers = {};
    this.frameBufferMemo = {};
    // handle renderbuffers
    this.renderBuffers = {};
    this.renderBufferMemo = {};
    // handle textures
    this.textures = {};
    this.textureMemo = {};
  }

  setBuffer(program, name, opt) {
    const gl = this.gl;

    // unbind buffer
    if (opt === false || opt === null) {
      opt = this.bufferMemo[name];
      // reset buffer
      if (opt) {
        gl.bindBuffer(opt.bufferType, null);
      }
      // disable vertex attrib array if the buffer maps to an attribute.
      const attributeName = opt && opt.attribute || name;
      const loc = program.attributes[attributeName];
      // disable the attribute array
      if (loc !== undefined) {
        gl.disableVertexAttribArray(loc);
      }
      return this;
    }

    // set defaults
    opt = $.extend(this.bufferMemo[name] || {
      bufferType: gl.ARRAY_BUFFER,
      size: 1,
      dataType: gl.FLOAT,
      stride: 0,
      offset: 0,
      drawType: gl.STATIC_DRAW,
      instanced: 0
    }, opt || {});

    const attributeName = opt.attribute || name;
    const bufferType = opt.bufferType;
    const instanced = opt.instanced;
    const hasBuffer = name in this.buffers;
    const buffer = hasBuffer ? this.buffers[name] : gl.createBuffer();
    const hasValue = 'value' in opt;
    const value = opt.value;
    const size = opt.size;
    const dataType = opt.dataType;
    const stride = opt.stride;
    const offset = opt.offset;
    const drawType = opt.drawType;
    const loc = program.attributes[attributeName];
    const isAttribute = loc !== undefined;
    let ext;

    if (!hasBuffer) {
      this.buffers[name] = buffer;
    }

    if (isAttribute) {
      gl.enableVertexAttribArray(loc);
    }

    gl.bindBuffer(bufferType, buffer);

    if (hasValue) {
      gl.bufferData(bufferType, value, drawType);
    }

    if (isAttribute) {
      gl.vertexAttribPointer(loc, size, dataType, false, stride, offset);
      if (instanced) {
        ext = gl.getExtension('ANGLE_instanced_arrays');
        if (!ext) {
          console.warn('ANGLE_instanced_arrays not supported!');
        } else {
          ext.vertexAttribDivisorANGLE(loc, instanced === true ? 1 : instanced);
        }
      }
    }

    // set default options so we don't have to next time.
    // set them under the buffer name and attribute name (if an
    // attribute is defined)
    delete opt.value;
    this.bufferMemo[name] = opt;
    if (isAttribute) {
      this.bufferMemo[attributeName] = opt;
    }

    return this;
  }

  setBuffers(program, obj) {
    for (var name in obj) {
      this.setBuffer(program, name, obj[name]);
    }
    return this;
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
      var texBindOpt = {
        data: {
          width: opt.width,
          height: opt.height
        },
        ...($.type(bindToTexture) === 'object' ? bindToTexture : {})
      };
      const texName = name + '-texture';
      const texOpt = opt.textureOptions;

      this.setTexture(texName, texBindOpt);

      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        texOpt.attachment,
        this.textureMemo[texName].textureType,
        this.textures[texName],
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

  setTexture(name, opt) {
    const gl = this.gl;

    // bind texture
    if (!opt || typeof opt !== 'object') {
      gl.activeTexture(opt || gl.TEXTURE0);
      gl.bindTexture(
        this.textureMemo[name].textureType || gl.TEXTURE_2D,
        this.textures[name]
      );
      return this;
    }

    if (opt.data && opt.data.type === gl.FLOAT) {
      // Enable floating-point texture.
      if (!gl.getExtension('OES_texture_float')) {
        throw new Error('OES_texture_float is not supported');
      }
    }

    // get defaults
    // rye: TODO- use lodash.defaultsDeep instead of $merge.
    opt = $.merge(this.textureMemo[name] || {
      textureType: gl.TEXTURE_2D,
      pixelStore: [{
        name: gl.UNPACK_FLIP_Y_WEBGL,
        value: true
      }, {
        name: gl.UNPACK_ALIGNMENT,
        value: 1
      }],
      parameters: [{
        name: gl.TEXTURE_MAG_FILTER,
        value: gl.NEAREST
      }, {
        name: gl.TEXTURE_MIN_FILTER,
        value: gl.NEAREST
      }, {
        name: gl.TEXTURE_WRAP_S,
        value: gl.CLAMP_TO_EDGE
      }, {
        name: gl.TEXTURE_WRAP_T,
        value: gl.CLAMP_TO_EDGE
      }],
      data: {
        format: gl.RGBA,
        value: false,
        type: gl.UNSIGNED_BYTE,

        width: 0,
        height: 0,
        border: 0
      }

    }, opt || {});

    var textureType = ('textureType' in opt) ?
      opt.textureType = gl.get(opt.textureType) : gl.TEXTURE_2D;
    const textureTarget = ('textureTarget' in opt) ?
      opt.textureTarget = gl.get(opt.textureTarget) : textureType;
    const isCube = textureType == gl.TEXTURE_CUBE_MAP;
    const hasTexture = name in this.textures;
    const texture = hasTexture? this.textures[name] : gl.createTexture();
    const pixelStore = opt.pixelStore;
    const parameters = opt.parameters;
    const data = opt.data;
    const value = data.value;
    const type = data.type;
    const format = data.format;
    const hasValue = Boolean(data.value);

    // save texture
    if (!hasTexture) {
      this.textures[name] = texture;
    }
    gl.bindTexture(textureType, texture);
    if (!hasTexture) {
      // set texture properties
      pixelStore.forEach(opt => {
        opt.name = typeof opt.name == 'string' ? gl.get(opt.name) : opt.name;
        gl.pixelStorei(opt.name, opt.value);
      });
    }

    // load texture
    if (hasValue) {
      // beware that we can be loading multiple textures (i.e. it could be a cubemap)
      if (isCube) {
        for (var i = 0; i < 6; ++i) {
          if ((data.width || data.height) && (!value.width && !value.height)) {
            gl.texImage2D(textureTarget[i], 0, format,
              data.width, data.height, data.border, format, type, value[i]);
          } else {
            gl.texImage2D(textureTarget[i], 0, format, format, type, value[i]);
          }
        }
      } else {
        if ((data.width || data.height) && (!value.width && !value.height)) {
          gl.texImage2D(textureTarget, 0, format,
            data.width, data.height, data.border, format, type, value);
        } else {
          gl.texImage2D(textureTarget, 0, format, format, type, value);
        }
      }

    // we're setting a texture to a framebuffer
    } else if (data.width || data.height) {
      gl.texImage2D(textureTarget, 0, format,
        data.width, data.height, data.border, format, type, null);
    }
    // set texture parameters
    if (!hasTexture) {
      for (i = 0; i < parameters.length; i++) {
        var opti = parameters[i];
        opti.name = gl.get(opti.name);
        opti.value = gl.get(opti.value);
        gl.texParameteri(textureType, opti.name, opti.value);
        if (opti.generateMipmap) {
          gl.generateMipmap(textureType);
        }
      }
    }
    // remember whether the texture is a cubemap or not
    opt.isCube = isCube;

    // set default options so we don't have to next time.
    if (hasValue) {
      opt.data.value = false;
    }

    this.textureMemo[name] = opt;

    return this;
  }

  setTextures(obj) {
    for (var name in obj) {
      this.setTexture(name, obj[name]);
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
