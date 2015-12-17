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
    // unbind buffer
    if (opt === false || opt === null) {
      opt = this.bufferMemo[name];
      // reset buffer
      if (opt) {
        this.gl.bindBuffer(opt.bufferType, null);
      }
      // disable vertex attrib array if the buffer maps to an attribute.
      const attributeName = opt && opt.attribute || name;
      const loc = program.attributes[attributeName];
      // disable the attribute array
      if (loc !== undefined) {
        this.gl.disableVertexAttribArray(loc);
      }
      return this;
    }

    // set defaults
    opt = $.extend(this.bufferMemo[name] || {
      bufferType: this.gl.ARRAY_BUFFER,
      size: 1,
      dataType: this.gl.FLOAT,
      stride: 0,
      offset: 0,
      drawType: this.gl.STATIC_DRAW,
      instanced: 0
    }, opt || {});

    const attributeName = opt.attribute || name;
    const bufferType = opt.bufferType;
    const instanced = opt.instanced;
    const hasBuffer = name in this.buffers;
    const buffer = hasBuffer? this.buffers[name] : this.gl.createBuffer();
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
      this.gl.enableVertexAttribArray(loc);
    }

    this.gl.bindBuffer(bufferType, buffer);

    if (hasValue) {
      this.gl.bufferData(bufferType, value, drawType);
    }

    if (isAttribute) {
      this.gl.vertexAttribPointer(loc, size, dataType, false, stride, offset);
      if (instanced) {
        ext = this.gl.getExtension('ANGLE_instanced_arrays');
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
    // bind/unbind framebuffer
    if (typeof opt !== 'object') {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, opt ? this.frameBuffers[name] : null);
      return this;
    }
    // get options
    opt = {
      ...this.frameBufferMemo[name],
      width: 0,
      height: 0,
      //  All texture params
      bindToTexture: false,
      textureOptions: {attachment: this.gl.COLOR_ATTACHMENT0},
      //  All render buffer params
      bindToRenderBuffer: false,
      renderBufferOptions: {attachment: this.gl.DEPTH_ATTACHMENT},
      ...opt
    };

    const bindToTexture = opt.bindToTexture;
    const bindToRenderBuffer = opt.bindToRenderBuffer;
    const hasBuffer = name in this.frameBuffers;
    const frameBuffer = hasBuffer ?
      this.frameBuffers[name] : this.gl.createFramebuffer();

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);

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

      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
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

      this.gl.framebufferRenderbuffer(
        this.gl.FRAMEBUFFER,
        rbOpt.attachment,
        this.gl.RENDERBUFFER,
        this.renderBuffers[rbName]
      );
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

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
    if (typeof opt !== 'object') {
      this.gl.bindRenderbuffer(
        this.gl.RENDERBUFFER,
        opt ? this.renderBufferMemo[name] : null
      );
      return this;
    }

    opt = $.extend(this.renderBufferMemo[name] || {
      storageType: this.gl.DEPTH_COMPONENT16,
      width: 0,
      height: 0
    }, opt || {});

    const hasBuffer = name in this.renderBuffers;
    const renderBuffer = hasBuffer ?
      this.renderBuffers[name] : this.gl.createRenderbuffer(this.gl.RENDERBUFFER);

    if (!hasBuffer) {
      this.renderBuffers[name] = renderBuffer;
    }

    this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderBuffer);

    this.gl.renderbufferStorage(
      this.gl.RENDERBUFFER, opt.storageType, opt.width, opt.height);

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
    // bind texture
    if (!opt || typeof opt !== 'object') {
      this.gl.activeTexture(opt || this.gl.TEXTURE0);
      this.gl.bindTexture(
        this.textureMemo[name].textureType || this.gl.TEXTURE_2D,
        this.textures[name]
      );
      return this;
    }

    if (opt.data && opt.data.type === this.gl.FLOAT) {
      // Enable floating-point texture.
      if (!this.gl.getExtension('OES_texture_float')) {
        throw new Error('OES_texture_float is not supported');
      }
    }

    // get defaults
    // rye: TODO- use lodash.defaultsDeep instead of $merge.
    opt = $.merge(this.textureMemo[name] || {
      textureType: this.gl.TEXTURE_2D,
      pixelStore: [{
        name: this.gl.UNPACK_FLIP_Y_WEBGL,
        value: true
      }, {
        name: this.gl.UNPACK_ALIGNMENT,
        value: 1
      }],
      parameters: [{
        name: this.gl.TEXTURE_MAG_FILTER,
        value: this.gl.NEAREST
      }, {
        name: this.gl.TEXTURE_MIN_FILTER,
        value: this.gl.NEAREST
      }, {
        name: this.gl.TEXTURE_WRAP_S,
        value: this.gl.CLAMP_TO_EDGE
      }, {
        name: this.gl.TEXTURE_WRAP_T,
        value: this.gl.CLAMP_TO_EDGE
      }],
      data: {
        format: this.gl.RGBA,
        value: false,
        type: this.gl.UNSIGNED_BYTE,

        width: 0,
        height: 0,
        border: 0
      }

    }, opt || {});

    var textureType = ('textureType' in opt) ?
      opt.textureType = this.gl.get(opt.textureType) : this.gl.TEXTURE_2D;
    const textureTarget = ('textureTarget' in opt) ?
      opt.textureTarget = this.gl.get(opt.textureTarget) : textureType;
    const isCube = textureType == this.gl.TEXTURE_CUBE_MAP;
    const hasTexture = name in this.textures;
    const texture = hasTexture? this.textures[name] : this.gl.createTexture();
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
    this.gl.bindTexture(textureType, texture);
    if (!hasTexture) {
      // set texture properties
      pixelStore.forEach(opt => {
        opt.name = typeof opt.name == 'string' ? this.gl.get(opt.name) : opt.name;
        this.gl.pixelStorei(opt.name, opt.value);
      });
    }

    // load texture
    if (hasValue) {
      // beware that we can be loading multiple textures (i.e. it could be a cubemap)
      if (isCube) {
        for (var i = 0; i < 6; ++i) {
          if ((data.width || data.height) && (!value.width && !value.height)) {
            this.gl.texImage2D(textureTarget[i], 0, format,
              data.width, data.height, data.border, format, type, value[i]);
          } else {
            this.gl.texImage2D(textureTarget[i], 0, format, format, type, value[i]);
          }
        }
      } else {
        if ((data.width || data.height) && (!value.width && !value.height)) {
          this.gl.texImage2D(textureTarget, 0, format,
            data.width, data.height, data.border, format, type, value);
        } else {
          this.gl.texImage2D(textureTarget, 0, format, format, type, value);
        }
      }

    // we're setting a texture to a framebuffer
    } else if (data.width || data.height) {
      this.gl.texImage2D(textureTarget, 0, format,
        data.width, data.height, data.border, format, type, null);
    }
    // set texture parameters
    if (!hasTexture) {
      for (i = 0; i < parameters.length ;i++) {
        var opti = parameters[i];
        opti.name = this.gl.get(opti.name);
        opti.value = this.gl.get(opti.value);
        this.gl.texParameteri(textureType, opti.name, opti.value);
        if (opti.generateMipmap) {
          this.gl.generateMipmap(textureType);
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
    this.gl.useProgram(program.program);
    // remember last used program.
    this.usedProgram = program;
    return this;
  }
}

