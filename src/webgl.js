//webgl.js
//Checks if WebGL is enabled and creates a context for using WebGL.

(function () {

  var WebGL = {

    getContext: function(canvas, opt) {
      var canvas = typeof canvas == 'string'? $(canvas) : canvas, ctx;
      ctx = canvas.getContext('experimental-webgl', opt);
      if (!ctx) {
        ctx = canvas.getContext('webgl', opt);
      }
      var gl;
      //Set as debug handler
      if (ctx && opt && opt.debug) {
        gl = {};
        for (var m in ctx) {
          var f = ctx[m];
          if (typeof f == 'function') {
            gl[m] = (function(k, v) {
              return function() {
                console.log(k, Array.prototype.join.call(arguments), Array.prototype.slice.call(arguments));
                try {
                  var ans = v.apply(ctx, arguments);
                } catch (e) {
                  throw k + " " + e;
                }
                var errorStack = [], error;
                while((error = ctx.getError()) !== ctx.NO_ERROR) {
                  errorStack.push(error);
                }
                if (errorStack.length) {
                  throw errorStack.join();
                }
                return ans;
              };
            })(m, f);
          } else {
            gl[m] = f;
          }
        }
      } else {
        gl = ctx;
      }

      //add a get by name param
      if (gl) {
        gl.get = function(name) {
          return typeof name == 'string'? gl[name] : name;
        };
      }

      return gl;
    }

  };

  function Application(options) {
    //copy program, scene, camera, etc.
    for (var prop in options) {
      this[prop] = options[prop];
    }
    //handle buffers
    this.buffers = {};
    this.bufferMemo = {};
    //handle framebuffers
    this.frameBuffers = {};
    this.frameBufferMemo = {};
    //handle renderbuffers
    this.renderBuffers = {};
    this.renderBufferMemo = {};
    //handle textures
    this.textures = {};
    this.textureMemo = {};
  }

  Application.prototype = {
    $$family: 'application',

    setBuffer: function(program, name, opt) {
      //unbind buffer
      if (opt === false || opt === null) {
        opt = this.bufferMemo[name];
        //reset buffer
        if(opt) {
          this.gl.bindBuffer(opt.bufferType, null);
        }
        //disable vertex attrib array if the buffer maps to an attribute.
        var attributeName = opt && opt.attribute || name,
            loc = program.attributes[attributeName];
        //disable the attribute array
        if (loc !== undefined) {
          this.gl.disableVertexAttribArray(loc);
        }
        return;
      }

      //set defaults
      opt = $.extend(this.bufferMemo[name] || {
        bufferType: this.gl.ARRAY_BUFFER,
        size: 1,
        dataType: this.gl.FLOAT,
        stride: 0,
        offset: 0,
        drawType: this.gl.STATIC_DRAW,
        instanced: 0
      }, opt || {});

      var attributeName = opt.attribute || name,
          bufferType = opt.bufferType,
          instanced = opt.instanced,
          hasBuffer = name in this.buffers,
          buffer = hasBuffer? this.buffers[name] : this.gl.createBuffer(),
          hasValue = 'value' in opt,
          value = opt.value,
          size = opt.size,
          dataType = opt.dataType,
          stride = opt.stride,
          offset = opt.offset,
          drawType = opt.drawType,
          loc = program.attributes[attributeName],
          isAttribute = loc !== undefined,
          ext;

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

      //set default options so we don't have to next time.
      //set them under the buffer name and attribute name (if an
      //attribute is defined)
      delete opt.value;
      this.bufferMemo[name] = opt;
      if (isAttribute) {
        this.bufferMemo[attributeName] = opt;
      }

      return this;
    },

    setBuffers: function(program, obj) {
      for (var name in obj) {
        this.setBuffer(program, name, obj[name]);
      }
      return this;
    },

    setFrameBuffer: function(name, opt) {
      //bind/unbind framebuffer
      if (typeof opt != 'object') {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, opt? this.frameBuffers[name] : null);
        return;
      }
      //get options
      opt = $.merge(this.frameBufferMemo[name] || {
        width: 0,
        height: 0,
        //All texture params
        bindToTexture: false,
        textureOptions: {
          attachment: this.gl.COLOR_ATTACHMENT0
        },
        //All render buffer params
        bindToRenderBuffer: false,
        renderBufferOptions: {
          attachment: this.gl.DEPTH_ATTACHMENT
        }
      }, opt || {});

      var bindToTexture = opt.bindToTexture,
          bindToRenderBuffer = opt.bindToRenderBuffer,
          hasBuffer = name in this.frameBuffers,
          frameBuffer = hasBuffer? this.frameBuffers[name] : this.gl.createFramebuffer();

      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);

      if (!hasBuffer) {
        this.frameBuffers[name] = frameBuffer;
      }

      if (bindToTexture) {
        var texBindOpt = $.merge({
              data: {
                width: opt.width,
                height: opt.height
              }
            }, $.type(bindToTexture) == 'object'? bindToTexture : {}),
            texName = name + '-texture',
            texOpt = opt.textureOptions;

        this.setTexture(texName, texBindOpt);

        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, texOpt.attachment, this.textureMemo[texName].textureType, this.textures[texName], 0);
      }

      if (bindToRenderBuffer) {
        var rbBindOpt = $.extend({
              width: opt.width,
              height: opt.height
            }, $.type(bindToRenderBuffer) == 'object'? bindToRenderBuffer : {}),
            rbName = name + '-renderbuffer',
            rbOpt = opt.renderBufferOptions;

        this.setRenderBuffer(rbName, rbBindOpt);

        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, rbOpt.attachment, this.gl.RENDERBUFFER, this.renderBuffers[rbName]);
      }

      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

      this.frameBufferMemo[name] = opt;

      return this;
    },

    setFrameBuffers: function(obj) {
      for (var name in obj) {
        this.setFrameBuffer(name, obj[name]);
      }
      return this;
    },

    setRenderBuffer: function(name, opt) {
      if (typeof opt != 'object') {
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, opt? this.renderBufferMemo[name] : null);
        return;
      }

      opt = $.extend(this.renderBufferMemo[name] || {
        storageType: this.gl.DEPTH_COMPONENT16,
        width: 0,
        height: 0
      }, opt || {});

      var hasBuffer = name in this.renderBuffers,
          renderBuffer = hasBuffer? this.renderBuffers[name] : this.gl.createRenderbuffer(this.gl.RENDERBUFFER);

      if (!hasBuffer) {
        this.renderBuffers[name] = renderBuffer;
      }

      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, renderBuffer);

      this.gl.renderbufferStorage(this.gl.RENDERBUFFER, opt.storageType, opt.width, opt.height);

      this.renderBufferMemo[name] = opt;

      return this;
    },

    setRenderBuffers: function(obj) {
      for (var name in obj) {
        this.setRenderBuffer(name, obj[name]);
      }
      return this;
    },

    setTexture: function(name, opt) {
      //bind texture
      if (!opt || typeof opt != 'object') {
        this.gl.activeTexture(opt || this.gl.TEXTURE0);
        this.gl.bindTexture(this.textureMemo[name].textureType || this.gl.TEXTURE_2D, this.textures[name]);
        return;
      }

      if (opt.data && opt.data.type === this.gl.FLOAT) {
        // Enable floating-point texture.
        if (!this.gl.getExtension('OES_texture_float')) {
          throw 'OES_texture_float is not supported';
        }
      }

      //get defaults
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

      var textureType = ('textureType' in opt)? opt.textureType = this.gl.get(opt.textureType) : this.gl.TEXTURE_2D,
          textureTarget = ('textureTarget' in opt)? opt.textureTarget = this.gl.get(opt.textureTarget) : textureType,
          isCube = textureType == this.gl.TEXTURE_CUBE_MAP,
          hasTexture = name in this.textures,
          texture = hasTexture? this.textures[name] : this.gl.createTexture(),
          pixelStore = opt.pixelStore,
          parameters = opt.parameters,
          data = opt.data,
          value = data.value,
          type = data.type,
          format = data.format,
          hasValue = !!data.value;

      //save texture
      if (!hasTexture) {
        this.textures[name] = texture;
      }
      this.gl.bindTexture(textureType, texture);
      if (!hasTexture) {
        //set texture properties
        pixelStore.forEach(function(opt) {
          opt.name = typeof opt.name == 'string'? this.gl.get(opt.name) : opt.name;
          this.gl.pixelStorei(opt.name, opt.value);
        }.bind(this));
      }

      //load texture
      if (hasValue) {
        //beware that we can be loading multiple textures (i.e. it could be a cubemap)
        if (isCube) {
          for (var i = 0; i < 6; ++i) {
            if ((data.width || data.height) && (!value.width && !value.height)) {
              this.gl.texImage2D(textureTarget[i], 0, format, data.width, data.height, data.border, format, type, value[i]);
            } else {
              this.gl.texImage2D(textureTarget[i], 0, format, format, type, value[i]);
            }
          }
        } else {
          if ((data.width || data.height) && (!value.width && !value.height)) {
            this.gl.texImage2D(textureTarget, 0, format, data.width, data.height, data.border, format, type, value);
          } else {
            this.gl.texImage2D(textureTarget, 0, format, format, type, value);
          }
        }

      //we're setting a texture to a framebuffer
      } else if (data.width || data.height) {
        this.gl.texImage2D(textureTarget, 0, format, data.width, data.height, data.border, format, type, null);
      }
      //set texture parameters
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
      //remember whether the texture is a cubemap or not
      opt.isCube = isCube;

      //set default options so we don't have to next time.
      if (hasValue) {
        opt.data.value = false;
      }

      this.textureMemo[name] = opt;

      return this;
    },

    setTextures: function(obj) {
      for (var name in obj) {
        this.setTexture(name, obj[name]);
      }
      return this;
    },

    use: function(program) {
      this.gl.useProgram(program.program);
      //remember last used program.
      this.usedProgram = program;
      return this;
    }
  };

  WebGL.Application = Application;

  //Feature test WebGL
  (function() {
    try {
      var canvas = document.createElement('canvas');
      PhiloGL.hasWebGL = function() {
          return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      };
    } catch(e) {
      PhiloGL.hasWebGL = function() {
          return false;
      };
    }
    PhiloGL.hasExtension = function(name) {
      if (!PhiloGL.hasWebGL()) return false;
      var canvas = document.createElement('canvas');
      return (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')).getExtension(name);
    };
  })();

  PhiloGL.WebGL = WebGL;

})();
