(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* eslint-disable guard-for-in */
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _jqueryMini = require('./jquery-mini');

var _jqueryMini2 = _interopRequireDefault(_jqueryMini);

var Application = (function () {
  function Application(options) {
    _classCallCheck(this, Application);

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

  _createClass(Application, [{
    key: 'setBuffer',
    value: function setBuffer(program, name, opt) {
      // unbind buffer
      if (opt === false || opt === null) {
        opt = this.bufferMemo[name];
        // reset buffer
        if (opt) {
          gl.bindBuffer(opt.bufferType, null);
        }
        // disable vertex attrib array if the buffer maps to an attribute.
        var _attributeName = opt && opt.attribute || name;
        var _loc = program.attributes[_attributeName];
        // disable the attribute array
        if (_loc !== undefined) {
          gl.disableVertexAttribArray(_loc);
        }
        return this;
      }

      // set defaults
      opt = _jqueryMini2['default'].extend(this.bufferMemo[name] || {
        bufferType: gl.ARRAY_BUFFER,
        size: 1,
        dataType: gl.FLOAT,
        stride: 0,
        offset: 0,
        drawType: gl.STATIC_DRAW,
        instanced: 0
      }, opt || {});

      var attributeName = opt.attribute || name;
      var bufferType = opt.bufferType;
      var instanced = opt.instanced;
      var hasBuffer = (name in this.buffers);
      var buffer = hasBuffer ? this.buffers[name] : gl.createBuffer();
      var hasValue = ('value' in opt);
      var value = opt.value;
      var size = opt.size;
      var dataType = opt.dataType;
      var stride = opt.stride;
      var offset = opt.offset;
      var drawType = opt.drawType;
      var loc = program.attributes[attributeName];
      var isAttribute = loc !== undefined;
      var ext = undefined;

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
  }, {
    key: 'setBuffers',
    value: function setBuffers(program, obj) {
      for (var name in obj) {
        this.setBuffer(program, name, obj[name]);
      }
      return this;
    }
  }, {
    key: 'setFrameBuffer',
    value: function setFrameBuffer(name) {
      var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      // bind/unbind framebuffer
      if (typeof opt !== 'object') {
        gl.bindFramebuffer(gl.FRAMEBUFFER, opt ? this.frameBuffers[name] : null);
        return this;
      }
      // get options
      opt = _extends({}, this.frameBufferMemo[name], {
        width: 0,
        height: 0,
        //  All texture params
        bindToTexture: false,
        textureOptions: { attachment: gl.COLOR_ATTACHMENT0 },
        //  All render buffer params
        bindToRenderBuffer: false,
        renderBufferOptions: { attachment: gl.DEPTH_ATTACHMENT }
      }, opt);

      var bindToTexture = opt.bindToTexture;
      var bindToRenderBuffer = opt.bindToRenderBuffer;
      var hasBuffer = (name in this.frameBuffers);
      var frameBuffer = hasBuffer ? this.frameBuffers[name] : gl.createFramebuffer();

      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

      if (!hasBuffer) {
        this.frameBuffers[name] = frameBuffer;
      }

      if (bindToTexture) {
        var texBindOpt = _extends({
          data: {
            width: opt.width,
            height: opt.height
          }
        }, _jqueryMini2['default'].type(bindToTexture) === 'object' ? bindToTexture : {});
        var texName = name + '-texture';
        var texOpt = opt.textureOptions;

        this.setTexture(texName, texBindOpt);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, texOpt.attachment, this.textureMemo[texName].textureType, this.textures[texName], 0);
      }

      if (bindToRenderBuffer) {
        var rbBindOpt = _jqueryMini2['default'].extend({
          width: opt.width,
          height: opt.height
        }, _jqueryMini2['default'].type(bindToRenderBuffer) === 'object' ? bindToRenderBuffer : {});
        var rbName = name + '-renderbuffer';
        var rbOpt = opt.renderBufferOptions;

        this.setRenderBuffer(rbName, rbBindOpt);

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, rbOpt.attachment, gl.RENDERBUFFER, this.renderBuffers[rbName]);
      }

      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      this.frameBufferMemo[name] = opt;

      return this;
    }
  }, {
    key: 'setFrameBuffers',
    value: function setFrameBuffers(obj) {
      for (var name in obj) {
        this.setFrameBuffer(name, obj[name]);
      }
      return this;
    }
  }, {
    key: 'setRenderBuffer',
    value: function setRenderBuffer(name, opt) {
      if (typeof opt !== 'object') {
        gl.bindRenderbuffer(gl.RENDERBUFFER, opt ? this.renderBufferMemo[name] : null);
        return this;
      }

      opt = _jqueryMini2['default'].extend(this.renderBufferMemo[name] || {
        storageType: gl.DEPTH_COMPONENT16,
        width: 0,
        height: 0
      }, opt || {});

      var hasBuffer = (name in this.renderBuffers);
      var renderBuffer = hasBuffer ? this.renderBuffers[name] : gl.createRenderbuffer(gl.RENDERBUFFER);

      if (!hasBuffer) {
        this.renderBuffers[name] = renderBuffer;
      }

      gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);

      gl.renderbufferStorage(gl.RENDERBUFFER, opt.storageType, opt.width, opt.height);

      this.renderBufferMemo[name] = opt;

      return this;
    }
  }, {
    key: 'setRenderBuffers',
    value: function setRenderBuffers(obj) {
      for (var name in obj) {
        this.setRenderBuffer(name, obj[name]);
      }
      return this;
    }
  }, {
    key: 'setTexture',
    value: function setTexture(name, opt) {
      // bind texture
      if (!opt || typeof opt !== 'object') {
        gl.activeTexture(opt || gl.TEXTURE0);
        gl.bindTexture(this.textureMemo[name].textureType || gl.TEXTURE_2D, this.textures[name]);
        return this;
      }

      if (opt.data && opt.data.type === gl.FLOAT) {
        // Enable floating-point texture.
        if (!gl.getExtension('OES_texture_float')) {
          throw new Error('OES_texture_float is not supported');
        }
      }

      // get defaults
      opt = _jqueryMini2['default'].merge(this.textureMemo[name] || {
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

      var textureType = 'textureType' in opt ? opt.textureType = gl.get(opt.textureType) : gl.TEXTURE_2D;
      var textureTarget = 'textureTarget' in opt ? opt.textureTarget = gl.get(opt.textureTarget) : textureType;
      var isCube = textureType == gl.TEXTURE_CUBE_MAP;
      var hasTexture = (name in this.textures);
      var texture = hasTexture ? this.textures[name] : gl.createTexture();
      var pixelStore = opt.pixelStore;
      var parameters = opt.parameters;
      var data = opt.data;
      var value = data.value;
      var type = data.type;
      var format = data.format;
      var hasValue = Boolean(data.value);

      // save texture
      if (!hasTexture) {
        this.textures[name] = texture;
      }
      gl.bindTexture(textureType, texture);
      if (!hasTexture) {
        // set texture properties
        pixelStore.forEach(function (opt) {
          opt.name = typeof opt.name == 'string' ? gl.get(opt.name) : opt.name;
          gl.pixelStorei(opt.name, opt.value);
        });
      }

      // load texture
      if (hasValue) {
        // beware that we can be loading multiple textures (i.e. it could be a cubemap)
        if (isCube) {
          for (var i = 0; i < 6; ++i) {
            if ((data.width || data.height) && !value.width && !value.height) {
              gl.texImage2D(textureTarget[i], 0, format, data.width, data.height, data.border, format, type, value[i]);
            } else {
              gl.texImage2D(textureTarget[i], 0, format, format, type, value[i]);
            }
          }
        } else {
          if ((data.width || data.height) && !value.width && !value.height) {
            gl.texImage2D(textureTarget, 0, format, data.width, data.height, data.border, format, type, value);
          } else {
            gl.texImage2D(textureTarget, 0, format, format, type, value);
          }
        }

        // we're setting a texture to a framebuffer
      } else if (data.width || data.height) {
          gl.texImage2D(textureTarget, 0, format, data.width, data.height, data.border, format, type, null);
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
  }, {
    key: 'setTextures',
    value: function setTextures(obj) {
      for (var name in obj) {
        this.setTexture(name, obj[name]);
      }
      return this;
    }
  }, {
    key: 'use',
    value: function use(program) {
      gl.useProgram(program.program);
      // remember last used program.
      this.usedProgram = program;
      return this;
    }
  }]);

  return Application;
})();

Object.assign(Application.prototype, {
  $$family: 'application'
});

},{"./jquery-mini":7}],2:[function(require,module,exports){
// camera.js
// Provides a Camera with ModelView and Projection matrices

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _math = require('./math');

var Camera = (function () {
  function Camera(fov, aspect, near, far, _ref) {
    var _ref$type = _ref.type;
    var type = _ref$type === undefined ? 'perspective' : _ref$type;
    var pos = _ref.position;
    var target = _ref.target;
    var up = _ref.up;

    _classCallCheck(this, Camera);

    this.type = type;
    this.fov = fov;
    this.near = near;
    this.far = far;
    this.aspect = aspect;
    this.position = pos ? new _math.Vec3(pos.x, pos.y, pos.z) : new _math.Vec3();
    this.target = target ? new _math.Vec3(target.x, target.y, target.z) : new _math.Vec3();
    this.up = up && new _math.Vec3(up.x, up.y, up.z) || new _math.Vec3(0, 1, 0);
    if (this.type === 'perspective') {
      this.projection = new _math.Mat4().perspective(fov, aspect, near, far);
    } else {
      var ymax = near * Math.tan(fov * Math.PI / 360);
      var ymin = -ymax;
      var xmin = ymin * aspect;
      var xmax = ymax * aspect;
      this.projection = new _math.Mat4().ortho(xmin, xmax, ymin, ymax, near, far);
    }
    this.view = new _math.Mat4();
  }

  _createClass(Camera, [{
    key: 'update',
    value: function update() {
      if (this.type === 'perspective') {
        this.projection = new _math.Mat4().perspective(this.fov, this.aspect, this.near, this.far);
      } else {
        var ymax = this.near * Math.tan(this.fov * Math.PI / 360);
        var ymin = -ymax;
        var xmin = ymin * this.aspect;
        var xmax = ymax * this.aspect;
        this.projection = new _math.Mat4().ortho(xmin, xmax, ymin, ymax, this.near, this.far);
      }
      this.view.lookAt(this.position, this.target, this.up);
    }

    // Set Camera view and projection matrix
  }, {
    key: 'setStatus',
    value: function setStatus(program) {
      var pos = this.position;
      var viewProjection = this.view.mulMat4(this.projection);
      var viewProjectionInverse = viewProjection.invert();
      program.setUniforms({
        cameraPosition: [pos.x, pos.y, pos.z],
        projectionMatrix: this.projection,
        viewMatrix: this.view,
        viewProjectionMatrix: viewProjection,
        viewInverseMatrix: this.view.invert(),
        viewProjectionInverseMatrix: viewProjectionInverse
      });
    }
  }]);

  return Camera;
})();

exports['default'] = Camera;
module.exports = exports['default'];

},{"./math":9}],3:[function(require,module,exports){
(function (global){
// core.js
// Provides general utility methods, module unpacking methods
// and the PhiloGL app creation method.
/* eslint-disable no-new */
/* eslint-disable no-try-catch */
/* eslint-disable callback-return */
/* eslint-disable no-console */
/* global window */
/* global console */
/* global global */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.PhiloGL = PhiloGL;
exports.unpack = unpack;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _jqueryMini = require('./jquery-mini');

var _jqueryMini2 = _interopRequireDefault(_jqueryMini);

var _webgl = require('./webgl');

var _camera = require('./camera');

var _camera2 = _interopRequireDefault(_camera);

var _scene = require('./scene');

var _scene2 = _interopRequireDefault(_scene);

var _application = require('./application');

var _application2 = _interopRequireDefault(_application);

var _io = require('./io');

var _program = require('./program');

var _program2 = _interopRequireDefault(_program);

var _event = require('./event');

var _event2 = _interopRequireDefault(_event);

var DEFAULT_OPTS = {
  context: {
    /*
     debug: true
    */
  },
  camera: {
    fov: 45,
    near: 0.1,
    far: 500
  },
  program: {
    // (defaults|ids|sources|uris)
    from: 'defaults',
    vs: 'Default',
    fs: 'Default'
  },
  scene: {
    /*
     All the scene.js options:
     lights: { ... }
    */
  },
  textures: {
    src: []
  },
  events: {
    /*
     All the events.js options:
     onClick: fn,
     onTouchStart: fn...
    */
  },
  onLoad: function onLoad() {},
  onError: function onError(error) {
    return console.error(error);
  }
};

// get Program
var popt = {
  'defaults': 'fromDefaultShaders',
  'ids': 'fromShaderIds',
  'sources': 'fromShaderSources',
  'uris': 'fromShaderURIs'
};

var globalContext = typeof window !== 'undefined' ? window : global;

// Creates a single application object asynchronously
// with a gl context, a camera, a program, a scene, and an event system.

function PhiloGL(canvasId) {
  var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  opt = _extends({}, DEFAULT_OPTS, opt);

  var optContext = opt.context;
  var optProgram = _jqueryMini2['default'].splat(opt.program);

  // get Context global to all framework
  var gl = (0, _webgl.getContext)(canvasId, optContext);
  globalContext.gl = gl;

  if (!gl) {
    opt.onError('The WebGL context couldn\'t be initialized');
    return null;
  }

  var programLength = optProgram.length;

  var count = programLength;
  var programs = {};
  var error = false;
  var programCallback = {
    onSuccess: function onSuccess(p, popt) {
      programs[popt.id || programLength - count] = p;
      count--;
      if (count === 0 && !error) {
        var program = programLength === 1 ? p : programs;
        loadProgramDeps(gl, program, function (app) {
          opt.onLoad(app);
        });
      }
    },
    onError: function onError(p) {
      count--;
      opt.onError(p);
      error = true;
    }
  };

  optProgram.forEach(function (programOpts, i) {
    var pfrom = programOpts.from;
    var program = undefined;
    for (var p in popt) {
      if (pfrom === p) {
        try {
          program = _program2['default'][popt[p]](_extends({}, programCallback, {
            programOpts: programOpts
          }));
        } catch (e) {
          programCallback.onError(e);
        }
        break;
      }
    }
    if (program) {
      programCallback.onSuccess(program, optProgram);
    }
  });

  return app;
}

function loadProgramDeps(gl, program, opt) {
  var optCamera, optEvents, optScene, optTextures, canvas, camera, scene, app, textureMap;
  return regeneratorRuntime.async(function loadProgramDeps$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        optCamera = opt.camera;
        optEvents = opt.events;
        optScene = opt.scene;
        optTextures = opt.textures;
        canvas = gl.canvas;
        camera = new _camera2['default'](optCamera.fov, optCamera.aspect || canvas.width / canvas.height, optCamera.near, optCamera.far, optCamera);

        camera.update();

        // get Scene
        scene = new _scene2['default'](program, camera, optScene);
        app = new _application2['default']({
          gl: gl,
          canvas: canvas,
          program: program,
          scene: scene,
          camera: camera
        });

        // Use program
        if (program.$$family === 'program') {
          program.use();
        }

        // get Events
        if (optEvents) {
          _event2['default'].create(app, _extends({}, optEvents, {
            bind: app
          }));
        }

        // load Textures

        if (!optTextures.src.length) {
          context$1$0.next = 16;
          break;
        }

        context$1$0.next = 14;
        return regeneratorRuntime.awrap((0, _io.loadTextures)(optTextures));

      case 14:
        textureMap = context$1$0.sent;

        app.setTextures(textureMap);

      case 16:

        globalContext.app = app;
        return context$1$0.abrupt('return', app);

      case 18:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

// Unpacks the submodules to the global space.

function unpack(branch) {
  branch = branch || globalContext;
  ['Vec3', 'Mat4', 'Quat', 'Camera', 'Program', 'WebGL', 'O3D', 'Scene', 'Shaders', 'IO', 'Events', 'WorkerGroup', 'Fx', 'Media'].forEach(function (module) {
    branch[module] = PhiloGL[module];
  });
  branch.gl = globalContext.gl;
  branch.Utils = _jqueryMini2['default'];
}

// TODO - read from package.json?
var version = '1.5.2';
exports.version = version;

// get Camera

// make app instance global to all framework

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./application":1,"./camera":2,"./event":4,"./io":6,"./jquery-mini":7,"./program":20,"./scene":21,"./webgl":23}],4:[function(require,module,exports){
// event.js
// Handle keyboard/mouse/touch events in the Canvas
// TODO - this will not work under node
/* global window */
/* global document */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.get = get;
exports.getWheel = getWheel;
exports.getKey = getKey;
exports.isRightClick = isRightClick;
exports.getPos = getPos;
exports.stop = stop;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _jqueryMini = require('./jquery-mini');

var _jqueryMini2 = _interopRequireDefault(_jqueryMini);

// returns an O3D object or false otherwise.
function toO3D(n) {
  return n !== true ? n : false;
}

// Returns an element position
function getPos(elem) {
  var bbox = elem.getBoundingClientRect();
  return {
    x: bbox.left,
    y: bbox.top,
    bbox: bbox
  };
}

// event object wrapper

function get(e, win) {
  win = win || window;
  return e || win.event;
}

function getWheel(e) {
  return e.wheelDelta ? e.wheelDelta / 120 : -(e.detail || 0) / 3;
}

function getKey(e) {
  var code = e.which || e.keyCode;
  var key = keyOf(code);
  // onkeydown
  var fKey = code - 111;
  if (fKey > 0 && fKey < 13) {
    key = 'f' + fKey;
  }
  key = key || String.fromCharCode(code).toLowerCase();

  return {
    code: code,
    key: key,
    shift: e.shiftKey,
    control: e.ctrlKey,
    alt: e.altKey,
    meta: e.metaKey
  };
}

function isRightClick(e) {
  return e.which === 3 || e.button === 2;
}

function getPos(e, win) {
  // get mouse position
  win = win || window;
  e = e || win.event;
  var doc = win.document;
  doc = doc.documentElement || doc.body;
  // TODO(nico): make touch event handling better
  if (e.touches && e.touches.length) {
    var touchesPos = [];
    for (var i = 0, l = e.touches.length, evt; i < l; ++i) {
      evt = e.touches[i];
      touchesPos.push({
        x: evt.pageX || evt.clientX + doc.scrollLeft,
        y: evt.pageY || evt.clientY + doc.scrollTop
      });
    }
    return touchesPos;
  }
  var page = {
    x: e.pageX || e.clientX + doc.scrollLeft,
    y: e.pageY || e.clientY + doc.scrollTop
  };
  return [page];
}

function stop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  e.cancelBubble = true;
  if (e.preventDefault) {
    e.preventDefault();
  } else {
    e.returnValue = false;
  }
}

var EventsProxy = (function () {
  function EventsProxy(app, opt) {
    _classCallCheck(this, EventsProxy);

    var domElem = app.canvas;
    this.scene = app.scene;
    this.domElem = domElem;
    this.pos = getPos(domElem);
    this.opt = this.callbacks = opt;

    this.size = {
      width: domElem.width || domElem.offsetWidth,
      height: domElem.height || domElem.offsetHeight
    };

    this.attachEvents();
  }

  _createClass(EventsProxy, [{
    key: 'attachEvents',
    value: function attachEvents() {
      var domElem = this.domElem;
      var opt = this.opt;
      var that = this;

      if (opt.disableContextMenu) {
        domElem.oncontextmenu = function () {
          return false;
        };
      }

      if (opt.enableMouse) {
        ['mouseup', 'mousedown', 'mousemove', 'mouseover', 'mouseout'].forEach(function (action) {
          domElem.addEventListener(action, function (e, win) {
            that[action](that.eventInfo(action, e, win));
          }, false);
        });

        // "well, this is embarrassing..."
        var type = '';
        if (!document.getBoxObjectFor && window.mozInnerScreenX == null) {
          type = 'mousewheel';
        } else {
          type = 'DOMMouseScroll';
        }
        domElem.addEventListener(type, function (e, win) {
          that['mousewheel'](that.eventInfo('mousewheel', e, win));
        }, false);
      }

      if (opt.enableTouch) {
        ['touchstart', 'touchmove', 'touchend'].forEach(function (action) {
          domElem.addEventListener(action, function (e, win) {
            that[action](that.eventInfo(action, e, win));
          }, false);
        });
      }

      if (opt.enableKeyboard) {
        ['keydown', 'keyup'].forEach(function (action) {
          document.addEventListener(action, function (e, win) {
            that[action](that.eventInfo(action, e, win));
          }, false);
        });
      }
    }
  }, {
    key: 'eventInfo',
    value: function eventInfo(type, e, win) {
      var domElem = this.domElem;
      var scene = this.scene;
      var opt = this.opt;
      var size = this.getSize();
      var relative = opt.relative;
      var centerOrigin = opt.centerOrigin;
      var pos = opt.cachePosition && this.pos || getPos(domElem);
      var ge = event.get(e, win);
      var epos = event.getPos(e, win);
      var origPos = { x: epos[0].x, y: epos[0].y };
      var evt = {};
      var x = undefined;
      var y = undefined;

      // get Position
      for (var i = 0, l = epos.length; i < l; ++i) {
        x = epos[i].x;
        y = epos[i].y;
        if (relative) {
          x -= pos.x;y -= pos.y;
          if (centerOrigin) {
            x -= size.width / 2;
            y -= size.height / 2;
            // y axis now points to the top of the screen
            y *= -1;
          }
        }
        epos[i].x = x;
        epos[i].y = y;
      }

      switch (type) {
        case 'mousewheel':
          evt.wheel = event.getWheel(ge);
          break;
        case 'keydown':
        case 'keyup':
          _jqueryMini2['default'].extend(evt, event.getKey(ge));
          break;
        case 'mouseup':
          evt.isRightClick = event.isRightClick(ge);
          break;
        default:
          break;
      }

      var cacheTarget;

      _jqueryMini2['default'].extend(evt, {
        x: epos[0].x,
        y: epos[0].y,
        posArray: epos,

        cache: false,
        // stop event propagation
        stop: function stop() {
          event.stop(ge);
        },
        // get the target element of the event
        getTarget: function getTarget() {
          if (cacheTarget) {
            return cacheTarget;
          }
          return cacheTarget = opt.picking && scene.pick(origPos.x - pos.x, origPos.y - pos.y) || true;
        }
      });
      // wrap native event
      evt.event = ge;

      return evt;
    }
  }, {
    key: 'getSize',
    value: function getSize() {
      if (this.cacheSize) {
        return this.size;
      }
      var domElem = this.domElem;
      return {
        width: domElem.width || domElem.offsetWidth,
        height: domElem.height || domElem.offsetHeight
      };
    }
  }, {
    key: 'mouseup',
    value: function mouseup(e) {
      if (!this.moved) {
        if (e.isRightClick) {
          this.callbacks.onRightClick(e, this.hovered);
        } else {
          this.callbacks.onClick(e, toO3D(this.pressed));
        }
      }
      if (this.pressed) {
        if (this.moved) {
          this.callbacks.onDragEnd(e, toO3D(this.pressed));
        } else {
          this.callbacks.onDragCancel(e, toO3D(this.pressed));
        }
        this.pressed = this.moved = false;
      }
    }
  }, {
    key: 'mouseout',
    value: function mouseout(e) {
      // mouseout canvas
      var rt = e.relatedTarget;
      var domElem = this.domElem;
      while (rt && rt.parentNode) {
        if (domElem === rt.parentNode) {
          return;
        }
        rt = rt.parentNode;
      }
      if (this.hovered) {
        this.callbacks.onMouseLeave(e, this.hovered);
        this.hovered = false;
      }
      if (this.pressed && this.moved) {
        this.callbacks.onDragEnd(e);
        this.pressed = this.moved = false;
      }
    }
  }, {
    key: 'mouseover',
    value: function mouseover(e) {}
  }, {
    key: 'mousemove',
    value: function mousemove(e) {
      if (this.pressed) {
        this.moved = true;
        this.callbacks.onDragMove(e, toO3D(this.pressed));
        return;
      }
      if (this.hovered) {
        var target = toO3D(e.getTarget());
        if (!target || target.hash !== this.hash) {
          this.callbacks.onMouseLeave(e, this.hovered);
          this.hovered = target;
          this.hash = target;
          if (target) {
            this.hash = target.hash;
            this.callbacks.onMouseEnter(e, this.hovered);
          }
        } else {
          this.callbacks.onMouseMove(e, this.hovered);
        }
      } else {
        this.hovered = toO3D(e.getTarget());
        this.hash = this.hovered;
        if (this.hovered) {
          this.hash = this.hovered.hash;
          this.callbacks.onMouseEnter(e, this.hovered);
        }
      }
      if (!this.opt.picking) {
        this.callbacks.onMouseMove(e);
      }
    }
  }, {
    key: 'mousewheel',
    value: function mousewheel(e) {
      this.callbacks.onMouseWheel(e);
    }
  }, {
    key: 'mousedown',
    value: function mousedown(e) {
      this.pressed = e.getTarget();
      this.callbacks.onDragStart(e, toO3D(this.pressed));
    }
  }, {
    key: 'touchstart',
    value: function touchstart(e) {
      this.touched = e.getTarget();
      this.touchedLastPosition = { x: e.x, y: e.y };
      this.callbacks.onTouchStart(e, toO3D(this.touched));
    }
  }, {
    key: 'touchmove',
    value: function touchmove(e) {
      if (this.touched) {
        this.touchMoved = true;
        this.callbacks.onTouchMove(e, toO3D(this.touched));
      }
    }
  }, {
    key: 'touchend',
    value: function touchend(e) {
      if (this.touched) {
        if (this.touchMoved) {
          this.callbacks.onTouchEnd(e, toO3D(this.touched));
        } else {
          e.x = isNaN(e.x) ? this.touchedLastPosition.x : e.x;
          e.y = isNaN(e.y) ? this.touchedLastPosition.y : e.y;
          this.callbacks.onTap(e, toO3D(this.touched));
          this.callbacks.onTouchCancel(e, toO3D(this.touched));
        }
        this.touched = this.touchMoved = false;
      }
    }
  }, {
    key: 'keydown',
    value: function keydown(e) {
      this.callbacks.onKeyDown(e);
    }
  }, {
    key: 'keyup',
    value: function keyup(e) {
      this.callbacks.onKeyUp(e);
    }
  }]);

  return EventsProxy;
})();

exports.EventsProxy = EventsProxy;

Object.assign(EventsProxy.prototype, {
  hovered: false,
  pressed: false,
  touched: false,
  touchedLastPosition: { x: 0, y: 0 },
  touchMoved: false,
  moved: false
});

var Events = {

  create: function create(app) {
    var _arguments = arguments;
    var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    opt = _extends({
      cachePosition: true,
      cacheSize: true,
      relative: true,
      centerOrigin: true,
      disableContextMenu: true,
      bind: false,
      picking: false,
      lazyPicking: false,

      enableTouch: true,
      enableMouse: true,
      enableKeyboard: true,

      onClick: _jqueryMini2['default'].empty,
      onRightClick: _jqueryMini2['default'].empty,
      onDragStart: _jqueryMini2['default'].empty,
      onDragMove: _jqueryMini2['default'].empty,
      onDragEnd: _jqueryMini2['default'].empty,
      onDragCancel: _jqueryMini2['default'].empty,
      onTouchStart: _jqueryMini2['default'].empty,
      onTouchMove: _jqueryMini2['default'].empty,
      onTouchEnd: _jqueryMini2['default'].empty,
      onTouchCancel: _jqueryMini2['default'].empty,
      onTap: _jqueryMini2['default'].empty,
      onMouseMove: _jqueryMini2['default'].empty,
      onMouseEnter: _jqueryMini2['default'].empty,
      onMouseLeave: _jqueryMini2['default'].empty,
      onMouseWheel: _jqueryMini2['default'].empty,
      onKeyDown: _jqueryMini2['default'].empty,
      onKeyUp: _jqueryMini2['default'].empty
    }, opt);

    var bind = opt.bind;

    if (bind) {
      for (var name in opt) {
        if (name.match(/^on[a-zA-Z0-9]+$/)) {
          (function (name, fn) {
            opt[name] = function () {
              return fn.apply(bind, Array.prototype.slice.call(_arguments));
            };
          })(name, opt[name]);
        }
      }
    }

    new EventsProxy(app, opt);
    // assign event handler to app.
    app.events = opt;
  }

};

exports.Events = Events;
Events.Keys = {
  'enter': 13,
  'up': 38,
  'down': 40,
  'left': 37,
  'right': 39,
  'esc': 27,
  'space': 32,
  'backspace': 8,
  'tab': 9,
  'delete': 46
};

function keyOf(code) {
  var keyMap = Events.Keys;
  for (var name in keyMap) {
    if (keyMap[name] === code) {
      return name;
    }
  }
}

},{"./jquery-mini":7}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequire(obj) { return obj && obj.__esModule ? obj['default'] : obj; }

function _interopExportWildcard(obj, defaults) { var newObj = defaults({}, obj); delete newObj['default']; return newObj; }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

var _webgl = require('./webgl');

_defaults(exports, _interopExportWildcard(_webgl, _defaults));

var _core = require('./core');

_defaults(exports, _interopExportWildcard(_core, _defaults));

var _math = require('./math');

_defaults(exports, _interopExportWildcard(_math, _defaults));

var _event = require('./event');

exports.Event = _interopRequire(_event);

var _program = require('./program');

exports.Program = _interopRequire(_program);

var _io = require('./io');

_defaults(exports, _interopExportWildcard(_io, _defaults));

var _camera = require('./camera');

exports.Camera = _interopRequire(_camera);

var _objects = require('./objects');

_defaults(exports, _interopExportWildcard(_objects, _defaults));

var _shaders = require('./shaders');

exports.Shaders = _interopRequire(_shaders);

var _scene = require('./scene');

exports.Scene = _interopRequire(_scene);

var _media = require('./media');

_defaults(exports, _interopExportWildcard(_media, _defaults));

// PhiloGL 1.X compatibility
// export O3D from './objects';
// export IO from './io';
// export Media from './media';

},{"./camera":2,"./core":3,"./event":4,"./io":6,"./math":9,"./media":10,"./objects":15,"./program":20,"./scene":21,"./shaders":22,"./webgl":23}],6:[function(require,module,exports){
// io.js
// Provides loading of assets with XHR and JSONP methods.
/* eslint-disable guard-for-in */
/* global XMLHttpRequest */
/* global document */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.JSONP = JSONP;
exports.Images = Images;
exports.Textures = Textures;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _jqueryMini = require('./jquery-mini');

var _jqueryMini2 = _interopRequireDefault(_jqueryMini);

var _media = require('./media');

var _media2 = _interopRequireDefault(_media);

var XHR = (function () {
  function XHR() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, XHR);

    opt = _extends({
      url: 'http:// philogljs.org/',
      method: 'GET',
      async: true,
      noCache: false,
      // body: null,
      sendAsBinary: false,
      responseType: false,
      onProgress: _jqueryMini2['default'].empty,
      onSuccess: _jqueryMini2['default'].empty,
      onError: _jqueryMini2['default'].empty,
      onAbort: _jqueryMini2['default'].empty,
      onComplete: _jqueryMini2['default'].empty
    }, opt);

    this.opt = opt;
    this.initXHR();
  }

  _createClass(XHR, [{
    key: 'initXHR',
    value: function initXHR() {
      var req = this.req = new XMLHttpRequest();
      var self = this;

      ['Progress', 'Error', 'Abort', 'Load'].forEach(function (event) {
        if (req.addEventListener) {
          req.addEventListener(event.toLowerCase(), function (e) {
            self['handle' + event](e);
          }, false);
        } else {
          req['on' + event.toLowerCase()] = function (e) {
            self['handle' + event](e);
          };
        }
      });
    }
  }, {
    key: 'sendAsync',
    value: function sendAsync(body) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var req = _this.req;
        var opt = _this.opt;
        var async = opt.async;

        if (opt.noCache) {
          opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + _jqueryMini2['default'].uid();
        }

        req.open(opt.method, opt.url, async);

        if (opt.responseType) {
          req.responseType = opt.responseType;
        }

        if (async) {
          req.onreadystatechange = function (e) {
            if (req.readyState === XHR.State.COMPLETED) {
              if (req.status === 200) {
                resolve(req.responseType ? req.response : req.responseText);
              } else {
                reject(new Error(req.status));
              }
            }
          };
        }

        if (opt.sendAsBinary) {
          req.sendAsBinary(body || opt.body || null);
        } else {
          req.send(body || opt.body || null);
        }

        if (!async) {
          if (req.status === 200) {
            resolve(req.responseType ? req.response : req.responseText);
          } else {
            reject(new Error(req.status));
          }
        }
      });
    }
  }, {
    key: 'send',
    value: function send(body) {
      var req = this.req;
      var opt = this.opt;

      var async = opt.async;

      if (opt.noCache) {
        opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + _jqueryMini2['default'].uid();
      }

      req.open(opt.method, opt.url, async);

      if (opt.responseType) {
        req.responseType = opt.responseType;
      }

      if (async) {
        req.onreadystatechange = function (e) {
          if (req.readyState === XHR.State.COMPLETED) {
            if (req.status === 200) {
              opt.onSuccess(req.responseType ? req.response : req.responseText);
            } else {
              opt.onError(req.status);
            }
          }
        };
      }

      if (opt.sendAsBinary) {
        req.sendAsBinary(body || opt.body || null);
      } else {
        req.send(body || opt.body || null);
      }

      if (!async) {
        if (req.status === 200) {
          opt.onSuccess(req.responseType ? req.response : req.responseText);
        } else {
          opt.onError(req.status);
        }
      }
    }
  }, {
    key: 'setRequestHeader',
    value: function setRequestHeader(header, value) {
      this.req.setRequestHeader(header, value);
      return this;
    }
  }, {
    key: 'handleProgress',
    value: function handleProgress(e) {
      if (e.lengthComputable) {
        this.opt.onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        this.opt.onProgress(e, -1);
      }
    }
  }, {
    key: 'handleError',
    value: function handleError(e) {
      this.opt.onError(e);
    }
  }, {
    key: 'handleAbort',
    value: function handleAbort(e) {
      this.opt.onAbort(e);
    }
  }, {
    key: 'handleLoad',
    value: function handleLoad(e) {
      this.opt.onComplete(e);
    }
  }]);

  return XHR;
})();

XHR.State = {};
['UNINITIALIZED', 'LOADING', 'LOADED', 'INTERACTIVE', 'COMPLETED'].forEach(function (stateName, i) {
  XHR.State[stateName] = i;
});

// Make parallel requests and group the responses.
XHR.Group = (function () {
  function _class() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, _class);

    opt = _extends({
      urls: [],
      onError: _jqueryMini2['default'].empty,
      onSuccess: _jqueryMini2['default'].empty,
      onComplete: _jqueryMini2['default'].empty,
      method: 'GET',
      async: true,
      noCache: false,
      // body: null,
      sendAsBinary: false,
      responseType: false
    }, opt);

    var urls = _jqueryMini2['default'].splat(opt.urls);
    var len = urls.length;
    var ans = new Array(len);
    var reqs = urls.map(function (url, i) {
      return new XHR({
        url: url,
        method: opt.method,
        async: opt.async,
        noCache: opt.noCache,
        sendAsBinary: opt.sendAsBinary,
        responseType: opt.responseType,
        body: opt.body,
        onError: handleError(i),
        onSuccess: handleSuccess(i)
      });
    });

    function handleError(i) {
      return function (e) {
        --len;
        opt.onError(e, i);
        if (!len) {
          opt.onComplete(ans);
        }
      };
    }

    function handleSuccess(i) {
      return function (response) {
        --len;
        ans[i] = response;
        opt.onSuccess(response, i);
        if (!len) {
          opt.onComplete(ans);
        }
      };
    }

    this.reqs = reqs;
  }

  _createClass(_class, [{
    key: 'send',
    value: function send() {
      for (var i = 0, reqs = this.reqs, l = reqs.length; i < l; ++i) {
        reqs[i].send();
      }
    }
  }, {
    key: 'sendAsync',
    value: function sendAsync() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        opt.onComplete = resolve;
        opt.onError = reject;
        _this2.send();
      });
    }
  }]);

  return _class;
})();

function JSONP(opt) {
  opt = _jqueryMini2['default'].merge({
    url: 'http:// philogljs.org/',
    data: {},
    noCache: false,
    onComplete: _jqueryMini2['default'].empty,
    callbackKey: 'callback'
  }, opt || {});

  var index = JSONP.counter++;
  // create query string
  var data = [];
  for (var prop in opt.data) {
    data.push(prop + '=' + opt.data[prop]);
  }
  data = data.join('&');
  // append unique id for cache
  if (opt.noCache) {
    data += (data.indexOf('?') >= 0 ? '&' : '?') + _jqueryMini2['default'].uid();
  }
  // create source url
  var src = opt.url + (opt.url.indexOf('?') > -1 ? '&' : '?') + opt.callbackKey + '=PhiloGL IO.JSONP.requests.request_' + index + (data.length > 0 ? '&' + data : '');

  // create script
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = src;

  // create callback
  JSONP.requests['request_' + index] = function (json) {
    opt.onComplete(json);
    // remove script
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    if (script.clearAttributes) {
      script.clearAttributes();
    }
  };

  // inject script
  document.getElementsByTagName('head')[0].appendChild(script);
}

JSONP.counter = 0;
JSONP.requests = {};

// Load multiple Image assets async

function Images(opt) {
  opt = _jqueryMini2['default'].merge({
    src: [],
    noCache: false,
    onProgress: _jqueryMini2['default'].empty,
    onComplete: _jqueryMini2['default'].empty
  }, opt || {});

  var count = 0;
  var l = opt.src.length;

  var images = undefined;
  // Image onload handler
  var load = function load() {
    opt.onProgress(Math.round(++count / l * 100));
    if (count === l) {
      opt.onComplete(images);
    }
  };
  // Image error handler
  var error = function error() {
    if (++count === l) {
      opt.onComplete(images);
    }
  };

  // uid for image sources
  var noCache = opt.noCache;
  var uid = _jqueryMini2['default'].uid();
  function getSuffix(s) {
    return (s.indexOf('?') >= 0 ? '&' : '?') + uid;
  }

  // Create image array
  images = opt.src.map(function (src, i) {
    var img = new _media2['default']();
    img.index = i;
    img.onload = load;
    img.onerror = error;
    img.src = src + (noCache ? getSuffix(src) : '');
    return img;
  });

  return images;
}

// Load multiple textures from images

function Textures() {
  var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  opt = _extends({
    src: [],
    noCache: false,
    onComplete: _jqueryMini2['default'].empty
  }, opt);

  Images({
    src: opt.src,
    noCache: opt.noCache,
    onComplete: function onComplete(images) {
      var textures = {};
      images.forEach(function (img, i) {
        textures[opt.id && opt.id[i] || opt.src && opt.src[i]] = _jqueryMini2['default'].merge({
          data: {
            value: img
          }
        }, opt);
      });
      app.setTextures(textures);
      opt.onComplete();
    }
  });
}

},{"./jquery-mini":7,"./media":10}],7:[function(require,module,exports){
// Utility functions

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = $;

function $(d) {
  return document.getElementById(d);
}

$.empty = function () {};

$.time = Date.now;

$.uid = (function () {
  var t = $.time();

  return function () {
    return t++;
  };
})();

$.extend = function (to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

$.type = (function () {
  var oString = Object.prototype.toString,
      type = function type(e) {
    var t = oString.call(e);
    return t.substr(8, t.length - 9).toLowerCase();
  };

  return function (elem) {
    var elemType = type(elem);
    if (elemType != 'object') {
      return elemType;
    }
    if (elem.$$family) return elem.$$family;
    return elem && elem.nodeName && elem.nodeType == 1 ? 'element' : elemType;
  };
})();

(function () {
  function detach(elem) {
    var type = $.type(elem),
        ans;
    if (type == 'object') {
      ans = {};
      for (var p in elem) {
        ans[p] = detach(elem[p]);
      }
      return ans;
    } else if (type == 'array') {
      ans = [];
      for (var i = 0, l = elem.length; i < l; i++) {
        ans[i] = detach(elem[i]);
      }
      return ans;
    } else {
      return elem;
    }
  }

  $.merge = function () {
    var mix = {};
    for (var i = 0, l = arguments.length; i < l; i++) {
      var object = arguments[i];
      if ($.type(object) != 'object') continue;
      for (var key in object) {
        var op = object[key],
            mp = mix[key];
        if (mp && $.type(op) == 'object' && $.type(mp) == 'object') {
          mix[key] = $.merge(mp, op);
        } else {
          mix[key] = detach(op);
        }
      }
    }
    return mix;
  };
})();

$.splat = (function () {
  var isArray = Array.isArray;
  return function (a) {
    return isArray(a) && a || [a];
  };
})();
module.exports = exports['default'];

},{}],8:[function(require,module,exports){
// math.js
// Vec3, Mat4 and Quat classes
/* eslint-disable computed-property-spacing */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x4, _x5, _x6) { var _again = true; _function: while (_again) { var object = _x4, property = _x5, receiver = _x6; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x4 = parent; _x5 = property; _x6 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var sqrt = Math.sqrt;
var sin = Math.sin;
var cos = Math.cos;
var tan = Math.tan;
var pi = Math.PI;
var slice = Array.prototype.slice;

// create property descriptor
function descriptor(index) {
  return {
    get: function get() {
      return this[index];
    },
    set: function set(val) {
      this[index] = val;
    },
    configurable: false,
    enumerable: false
  };
}

// Vec3 Class

var Vec3 = (function (_Array) {
  _inherits(Vec3, _Array);

  function Vec3() {
    var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
    var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
    var z = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

    _classCallCheck(this, Vec3);

    _get(Object.getPrototypeOf(Vec3.prototype), 'constructor', this).call(this, 3);
    this[0] = x;
    this[1] = y;
    this[2] = z;
  }

  // fast Vec3 create.

  _createClass(Vec3, [{
    key: '$$family',
    get: function get() {
      return { value: 'Vec3' };
    }
  }, {
    key: 'x',
    get: function get() {
      return this[0];
    },
    set: function set(value) {
      return this[0] = value;
    }
  }, {
    key: 'y',
    get: function get() {
      return this[1];
    },
    set: function set(value) {
      return this[1] = value;
    }
  }, {
    key: 'z',
    get: function get() {
      return this[2];
    },
    set: function set(value) {
      return this[3] = value;
    }
  }], [{
    key: 'create',
    value: function create() {
      return new Vec3(3);
    }
  }]);

  return Vec3;
})(Array);

exports.Vec3 = Vec3;

var generics = {

  setVec3: function setVec3(dest, vec) {
    dest[0] = vec[0];
    dest[1] = vec[1];
    dest[2] = vec[2];
    return dest;
  },

  set: function set(dest, x, y, z) {
    dest[0] = x;
    dest[1] = y;
    dest[2] = z;
    return dest;
  },

  add: function add(dest, vec) {
    return new Vec3(dest[0] + vec[0], dest[1] + vec[1], dest[2] + vec[2]);
  },

  $add: function $add(dest, vec) {
    dest[0] += vec[0];
    dest[1] += vec[1];
    dest[2] += vec[2];
    return dest;
  },

  add2: function add2(dest, a, b) {
    dest[0] = a[0] + b[0];
    dest[1] = a[1] + b[1];
    dest[2] = a[2] + b[2];
    return dest;
  },

  sub: function sub(dest, vec) {
    return new Vec3(dest[0] - vec[0], dest[1] - vec[1], dest[2] - vec[2]);
  },

  $sub: function $sub(dest, vec) {
    dest[0] -= vec[0];
    dest[1] -= vec[1];
    dest[2] -= vec[2];
    return dest;
  },

  sub2: function sub2(dest, a, b) {
    dest[0] = a[0] - b[0];
    dest[1] = a[1] - b[1];
    dest[2] = a[2] - b[2];
    return dest;
  },

  scale: function scale(dest, s) {
    return new Vec3(dest[0] * s, dest[1] * s, dest[2] * s);
  },

  $scale: function $scale(dest, s) {
    dest[0] *= s;
    dest[1] *= s;
    dest[2] *= s;
    return dest;
  },

  neg: function neg(dest) {
    return new Vec3(-dest[0], -dest[1], -dest[2]);
  },

  $neg: function $neg(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    return dest;
  },

  unit: function unit(dest) {
    var len = Vec3.norm(dest);

    if (len > 0) {
      return Vec3.scale(dest, 1 / len);
    }
    return Vec3.clone(dest);
  },

  $unit: function $unit(dest) {
    var len = Vec3.norm(dest);

    if (len > 0) {
      return Vec3.$scale(dest, 1 / len);
    }
    return dest;
  },

  cross: function cross(dest, vec) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2],
        vx = vec[0],
        vy = vec[1],
        vz = vec[2];

    return new Vec3(dy * vz - dz * vy, dz * vx - dx * vz, dx * vy - dy * vx);
  },

  $cross: function $cross(dest, vec) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2],
        vx = vec[0],
        vy = vec[1],
        vz = vec[2];

    dest[0] = dy * vz - dz * vy;
    dest[1] = dz * vx - dx * vz;
    dest[2] = dx * vy - dy * vx;
    return dest;
  },

  distTo: function distTo(dest, vec) {
    var dx = dest[0] - vec[0],
        dy = dest[1] - vec[1],
        dz = dest[2] - vec[2];

    return sqrt(dx * dx + dy * dy + dz * dz);
  },

  distToSq: function distToSq(dest, vec) {
    var dx = dest[0] - vec[0],
        dy = dest[1] - vec[1],
        dz = dest[2] - vec[2];

    return dx * dx + dy * dy + dz * dz;
  },

  norm: function norm(dest) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2];

    return sqrt(dx * dx + dy * dy + dz * dz);
  },

  normSq: function normSq(dest) {
    var dx = dest[0],
        dy = dest[1],
        dz = dest[2];

    return dx * dx + dy * dy + dz * dz;
  },

  dot: function dot(dest, vec) {
    return dest[0] * vec[0] + dest[1] * vec[1] + dest[2] * vec[2];
  },

  clone: function clone(dest) {
    if (dest.$$family) {
      return new Vec3(dest[0], dest[1], dest[2]);
    } else {
      return Vec3.setVec3(new typedArray(3), dest);
    }
  },

  toFloat32Array: function toFloat32Array(dest) {
    var ans = dest.typedContainer;

    if (!ans) return dest;

    ans[0] = dest[0];
    ans[1] = dest[1];
    ans[2] = dest[2];

    return ans;
  }
};

// add generics and instance methods
var proto = Vec3.prototype;
for (var method in generics) {
  Vec3[method] = generics[method];
  proto[method] = (function (m) {
    return function () {
      var args = slice.call(arguments);

      args.unshift(this);
      return Vec3[m].apply(Vec3, args);
    };
  })(method);
}

// Mat4 Class

var Mat4 = (function (_Array2) {
  _inherits(Mat4, _Array2);

  function Mat4(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
    _classCallCheck(this, Mat4);

    _get(Object.getPrototypeOf(Mat4.prototype), 'constructor', this).call(this, 16);

    this.length = 16;

    if (typeof n11 === 'number') {

      this.set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44);
    } else {
      this.id();
    }

    this.typedContainer = new Array(16);
  }

  // create fancy components setters and getters.

  _createClass(Mat4, null, [{
    key: 'create',
    value: function create() {
      return new Array(16);
    }
  }]);

  return Mat4;
})(Array);

exports.Mat4 = Mat4;
Object.assign(Mat4.prototype, {

  $$family: {
    value: 'Mat4'
  },

  n11: descriptor(0),
  n12: descriptor(4),
  n13: descriptor(8),
  n14: descriptor(12),

  n21: descriptor(1),
  n22: descriptor(5),
  n23: descriptor(9),
  n24: descriptor(13),

  n31: descriptor(2),
  n32: descriptor(6),
  n33: descriptor(10),
  n34: descriptor(14),

  n41: descriptor(3),
  n42: descriptor(7),
  n43: descriptor(11),
  n44: descriptor(15)

});

generics = {

  id: function id(dest) {

    dest[0] = 1;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = 1;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = 0;
    dest[9] = 0;
    dest[10] = 1;
    dest[11] = 0;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = 0;
    dest[15] = 1;

    return dest;
  },

  clone: function clone(dest) {
    if (dest.$$family) {
      return new Mat4(dest[0], dest[4], dest[8], dest[12], dest[1], dest[5], dest[9], dest[13], dest[2], dest[6], dest[10], dest[14], dest[3], dest[7], dest[11], dest[15]);
    } else {
      return new typedArray(dest);
    }
  },

  set: function set(dest, n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {

    dest[0] = n11;
    dest[4] = n12;
    dest[8] = n13;
    dest[12] = n14;
    dest[1] = n21;
    dest[5] = n22;
    dest[9] = n23;
    dest[13] = n24;
    dest[2] = n31;
    dest[6] = n32;
    dest[10] = n33;
    dest[14] = n34;
    dest[3] = n41;
    dest[7] = n42;
    dest[11] = n43;
    dest[15] = n44;

    return dest;
  },

  mulVec3: function mulVec3(dest, vec) {
    var ans = Vec3.clone(vec);
    return Mat4.$mulVec3(dest, ans);
  },

  $mulVec3: function $mulVec3(dest, vec) {
    var vx = vec[0],
        vy = vec[1],
        vz = vec[2],
        d = 1 / (dest[3] * vx + dest[7] * vy + dest[11] * vz + dest[15]);

    vec[0] = (dest[0] * vx + dest[4] * vy + dest[8] * vz + dest[12]) * d;
    vec[1] = (dest[1] * vx + dest[5] * vy + dest[9] * vz + dest[13]) * d;
    vec[2] = (dest[2] * vx + dest[6] * vy + dest[10] * vz + dest[14]) * d;

    return vec;
  },

  mulMat42: function mulMat42(dest, a, b) {
    var a11 = a[0],
        a12 = a[1],
        a13 = a[2],
        a14 = a[3],
        a21 = a[4],
        a22 = a[5],
        a23 = a[6],
        a24 = a[7],
        a31 = a[8],
        a32 = a[9],
        a33 = a[10],
        a34 = a[11],
        a41 = a[12],
        a42 = a[13],
        a43 = a[14],
        a44 = a[15],
        b11 = b[0],
        b12 = b[1],
        b13 = b[2],
        b14 = b[3],
        b21 = b[4],
        b22 = b[5],
        b23 = b[6],
        b24 = b[7],
        b31 = b[8],
        b32 = b[9],
        b33 = b[10],
        b34 = b[11],
        b41 = b[12],
        b42 = b[13],
        b43 = b[14],
        b44 = b[15];

    dest[0] = b11 * a11 + b12 * a21 + b13 * a31 + b14 * a41;
    dest[1] = b11 * a12 + b12 * a22 + b13 * a32 + b14 * a42;
    dest[2] = b11 * a13 + b12 * a23 + b13 * a33 + b14 * a43;
    dest[3] = b11 * a14 + b12 * a24 + b13 * a34 + b14 * a44;

    dest[4] = b21 * a11 + b22 * a21 + b23 * a31 + b24 * a41;
    dest[5] = b21 * a12 + b22 * a22 + b23 * a32 + b24 * a42;
    dest[6] = b21 * a13 + b22 * a23 + b23 * a33 + b24 * a43;
    dest[7] = b21 * a14 + b22 * a24 + b23 * a34 + b24 * a44;

    dest[8] = b31 * a11 + b32 * a21 + b33 * a31 + b34 * a41;
    dest[9] = b31 * a12 + b32 * a22 + b33 * a32 + b34 * a42;
    dest[10] = b31 * a13 + b32 * a23 + b33 * a33 + b34 * a43;
    dest[11] = b31 * a14 + b32 * a24 + b33 * a34 + b34 * a44;

    dest[12] = b41 * a11 + b42 * a21 + b43 * a31 + b44 * a41;
    dest[13] = b41 * a12 + b42 * a22 + b43 * a32 + b44 * a42;
    dest[14] = b41 * a13 + b42 * a23 + b43 * a33 + b44 * a43;
    dest[15] = b41 * a14 + b42 * a24 + b43 * a34 + b44 * a44;
    return dest;
  },

  mulMat4: function mulMat4(a, b) {
    var m = Mat4.clone(a);
    return Mat4.mulMat42(m, a, b);
  },

  $mulMat4: function $mulMat4(a, b) {
    return Mat4.mulMat42(a, a, b);
  },

  add: function add(dest, m) {
    var copy = Mat4.clone(dest);
    return Mat4.$add(copy, m);
  },

  $add: function $add(dest, m) {
    dest[0] += m[0];
    dest[1] += m[1];
    dest[2] += m[2];
    dest[3] += m[3];
    dest[4] += m[4];
    dest[5] += m[5];
    dest[6] += m[6];
    dest[7] += m[7];
    dest[8] += m[8];
    dest[9] += m[9];
    dest[10] += m[10];
    dest[11] += m[11];
    dest[12] += m[12];
    dest[13] += m[13];
    dest[14] += m[14];
    dest[15] += m[15];

    return dest;
  },

  transpose: function transpose(dest) {
    var m = Mat4.clone(dest);
    return Mat4.$transpose(m);
  },

  $transpose: function $transpose(dest) {
    var n4 = dest[4],
        n8 = dest[8],
        n12 = dest[12],
        n1 = dest[1],
        n9 = dest[9],
        n13 = dest[13],
        n2 = dest[2],
        n6 = dest[6],
        n14 = dest[14],
        n3 = dest[3],
        n7 = dest[7],
        n11 = dest[11];

    dest[1] = n4;
    dest[2] = n8;
    dest[3] = n12;
    dest[4] = n1;
    dest[6] = n9;
    dest[7] = n13;
    dest[8] = n2;
    dest[9] = n6;
    dest[11] = n14;
    dest[12] = n3;
    dest[13] = n7;
    dest[14] = n11;

    return dest;
  },

  rotateAxis: function rotateAxis(dest, theta, vec) {
    var m = Mat4.clone(dest);
    return Mat4.$rotateAxis(m, theta, vec);
  },

  $rotateAxis: function $rotateAxis(dest, theta, vec) {
    var s = sin(theta),
        c = cos(theta),
        nc = 1 - c,
        vx = vec[0],
        vy = vec[1],
        vz = vec[2],
        m11 = vx * vx * nc + c,
        m12 = vx * vy * nc + vz * s,
        m13 = vx * vz * nc - vy * s,
        m21 = vy * vx * nc - vz * s,
        m22 = vy * vy * nc + c,
        m23 = vy * vz * nc + vx * s,
        m31 = vx * vz * nc + vy * s,
        m32 = vy * vz * nc - vx * s,
        m33 = vz * vz * nc + c,
        d11 = dest[0],
        d12 = dest[1],
        d13 = dest[2],
        d14 = dest[3],
        d21 = dest[4],
        d22 = dest[5],
        d23 = dest[6],
        d24 = dest[7],
        d31 = dest[8],
        d32 = dest[9],
        d33 = dest[10],
        d34 = dest[11],
        d41 = dest[12],
        d42 = dest[13],
        d43 = dest[14],
        d44 = dest[15];

    dest[0] = d11 * m11 + d21 * m12 + d31 * m13;
    dest[1] = d12 * m11 + d22 * m12 + d32 * m13;
    dest[2] = d13 * m11 + d23 * m12 + d33 * m13;
    dest[3] = d14 * m11 + d24 * m12 + d34 * m13;

    dest[4] = d11 * m21 + d21 * m22 + d31 * m23;
    dest[5] = d12 * m21 + d22 * m22 + d32 * m23;
    dest[6] = d13 * m21 + d23 * m22 + d33 * m23;
    dest[7] = d14 * m21 + d24 * m22 + d34 * m23;

    dest[8] = d11 * m31 + d21 * m32 + d31 * m33;
    dest[9] = d12 * m31 + d22 * m32 + d32 * m33;
    dest[10] = d13 * m31 + d23 * m32 + d33 * m33;
    dest[11] = d14 * m31 + d24 * m32 + d34 * m33;

    return dest;
  },

  rotateXYZ: function rotateXYZ(dest, rx, ry, rz) {
    var ans = Mat4.clone(dest);
    return Mat4.$rotateXYZ(ans, rx, ry, rz);
  },

  $rotateXYZ: function $rotateXYZ(dest, rx, ry, rz) {
    var d11 = dest[0],
        d12 = dest[1],
        d13 = dest[2],
        d14 = dest[3],
        d21 = dest[4],
        d22 = dest[5],
        d23 = dest[6],
        d24 = dest[7],
        d31 = dest[8],
        d32 = dest[9],
        d33 = dest[10],
        d34 = dest[11],
        crx = cos(rx),
        cry = cos(ry),
        crz = cos(rz),
        srx = sin(rx),
        sry = sin(ry),
        srz = sin(rz),
        m11 = cry * crz,
        m21 = -crx * srz + srx * sry * crz,
        m31 = srx * srz + crx * sry * crz,
        m12 = cry * srz,
        m22 = crx * crz + srx * sry * srz,
        m32 = -srx * crz + crx * sry * srz,
        m13 = -sry,
        m23 = srx * cry,
        m33 = crx * cry;

    dest[0] = d11 * m11 + d21 * m12 + d31 * m13;
    dest[1] = d12 * m11 + d22 * m12 + d32 * m13;
    dest[2] = d13 * m11 + d23 * m12 + d33 * m13;
    dest[3] = d14 * m11 + d24 * m12 + d34 * m13;

    dest[4] = d11 * m21 + d21 * m22 + d31 * m23;
    dest[5] = d12 * m21 + d22 * m22 + d32 * m23;
    dest[6] = d13 * m21 + d23 * m22 + d33 * m23;
    dest[7] = d14 * m21 + d24 * m22 + d34 * m23;

    dest[8] = d11 * m31 + d21 * m32 + d31 * m33;
    dest[9] = d12 * m31 + d22 * m32 + d32 * m33;
    dest[10] = d13 * m31 + d23 * m32 + d33 * m33;
    dest[11] = d14 * m31 + d24 * m32 + d34 * m33;

    return dest;
  },

  translate: function translate(dest, x, y, z) {
    var m = Mat4.clone(dest);
    return Mat4.$translate(m, x, y, z);
  },

  $translate: function $translate(dest, x, y, z) {
    dest[12] = dest[0] * x + dest[4] * y + dest[8] * z + dest[12];
    dest[13] = dest[1] * x + dest[5] * y + dest[9] * z + dest[13];
    dest[14] = dest[2] * x + dest[6] * y + dest[10] * z + dest[14];
    dest[15] = dest[3] * x + dest[7] * y + dest[11] * z + dest[15];

    return dest;
  },

  scale: function scale(dest, x, y, z) {
    var m = Mat4.clone(dest);
    return Mat4.$scale(m, x, y, z);
  },

  $scale: function $scale(dest, x, y, z) {
    dest[0] *= x;
    dest[1] *= x;
    dest[2] *= x;
    dest[3] *= x;
    dest[4] *= y;
    dest[5] *= y;
    dest[6] *= y;
    dest[7] *= y;
    dest[8] *= z;
    dest[9] *= z;
    dest[10] *= z;
    dest[11] *= z;

    return dest;
  },

  // Method based on PreGL https:// github.com/deanm/pregl/ (c) Dean McNamee.
  invert: function invert(dest) {
    var m = Mat4.clone(dest);
    return Mat4.$invert(m);
  },

  $invert: function $invert(dest) {
    var x0 = dest[0],
        x1 = dest[1],
        x2 = dest[2],
        x3 = dest[3],
        x4 = dest[4],
        x5 = dest[5],
        x6 = dest[6],
        x7 = dest[7],
        x8 = dest[8],
        x9 = dest[9],
        x10 = dest[10],
        x11 = dest[11],
        x12 = dest[12],
        x13 = dest[13],
        x14 = dest[14],
        x15 = dest[15];

    var a0 = x0 * x5 - x1 * x4,
        a1 = x0 * x6 - x2 * x4,
        a2 = x0 * x7 - x3 * x4,
        a3 = x1 * x6 - x2 * x5,
        a4 = x1 * x7 - x3 * x5,
        a5 = x2 * x7 - x3 * x6,
        b0 = x8 * x13 - x9 * x12,
        b1 = x8 * x14 - x10 * x12,
        b2 = x8 * x15 - x11 * x12,
        b3 = x9 * x14 - x10 * x13,
        b4 = x9 * x15 - x11 * x13,
        b5 = x10 * x15 - x11 * x14;

    var invdet = 1 / (a0 * b5 - a1 * b4 + a2 * b3 + a3 * b2 - a4 * b1 + a5 * b0);

    dest[0] = (+x5 * b5 - x6 * b4 + x7 * b3) * invdet;
    dest[1] = (-x1 * b5 + x2 * b4 - x3 * b3) * invdet;
    dest[2] = (+x13 * a5 - x14 * a4 + x15 * a3) * invdet;
    dest[3] = (-x9 * a5 + x10 * a4 - x11 * a3) * invdet;
    dest[4] = (-x4 * b5 + x6 * b2 - x7 * b1) * invdet;
    dest[5] = (+x0 * b5 - x2 * b2 + x3 * b1) * invdet;
    dest[6] = (-x12 * a5 + x14 * a2 - x15 * a1) * invdet;
    dest[7] = (+x8 * a5 - x10 * a2 + x11 * a1) * invdet;
    dest[8] = (+x4 * b4 - x5 * b2 + x7 * b0) * invdet;
    dest[9] = (-x0 * b4 + x1 * b2 - x3 * b0) * invdet;
    dest[10] = (+x12 * a4 - x13 * a2 + x15 * a0) * invdet;
    dest[11] = (-x8 * a4 + x9 * a2 - x11 * a0) * invdet;
    dest[12] = (-x4 * b3 + x5 * b1 - x6 * b0) * invdet;
    dest[13] = (+x0 * b3 - x1 * b1 + x2 * b0) * invdet;
    dest[14] = (-x12 * a3 + x13 * a1 - x14 * a0) * invdet;
    dest[15] = (+x8 * a3 - x9 * a1 + x10 * a0) * invdet;

    return dest;
  },
  // TODO(nico) breaking convention here...
  // because I don't think it's useful to add
  // two methods for each of these.
  lookAt: function lookAt(dest, eye, center, up) {
    var z = Vec3.sub(eye, center);
    z.$unit();
    var x = Vec3.cross(up, z);
    x.$unit();
    var y = Vec3.cross(z, x);
    y.$unit();
    return Mat4.set(dest, x[0], x[1], x[2], -x.dot(eye), y[0], y[1], y[2], -y.dot(eye), z[0], z[1], z[2], -z.dot(eye), 0, 0, 0, 1);
  },

  frustum: function frustum(dest, left, right, bottom, top, near, far) {
    var rl = right - left,
        tb = top - bottom,
        fn = far - near;

    dest[0] = near * 2 / rl;
    dest[1] = 0;
    dest[2] = 0;
    dest[3] = 0;
    dest[4] = 0;
    dest[5] = near * 2 / tb;
    dest[6] = 0;
    dest[7] = 0;
    dest[8] = (right + left) / rl;
    dest[9] = (top + bottom) / tb;
    dest[10] = -(far + near) / fn;
    dest[11] = -1;
    dest[12] = 0;
    dest[13] = 0;
    dest[14] = -(far * near * 2) / fn;
    dest[15] = 0;

    return dest;
  },

  perspective: function perspective(dest, fov, aspect, near, far) {
    var ymax = near * tan(fov * pi / 360),
        ymin = -ymax,
        xmin = ymin * aspect,
        xmax = ymax * aspect;

    return Mat4.frustum(dest, xmin, xmax, ymin, ymax, near, far);
  },

  // ortho(dest, left, right, bottom, top, near, far) {
  // var rl = right - left,
  // tb = top - bottom,
  // fn = far - near;

  // dest[0] = 2 / rl;
  // dest[1] = 0;
  // dest[2] = 0;
  // dest[3] = 0;
  // dest[4] = 0;
  // dest[5] = 2 / tb;
  // dest[6] = 0;
  // dest[7] = 0;
  // dest[8] = 0;
  // dest[9] = 0;
  // dest[10] = -2 / fn;
  // dest[11] = 0;
  // dest[12] = -(left + right) / rl;
  // dest[13] = -(top + bottom) / tb;
  // dest[14] = -(far + near) / fn;
  // dest[15] = 1;

  // return dest;
  // },

  ortho: function ortho(dest, left, right, top, bottom, near, far) {
    var te = this.elements,
        w = right - left,
        h = top - bottom,
        p = far - near,
        x = (right + left) / w,
        y = (top + bottom) / h,
        z = (far + near) / p;

    dest[0] = 2 / w;dest[4] = 0;dest[8] = 0;dest[12] = -x;
    dest[1] = 0;dest[5] = 2 / h;dest[9] = 0;dest[13] = -y;
    dest[2] = 0;dest[6] = 0;dest[10] = -2 / p;dest[14] = -z;
    dest[3] = 0;dest[7] = 0;dest[11] = 0;dest[15] = 1;

    return dest;
  },

  toFloat32Array: function toFloat32Array(dest) {
    var ans = dest.typedContainer;

    if (!ans) return dest;

    ans[0] = dest[0];
    ans[1] = dest[1];
    ans[2] = dest[2];
    ans[3] = dest[3];
    ans[4] = dest[4];
    ans[5] = dest[5];
    ans[6] = dest[6];
    ans[7] = dest[7];
    ans[8] = dest[8];
    ans[9] = dest[9];
    ans[10] = dest[10];
    ans[11] = dest[11];
    ans[12] = dest[12];
    ans[13] = dest[13];
    ans[14] = dest[14];
    ans[15] = dest[15];

    return ans;
  }
};

// add generics and instance methods
proto = Mat4.prototype;
for (method in generics) {
  Mat4[method] = generics[method];
  proto[method] = (function (m) {
    return function () {
      var args = slice.call(arguments);

      args.unshift(this);
      return Mat4[m].apply(Mat4, args);
    };
  })(method);
}

// Quaternion class

var Quat = (function () {
  function Quat(x, y, z, w) {
    _classCallCheck(this, Quat);

    ArrayImpl.call(this, 4);

    this[0] = x || 0;
    this[1] = y || 0;
    this[2] = z || 0;
    this[3] = w || 0;

    this.typedContainer = new typedArray(4);
  }

  _createClass(Quat, null, [{
    key: 'create',
    value: function create() {
      return new typedArray(4);
    }
  }, {
    key: 'fromVec3',
    value: function fromVec3(v, r) {
      return new Quat(v[0], v[1], v[2], r || 0);
    }
  }, {
    key: 'fromMat4',
    value: function fromMat4(m) {
      var u;
      var v;
      var w;

      // Choose u, v, and w such that u is the index of the biggest diagonal entry
      // of m, and u v w is an even permutation of 0 1 and 2.
      if (m[0] > m[5] && m[0] > m[10]) {
        u = 0;
        v = 1;
        w = 2;
      } else if (m[5] > m[0] && m[5] > m[10]) {
        u = 1;
        v = 2;
        w = 0;
      } else {
        u = 2;
        v = 0;
        w = 1;
      }

      var r = sqrt(1 + m[u * 5] - m[v * 5] - m[w * 5]);
      var q = new Quat();

      q[u] = 0.5 * r;
      q[v] = 0.5 * (m['n' + v + '' + u] + m['n' + u + '' + v]) / r;
      q[w] = 0.5 * (m['n' + u + '' + w] + m['n' + w + '' + u]) / r;
      q[3] = 0.5 * (m['n' + v + '' + w] - m['n' + w + '' + v]) / r;

      return q;
    }
  }, {
    key: 'fromXRotation',
    value: function fromXRotation(angle) {
      return new Quat(sin(angle / 2), 0, 0, cos(angle / 2));
    }
  }, {
    key: 'fromYRotation',
    value: function fromYRotation(angle) {
      return new Quat(0, sin(angle / 2), 0, cos(angle / 2));
    }
  }, {
    key: 'fromZRotation',
    value: function fromZRotation(angle) {
      return new Quat(0, 0, sin(angle / 2), cos(angle / 2));
    }
  }, {
    key: 'fromAxisRotation',
    value: function fromAxisRotation(vec, angle) {
      var x = vec[0],
          y = vec[1],
          z = vec[2],
          d = 1 / sqrt(x * x + y * y + z * z),
          s = sin(angle / 2),
          c = cos(angle / 2);

      return new Quat(s * x * d, s * y * d, s * z * d, c);
    }
  }]);

  return Quat;
})();

exports.Quat = Quat;

generics = {

  setQuat: function setQuat(dest, q) {
    dest[0] = q[0];
    dest[1] = q[1];
    dest[2] = q[2];
    dest[3] = q[3];

    return dest;
  },

  set: function set(dest, x, y, z, w) {
    dest[0] = x || 0;
    dest[1] = y || 0;
    dest[2] = z || 0;
    dest[3] = w || 0;

    return dest;
  },

  clone: function clone(dest) {
    if (dest.$$family) {
      return new Quat(dest[0], dest[1], dest[2], dest[3]);
    } else {
      return Quat.setQuat(new typedArray(4), dest);
    }
  },

  neg: function neg(dest) {
    return new Quat(-dest[0], -dest[1], -dest[2], -dest[3]);
  },

  $neg: function $neg(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    dest[3] = -dest[3];

    return dest;
  },

  add: function add(dest, q) {
    return new Quat(dest[0] + q[0], dest[1] + q[1], dest[2] + q[2], dest[3] + q[3]);
  },

  $add: function $add(dest, q) {
    dest[0] += q[0];
    dest[1] += q[1];
    dest[2] += q[2];
    dest[3] += q[3];

    return dest;
  },

  sub: function sub(dest, q) {
    return new Quat(dest[0] - q[0], dest[1] - q[1], dest[2] - q[2], dest[3] - q[3]);
  },

  $sub: function $sub(dest, q) {
    dest[0] -= q[0];
    dest[1] -= q[1];
    dest[2] -= q[2];
    dest[3] -= q[3];

    return dest;
  },

  scale: function scale(dest, s) {
    return new Quat(dest[0] * s, dest[1] * s, dest[2] * s, dest[3] * s);
  },

  $scale: function $scale(dest, s) {
    dest[0] *= s;
    dest[1] *= s;
    dest[2] *= s;
    dest[3] *= s;

    return dest;
  },

  mulQuat: function mulQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    return new Quat(aW * bX + aX * bW + aY * bZ - aZ * bY, aW * bY + aY * bW + aZ * bX - aX * bZ, aW * bZ + aZ * bW + aX * bY - aY * bX, aW * bW - aX * bX - aY * bY - aZ * bZ);
  },

  $mulQuat: function $mulQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    dest[0] = aW * bX + aX * bW + aY * bZ - aZ * bY;
    dest[1] = aW * bY + aY * bW + aZ * bX - aX * bZ;
    dest[2] = aW * bZ + aZ * bW + aX * bY - aY * bX;
    dest[3] = aW * bW - aX * bX - aY * bY - aZ * bZ;

    return dest;
  },

  divQuat: function divQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);

    return new Quat((aX * bW - aW * bX - aY * bZ + aZ * bY) * d, (aX * bZ - aW * bY + aY * bW - aZ * bX) * d, (aY * bX + aZ * bW - aW * bZ - aX * bY) * d, (aW * bW + aX * bX + aY * bY + aZ * bZ) * d);
  },

  $divQuat: function $divQuat(dest, q) {
    var aX = dest[0],
        aY = dest[1],
        aZ = dest[2],
        aW = dest[3],
        bX = q[0],
        bY = q[1],
        bZ = q[2],
        bW = q[3];

    var d = 1 / (bW * bW + bX * bX + bY * bY + bZ * bZ);

    dest[0] = (aX * bW - aW * bX - aY * bZ + aZ * bY) * d;
    dest[1] = (aX * bZ - aW * bY + aY * bW - aZ * bX) * d;
    dest[2] = (aY * bX + aZ * bW - aW * bZ - aX * bY) * d;
    dest[3] = (aW * bW + aX * bX + aY * bY + aZ * bZ) * d;

    return dest;
  },

  invert: function invert(dest) {
    var q0 = dest[0],
        q1 = dest[1],
        q2 = dest[2],
        q3 = dest[3];

    var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);

    return new Quat(-q0 * d, -q1 * d, -q2 * d, q3 * d);
  },

  $invert: function $invert(dest) {
    var q0 = dest[0],
        q1 = dest[1],
        q2 = dest[2],
        q3 = dest[3];

    var d = 1 / (q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);

    dest[0] = -q0 * d;
    dest[1] = -q1 * d;
    dest[2] = -q2 * d;
    dest[3] = q3 * d;

    return dest;
  },

  norm: function norm(dest) {
    var a = dest[0],
        b = dest[1],
        c = dest[2],
        d = dest[3];

    return sqrt(a * a + b * b + c * c + d * d);
  },

  normSq: function normSq(dest) {
    var a = dest[0],
        b = dest[1],
        c = dest[2],
        d = dest[3];

    return a * a + b * b + c * c + d * d;
  },

  unit: function unit(dest) {
    return Quat.scale(dest, 1 / Quat.norm(dest));
  },

  $unit: function $unit(dest) {
    return Quat.$scale(dest, 1 / Quat.norm(dest));
  },

  conjugate: function conjugate(dest) {
    return new Quat(-dest[0], -dest[1], -dest[2], dest[3]);
  },

  $conjugate: function $conjugate(dest) {
    dest[0] = -dest[0];
    dest[1] = -dest[1];
    dest[2] = -dest[2];
    return dest;
  }
};

// add generics and instance methods

proto = Quat.prototype = {};

for (method in generics) {
  Quat[method] = generics[method];
  proto[method] = (function (m) {
    return function () {
      var args = slice.call(arguments);

      args.unshift(this);
      return Quat[m].apply(Quat, args);
    };
  })(method);
}

//Add static methods
Vec3.fromQuat = function (q) {
  return new Vec3(q[0], q[1], q[2]);
};

Mat4.fromQuat = function (q) {
  var a = q[3],
      b = q[0],
      c = q[1],
      d = q[2];

  return new Mat4(a * a + b * b - c * c - d * d, 2 * b * c - 2 * a * d, 2 * b * d + 2 * a * c, 0, 2 * b * c + 2 * a * d, a * a - b * b + c * c - d * d, 2 * c * d - 2 * a * b, 0, 2 * b * d - 2 * a * c, 2 * c * d + 2 * a * b, a * a - b * b - c * c + d * d, 0, 0, 0, 0, 1);
};

},{}],9:[function(require,module,exports){
// export {default as Vec3} from './vec3';
// export {default as Mat4} from './mat4';
// export {default as Quat} from './quat';
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopExportWildcard(obj, defaults) { var newObj = defaults({}, obj); delete newObj['default']; return newObj; }

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

var _arrayImpl = require('./array-impl');

_defaults(exports, _interopExportWildcard(_arrayImpl, _defaults));

},{"./array-impl":8}],10:[function(require,module,exports){
// media.js
// media has utility functions for image, video and audio manipulation (and
// maybe others like device, etc).
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _camera = require('./camera');

var _camera2 = _interopRequireDefault(_camera);

var _scene = require('./scene');

var _scene2 = _interopRequireDefault(_scene);

var _objects = require('./objects');

// length given a 45 fov angle, and 0.2 distance to camera
var length = 0.16568542494923805;
var plane = new _objects.Plane({ type: 'x,y', xlen: length, ylen: length, offset: 0 });
var camera = new _camera2['default'](45, 1, 0.1, 500, { position: { x: 0, y: 0, z: 0.2 } });
var scene = new _scene2['default']({}, camera);

var Image = (function () {
  function Image() {
    _classCallCheck(this, Image);
  }

  _createClass(Image, null, [{
    key: 'postProcess',

    // post process an image by setting it to a texture with a specified fragment
    // and vertex shader.
    value: function postProcess(opt) {
      var program = app.program.$$family ? app.program : app.program[opt.program],
          textures = opt.fromTexture ? $.splat(opt.fromTexture) : [],
          framebuffer = opt.toFrameBuffer,
          screen = !!opt.toScreen,
          width = opt.width || app.canvas.width,
          height = opt.height || app.canvas.height,
          x = opt.viewportX || 0,
          y = opt.viewportY || 0;

      camera.aspect = opt.aspectRatio ? opt.aspectRatio : Math.max(height / width, width / height);
      camera.update();

      scene.program = program;

      plane.textures = textures;
      plane.program = program;

      if (!scene.models.length) {
        scene.add(plane);
      }

      if (framebuffer) {
        // create framebuffer
        if (!(framebuffer in app.frameBufferMemo)) {
          app.setFrameBuffer(framebuffer, {
            width: width,
            height: height,
            bindToTexture: {
              parameters: [{
                name: 'TEXTURE_MAG_FILTER',
                value: 'LINEAR'
              }, {
                name: 'TEXTURE_MIN_FILTER',
                value: 'LINEAR',
                generateMipmap: false
              }]
            },
            bindToRenderBuffer: false
          });
        }
        program.use();
        app.setFrameBuffer(framebuffer, true);
        gl.viewport(x, y, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        program.setUniforms(opt.uniforms || {});
        scene.renderToTexture(framebuffer);
        app.setFrameBuffer(framebuffer, false);
      }

      if (screen) {
        program.use();
        gl.viewport(x, y, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        program.setUniforms(opt.uniforms || {});
        scene.render();
      }

      return this;
    }
  }]);

  return Image;
})();

exports['default'] = Image;
module.exports = exports['default'];

},{"./camera":2,"./objects":15,"./scene":21}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _truncatedCone = require('./truncated-cone');

var _truncatedCone2 = _interopRequireDefault(_truncatedCone);

var Cone = (function (_TruncatedCone) {
  _inherits(Cone, _TruncatedCone);

  function Cone() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Cone);

    _get(Object.getPrototypeOf(Cone.prototype), 'constructor', this).call(this, _extends({}, config, {
      topRadius: 0,
      topCap: Boolean(config.cap),
      bottomCap: Boolean(config.cap),
      bottomRadius: config.radius || 3
    }));
  }

  return Cone;
})(_truncatedCone2['default']);

exports['default'] = Cone;
module.exports = exports['default'];

},{"./truncated-cone":19}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var Cube = (function (_Model) {
  _inherits(Cube, _Model);

  function Cube() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Cube);

    _get(Object.getPrototypeOf(Cube.prototype), 'constructor', this).call(this, _extends({
      vertices: [-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1],
      texCoords: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,

      // Back face
      1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

      // Top face
      0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,

      // Bottom face
      1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

      // Right face
      1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

      // Left face
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0],

      normals: [
      // Front face
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

      // Back face
      0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

      // Top face
      0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

      // Bottom face
      0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

      // Right face
      1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

      // Left face
      -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0],

      indices: [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23]

    }, config));
  }

  return Cube;
})(_model2['default']);

exports['default'] = Cube;
module.exports = exports['default'];

},{"./model":16}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _truncatedCone = require('./truncated-cone');

var _truncatedCone2 = _interopRequireDefault(_truncatedCone);

var Cylinder = (function (_TruncatedCone) {
  _inherits(Cylinder, _TruncatedCone);

  function Cylinder() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Cylinder);

    _get(Object.getPrototypeOf(Cylinder.prototype), 'constructor', this).call(this, _extends({}, config, {
      bottomRadius: config.radius,
      topRadius: config.radius
    }));
  }

  return Cylinder;
})(_truncatedCone2['default']);

exports['default'] = Cylinder;
module.exports = exports['default'];

},{"./truncated-cone":19}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var IcoSphere = (function (_Model) {
  _inherits(IcoSphere, _Model);

  function IcoSphere() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, IcoSphere);

    var iterations = opt.iterations || 0,
        vertices = [],
        indices = [],
        sqrt = Math.sqrt,
        acos = Math.acos,
        atan2 = Math.atan2,
        pi = Math.PI,
        pi2 = pi * 2;

    //Add a callback for when a vertex is created
    opt.onAddVertex = opt.onAddVertex || $.empty;

    // and octahedron vertices
    var t = (1 + sqrt(5)) / 2,
        square = sqrt(1 + t * t);

    vertices.push(-1, 0, 0, 0, 1, 0, 0, 0, -1, 0, 0, 1, 0, -1, 0, 1, 0, 0);
    indices.push(3, 4, 5, 3, 5, 1, 3, 1, 0, 3, 0, 4, 4, 0, 2, 4, 2, 5, 2, 0, 1, 5, 2, 1);

    var getMiddlePoint = (function () {
      var pointMemo = {};

      return function (i1, i2) {
        i1 *= 3;
        i2 *= 3;
        var mini = i1 < i2 ? i1 : i2,
            maxi = i1 > i2 ? i1 : i2,
            key = mini + '|' + maxi;

        if (key in pointMemo) {
          return pointMemo[key];
        }

        var x1 = vertices[i1],
            y1 = vertices[i1 + 1],
            z1 = vertices[i1 + 2],
            x2 = vertices[i2],
            y2 = vertices[i2 + 1],
            z2 = vertices[i2 + 2],
            xm = (x1 + x2) / 2,
            ym = (y1 + y2) / 2,
            zm = (z1 + z2) / 2,
            len = sqrt(xm * xm + ym * ym + zm * zm);

        xm /= len;
        ym /= len;
        zm /= len;

        vertices.push(xm, ym, zm);

        return pointMemo[key] = vertices.length / 3 - 1;
      };
    })();

    for (var i = 0; i < iterations; i++) {
      var indices2 = [];
      for (var j = 0, l = indices.length; j < l; j += 3) {
        var a = getMiddlePoint(indices[j], indices[j + 1]),
            b = getMiddlePoint(indices[j + 1], indices[j + 2]),
            c = getMiddlePoint(indices[j + 2], indices[j]);

        indices2.push(c, indices[j], a, a, indices[j + 1], b, b, indices[j + 2], c, a, b, c);
      }
      indices = indices2;
    }

    //Calculate texCoords and normals
    var l = indices.length,
        normals = new Array(l * 3),
        texCoords = new Array(l * 2);

    for (var i = l - 3; i >= 0; i -= 3) {
      var i1 = indices[i],
          i2 = indices[i + 1],
          i3 = indices[i + 2],
          in1 = i1 * 3,
          in2 = i2 * 3,
          in3 = i3 * 3,
          iu1 = i1 * 2,
          iu2 = i2 * 2,
          iu3 = i3 * 2,
          x1 = vertices[in1],
          y1 = vertices[in1 + 1],
          z1 = vertices[in1 + 2],
          theta1 = acos(z1 / sqrt(x1 * x1 + y1 * y1 + z1 * z1)),
          phi1 = atan2(y1, x1) + pi,
          v1 = theta1 / pi,
          u1 = 1 - phi1 / pi2,
          x2 = vertices[in2],
          y2 = vertices[in2 + 1],
          z2 = vertices[in2 + 2],
          theta2 = acos(z2 / sqrt(x2 * x2 + y2 * y2 + z2 * z2)),
          phi2 = atan2(y2, x2) + pi,
          v2 = theta2 / pi,
          u2 = 1 - phi2 / pi2,
          x3 = vertices[in3],
          y3 = vertices[in3 + 1],
          z3 = vertices[in3 + 2],
          theta3 = acos(z3 / sqrt(x3 * x3 + y3 * y3 + z3 * z3)),
          phi3 = atan2(y3, x3) + pi,
          v3 = theta3 / pi,
          u3 = 1 - phi3 / pi2,
          vec1 = [x3 - x2, y3 - y2, z3 - z2],
          vec2 = [x1 - x2, y1 - y2, z1 - z2],
          normal = Vec3.cross(vec1, vec2).$unit(),
          newIndex;

      if ((u1 == 0 || u2 == 0 || u3 == 0) && (u1 == 0 || u1 > 0.5) && (u2 == 0 || u2 > 0.5) && (u3 == 0 || u3 > 0.5)) {

        vertices.push(vertices[in1], vertices[in1 + 1], vertices[in1 + 2]);
        newIndex = vertices.length / 3 - 1;
        indices.push(newIndex);
        texCoords[newIndex * 2] = 1;
        texCoords[newIndex * 2 + 1] = v1;
        normals[newIndex * 3] = normal.x;
        normals[newIndex * 3 + 1] = normal.y;
        normals[newIndex * 3 + 2] = normal.z;

        vertices.push(vertices[in2], vertices[in2 + 1], vertices[in2 + 2]);
        newIndex = vertices.length / 3 - 1;
        indices.push(newIndex);
        texCoords[newIndex * 2] = 1;
        texCoords[newIndex * 2 + 1] = v2;
        normals[newIndex * 3] = normal.x;
        normals[newIndex * 3 + 1] = normal.y;
        normals[newIndex * 3 + 2] = normal.z;

        vertices.push(vertices[in3], vertices[in3 + 1], vertices[in3 + 2]);
        newIndex = vertices.length / 3 - 1;
        indices.push(newIndex);
        texCoords[newIndex * 2] = 1;
        texCoords[newIndex * 2 + 1] = v3;
        normals[newIndex * 3] = normal.x;
        normals[newIndex * 3 + 1] = normal.y;
        normals[newIndex * 3 + 2] = normal.z;
      }

      normals[in1] = normals[in2] = normals[in3] = normal.x;
      normals[in1 + 1] = normals[in2 + 1] = normals[in3 + 1] = normal.y;
      normals[in1 + 2] = normals[in2 + 2] = normals[in3 + 2] = normal.z;

      texCoords[iu1] = u1;
      texCoords[iu1 + 1] = v1;

      texCoords[iu2] = u2;
      texCoords[iu2 + 1] = v2;

      texCoords[iu3] = u3;
      texCoords[iu3 + 1] = v3;
    }

    _get(Object.getPrototypeOf(IcoSphere.prototype), 'constructor', this).call(this, _extends({
      vertices: vertices,
      indices: indices,
      normals: normals,
      texCoords: texCoords
    }, opt));
  }

  return IcoSphere;
})(_model2['default']);

exports['default'] = IcoSphere;
module.exports = exports['default'];

},{"./model":16}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequire(obj) { return obj && obj.__esModule ? obj['default'] : obj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// unique id

var _jqueryMini = require('../jquery-mini');

var _jqueryMini2 = _interopRequireDefault(_jqueryMini);

var _model = require('./model');

exports.Model = _interopRequire(_model);

var _cone = require('./cone');

exports.Cone = _interopRequire(_cone);

var _cube = require('./cube');

exports.Cube = _interopRequire(_cube);

var _cylinder = require('./cylinder');

exports.Cylinder = _interopRequire(_cylinder);

var _icoSphere = require('./ico-sphere');

exports.IcoSphere = _interopRequire(_icoSphere);

var _plane = require('./plane');

exports.Plane = _interopRequire(_plane);

var _sphere = require('./sphere');

exports.Sphere = _interopRequire(_sphere);
exports.TruncatedCone = _interopRequire(_cone);
var id = _jqueryMini2['default'].time();
exports.id = id;

},{"../jquery-mini":7,"./cone":11,"./cube":12,"./cylinder":13,"./ico-sphere":14,"./model":16,"./plane":17,"./sphere":18}],16:[function(require,module,exports){
// o3d.js
// Scene Objects
/* eslint-disable guard-for-in */

// Define some locals
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _math = require('../math');

var _scene = require('../scene');

var _scene2 = _interopRequireDefault(_scene);

var _jqueryMini = require('../jquery-mini');

var _jqueryMini2 = _interopRequireDefault(_jqueryMini);

var slice = Array.prototype.slice;

function normalizeColors(arr, len) {
  if (arr && arr.length < len) {
    var a0 = arr[0];
    var a1 = arr[1];
    var a2 = arr[2];
    var a3 = arr[3];
    var ans = [a0, a1, a2, a3];
    var times = len / arr.length;
    var index = undefined;

    while (--times) {
      index = times * 4;
      ans[index + 0] = a0;
      ans[index + 1] = a1;
      ans[index + 2] = a2;
      ans[index + 3] = a3;
    }

    return new Float32Array(ans);
  }
  return arr;
}

// Model repository
// map attribute names to property names
// TODO(nico): textures are treated separately.
/*
const attributeMap = {
  'position': 'vertices',
  'normal': 'normals',
  'pickingColor': 'pickingColors',
  'colors': 'color'
};
*/

// Model abstract O3D Class

var Model = (function () {

  /* eslint-disable max-statements  */
  /* eslint-disable complexity  */

  function Model() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Model);

    this.id = opt.id || _jqueryMini2['default'].uid();
    // picking options
    this.pickable = Boolean(opt.pickable);
    this.pick = opt.pick || function () {
      return false;
    };

    this.vertices = opt.vertices;
    this.normals = opt.normals;
    this.textures = opt.textures && _jqueryMini2['default'].splat(opt.textures);
    this.colors = opt.colors;
    this.indices = opt.indices;
    this.shininess = opt.shininess || 0;
    this.reflection = opt.reflection || 0;
    this.refraction = opt.refraction || 0;

    if (opt.pickingColors) {
      this.pickingColors = opt.pickingColors;
    }

    if (opt.texCoords) {
      this.texCoords = opt.texCoords;
    }

    // extra uniforms
    this.uniforms = opt.uniforms || {};
    // extra attribute descriptors
    this.attributes = opt.attributes || {};
    // override the render method
    this.render = opt.render;
    // whether to render as triangles, lines, points, etc.
    this.drawType = opt.hasOwnProperty('drawType') ? opt.drawType : 'TRIANGLES';
    // whether to display the object at all
    this.display = 'display' in opt ? opt.display : true;
    // before and after render callbacks
    this.onBeforeRender = opt.onBeforeRender || _jqueryMini2['default'].empty;
    this.onAfterRender = opt.onAfterRender || _jqueryMini2['default'].empty;
    // set a custom program per o3d
    if (opt.program) {
      this.program = opt.program;
    }
    // model position, rotation, scale and all in all matrix
    this.position = new _math.Vec3();
    this.rotation = new _math.Vec3();
    this.scale = new _math.Vec3(1, 1, 1);
    this.matrix = new _math.Mat4();

    if (opt.computeCentroids) {
      this.computeCentroids();
    }

    if (opt.computeNormals) {
      this.computeNormals();
    }
  }

  /* eslint-enable max-statements */
  /* eslint-enable complexity */

  // ensure known attributes use typed arrays

  _createClass(Model, [{
    key: 'update',
    value: function update() {
      var pos = this.position;
      var rot = this.rotation;
      var scale = this.scale;

      this.matrix.id();
      this.matrix.$translate(pos.x, pos.y, pos.z);
      this.matrix.$rotateXYZ(rot.x, rot.y, rot.z);
      this.matrix.$scale(scale.x, scale.y, scale.z);
    }
  }, {
    key: 'computeCentroids',
    value: function computeCentroids() {
      var faces = this.faces;
      var vertices = this.vertices;
      var centroids = [];

      faces.forEach(function (face) {
        var centroid = [0, 0, 0];
        var acum = 0;

        face.forEach(function (idx) {
          var vertex = vertices[idx];
          centroid[0] += vertex[0];
          centroid[1] += vertex[1];
          centroid[2] += vertex[2];
          acum++;
        });

        centroid[0] /= acum;
        centroid[1] /= acum;
        centroid[2] /= acum;

        centroids.push(centroid);
      });

      this.centroids = centroids;
    }
  }, {
    key: 'computeNormals',
    value: function computeNormals() {
      var faces = this.faces;
      var vertices = this.vertices;
      var normals = [];

      faces.forEach(function (face) {
        var v1 = vertices[face[0]];
        var v2 = vertices[face[1]];
        var v3 = vertices[face[2]];
        var dir1 = {
          x: v3[0] - v2[0],
          y: v3[1] - v2[1],
          z: v3[1] - v2[2]
        };
        var dir2 = {
          x: v1[0] - v2[0],
          y: v1[1] - v2[1],
          z: v1[2] - v2[2]
        };

        _math.Vec3.$cross(dir2, dir1);

        if (_math.Vec3.norm(dir2) > 1e-6) {
          _math.Vec3.unit(dir2);
        }

        normals.push([dir2.x, dir2.y, dir2.z]);
      });

      this.normals = normals;
    }
  }, {
    key: 'setUniforms',
    value: function setUniforms(program) {
      program.setUniforms(this.uniforms);
    }
  }, {
    key: 'setAttributes',
    value: function setAttributes(program) {
      var attributes = this.attributes;
      for (var _name in attributes) {
        var descriptor = attributes[_name];
        var bufferId = this.id + '-' + _name;
        if (!Object.keys(descriptor).length) {
          program.setBuffer(bufferId, true);
        } else {
          descriptor.attribute = _name;
          program.setBuffer(bufferId, descriptor);
          delete descriptor.value;
        }
      }
    }
  }, {
    key: 'setVertices',
    value: function setVertices(program) {
      if (!this.$vertices) {
        return;
      }

      if (this.dynamic) {
        program.setBuffer('position-' + this.id, {
          attribute: 'position',
          value: this.$vertices,
          size: 3
        });
      } else {
        program.setBuffer('position-' + this.id);
      }
    }
  }, {
    key: 'setNormals',
    value: function setNormals(program) {
      if (!this.$normals) {
        return;
      }

      if (this.dynamic) {
        program.setBuffer('normal-' + this.id, {
          attribute: 'normal',
          value: this.$normals,
          size: 3
        });
      } else {
        program.setBuffer('normal-' + this.id);
      }
    }
  }, {
    key: 'setIndices',
    value: function setIndices(program) {
      if (!this.$indices) {
        return;
      }

      if (this.dynamic) {
        program.setBuffer('indices-' + this.id, {
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          drawType: gl.STATIC_DRAW,
          value: this.$indices,
          size: 1
        });
      } else {
        program.setBuffer('indices-' + this.id);
      }
    }
  }, {
    key: 'setPickingColors',
    value: function setPickingColors(program) {
      if (!this.$pickingColors) {
        return;
      }

      if (this.dynamic) {
        program.setBuffer('pickingColor-' + this.id, {
          attribute: 'pickingColor',
          value: this.$pickingColors,
          size: 4
        });
      } else {
        program.setBuffer('pickingColor-' + this.id);
      }
    }
  }, {
    key: 'setColors',
    value: function setColors(program) {
      if (!this.$colors) {
        return;
      }

      if (this.dynamic) {
        program.setBuffer('color-' + this.id, {
          attribute: 'color',
          value: this.$colors,
          size: 4
        });
      } else {
        program.setBuffer('color-' + this.id);
      }
    }
  }, {
    key: 'setTexCoords',
    value: function setTexCoords(program) {
      if (!this.$texCoords) {
        return;
      }

      var id = this.id;
      var i = undefined;
      var txs = undefined;
      var l = undefined;
      var tex = undefined;

      if (this.dynamic) {
        // If is an object containing textureName -> textureCoordArray
        // Set all textures, samplers and textureCoords.
        if (_jqueryMini2['default'].type(this.$texCoords) === 'object') {
          for (i = 0, txs = this.textures, l = txs.length; i < l; i++) {
            tex = txs[i];
            program.setBuffer('texCoord-' + i + '-' + id, {
              attribute: 'texCoord' + (i + 1),
              value: this.$texCoords[tex],
              size: 2
            });
          }
          // An array of textureCoordinates
        } else {
            program.setBuffer('texCoord-' + id, {
              attribute: 'texCoord1',
              value: this.$texCoords,
              size: 2
            });
          }
      } else if (_jqueryMini2['default'].type(this.$texCoords) === 'object') {
        for (i = 0, txs = this.textures, l = txs.length; i < l; i++) {
          program.setBuffer('texCoord-' + i + '-' + id);
        }
      } else {
        program.setBuffer('texCoord-' + id);
      }
    }
  }, {
    key: 'setTextures',
    value: function setTextures(program, force) {
      this.textures = this.textures ? _jqueryMini2['default'].splat(this.textures) : [];
      var tex2D = 0;
      var texCube = 0;
      var mtexs = _scene2['default'].MAX_TEXTURES;
      for (var i = 0, texs = this.textures, l = texs.length; i < mtexs; i++) {
        if (i < l) {
          var isCube = app.textureMemo[texs[i]].isCube;
          if (isCube) {
            program.setUniform('hasTextureCube' + (i + 1), true);
            program.setTexture(texs[i], gl['TEXTURE' + i]);
            program.setUniform('samplerCube' + (texCube + 1), i);
            texCube++;
          } else {
            program.setUniform('hasTexture' + (i + 1), true);
            program.setTexture(texs[i], gl['TEXTURE' + i]);
            program.setUniform('sampler' + (tex2D + 1), i);
            tex2D++;
          }
        } else {
          program.setUniform('hasTextureCube' + (i + 1), false);
          program.setUniform('hasTexture' + (i + 1), false);
          program.setUniform('sampler' + ++tex2D, i);
          program.setUniform('samplerCube' + ++texCube, i);
        }
      }
    }
  }, {
    key: 'setState',
    value: function setState(program) {
      this.setUniforms(program);
      this.setAttributes(program);
      this.setVertices(program);
      this.setColors(program);
      this.setPickingColors(program);
      this.setNormals(program);
      this.setTextures(program);
      this.setTexCoords(program);
      this.setIndices(program);
    }
  }, {
    key: 'unsetState',
    value: function unsetState(program) {
      var attributes = program.attributes;

      // unbind the array and element buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

      for (var name in attributes) {
        gl.disableVertexAttribArray(attributes[name]);
      }
    }
  }, {
    key: 'hash',
    get: function get() {
      return this.id + ' ' + this.$pickingIndex;
    }
  }, {
    key: 'vertices',
    set: function set(val) {
      if (!val) {
        delete this.$vertices;
        delete this.$verticesLength;
        return;
      }
      var vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$vertices = val;
      } else if (this.$verticesLength === vlen) {
        this.$vertices.set(val);
      } else {
        this.$vertices = new Float32Array(val);
      }
      this.$verticesLength = vlen;
    },
    get: function get() {
      return this.$vertices;
    }
  }, {
    key: 'normals',
    set: function set(val) {
      if (!val) {
        delete this.$normals;
        delete this.$normalsLength;
        return;
      }
      var vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$normals = val;
      } else if (this.$normalsLength === vlen) {
        this.$normals.set(val);
      } else {
        this.$normals = new Float32Array(val);
      }
      this.$normalsLength = vlen;
    },
    get: function get() {
      return this.$normals;
    }
  }, {
    key: 'colors',
    set: function set(val) {
      if (!val) {
        delete this.$colors;
        delete this.$colorsLength;
        return;
      }
      var vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$colors = val;
      } else if (this.$colorsLength === vlen) {
        this.$colors.set(val);
      } else {
        this.$colors = new Float32Array(val);
      }
      if (this.$vertices && this.$verticesLength / 3 * 4 !== vlen) {
        this.$colors = normalizeColors(slice.call(this.$colors), this.$verticesLength / 3 * 4);
      }
      this.$colorsLength = this.$colors.length;
    },
    get: function get() {
      return this.$colors;
    }
  }, {
    key: 'pickingColors',
    set: function set(val) {
      if (!val) {
        delete this.$pickingColors;
        delete this.$pickingColorsLength;
        return;
      }
      var vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$pickingColors = val;
      } else if (this.$pickingColorsLength === vlen) {
        this.$pickingColors.set(val);
      } else {
        this.$pickingColors = new Float32Array(val);
      }
      if (this.$vertices && this.$verticesLength / 3 * 4 !== vlen) {
        this.$pickingColors = normalizeColors(slice.call(this.$pickingColors), this.$verticesLength / 3 * 4);
      }
      this.$pickingColorsLength = this.$pickingColors.length;
    },
    get: function get() {
      return this.$pickingColors;
    }
  }, {
    key: 'texCoords',
    set: function set(val) {
      if (!val) {
        delete this.$texCoords;
        delete this.$texCoordsLength;
        return;
      }
      if (_jqueryMini2['default'].type(val) === 'object') {
        var ans = {};
        for (var prop in val) {
          var texCoordArray = val[prop];
          ans[prop] = texCoordArray.BYTES_PER_ELEMENT ? texCoordArray : new Float32Array(texCoordArray);
        }
        this.$texCoords = ans;
      } else {
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$texCoords = val;
        } else if (this.$texCoordsLength === vlen) {
          this.$texCoords.set(val);
        } else {
          this.$texCoords = new Float32Array(val);
        }
        this.$texCoordsLength = vlen;
      }
    },
    get: function get() {
      return this.$texCoords;
    }
  }, {
    key: 'indices',
    set: function set(val) {
      if (!val) {
        delete this.$indices;
        delete this.$indicesLength;
        return;
      }
      var vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$indices = val;
      } else if (this.$indicesLength === vlen) {
        this.$indices.set(val);
      } else {
        this.$indices = new Uint16Array(val);
      }
      this.$indicesLength = vlen;
    },
    get: function get() {
      return this.$indices;
    }
  }]);

  return Model;
})();

exports['default'] = Model;
module.exports = exports['default'];

},{"../jquery-mini":7,"../math":9,"../scene":21}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var Plane = (function (_Model) {
  _inherits(Plane, _Model);

  function Plane() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Plane);

    var type = config.type;
    var unpack = config.unpack;
    var coords = type.split(',');
    var c1len = config[coords[0] + 'len']; //width
    var c2len = config[coords[1] + 'len']; //height
    var subdivisions1 = config['n' + coords[0]] || 1; //subdivisionsWidth
    var subdivisions2 = config['n' + coords[1]] || 1; //subdivisionsDepth
    var offset = config.offset;
    var flipCull = !!config.flipCull;
    var numVertices = (subdivisions1 + 1) * (subdivisions2 + 1);
    var positions = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var i2 = 0,
        i3 = 0;

    if (flipCull) {
      c1len = -c1len;
    }

    for (var z = 0; z <= subdivisions2; z++) {
      for (var x = 0; x <= subdivisions1; x++) {
        var u = x / subdivisions1,
            v = z / subdivisions2;
        if (flipCull) {
          texCoords[i2 + 0] = 1 - u;
        } else {
          texCoords[i2 + 0] = u;
        }
        texCoords[i2 + 1] = v;
        i2 += 2;

        switch (type) {
          case 'x,y':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = c2len * v - c2len * 0.5;
            positions[i3 + 2] = offset;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = 0;
            if (flipCull) {
              normals[i3 + 2] = 1;
            } else {
              normals[i3 + 2] = -1;
            }
            break;

          case 'x,z':
            positions[i3 + 0] = c1len * u - c1len * 0.5;
            positions[i3 + 1] = offset;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = 0;
            if (flipCull) {
              normals[i3 + 1] = 1;
            } else {
              normals[i3 + 1] = -1;
            }
            normals[i3 + 2] = 0;
            break;

          case 'y,z':
            positions[i3 + 0] = offset;
            positions[i3 + 1] = c1len * u - c1len * 0.5;
            positions[i3 + 2] = c2len * v - c2len * 0.5;

            if (flipCull) {
              normals[i3 + 0] = 1;
            } else {
              normals[i3 + 0] = -1;
            }
            normals[i3 + 1] = 0;
            normals[i3 + 2] = 0;
            break;
        }
        i3 += 3;
      }
    }

    var numVertsAcross = subdivisions1 + 1,
        indices = [],
        index;

    for (z = 0; z < subdivisions2; z++) {
      for (x = 0; x < subdivisions1; x++) {
        index = (z * subdivisions1 + x) * 6;
        // Make triangle 1 of quad.
        indices[index + 0] = (z + 0) * numVertsAcross + x;
        indices[index + 1] = (z + 1) * numVertsAcross + x;
        indices[index + 2] = (z + 0) * numVertsAcross + x + 1;

        // Make triangle 2 of quad.
        indices[index + 3] = (z + 1) * numVertsAcross + x;
        indices[index + 4] = (z + 1) * numVertsAcross + x + 1;
        indices[index + 5] = (z + 0) * numVertsAcross + x + 1;
      }
    }

    var positions2, normals2, texCoords2;
    if (config.unpack) {
      positions2 = new Float32Array(indices.length * 3);
      normals2 = new Float32Array(indices.length * 3);
      texCoords2 = new Float32Array(indices.length * 2);

      for (x = 0, l = indices.length; x < l; ++x) {
        index = indices[x];
        positions2[x * 3] = positions[index * 3];
        positions2[x * 3 + 1] = positions[index * 3 + 1];
        positions2[x * 3 + 2] = positions[index * 3 + 2];
        normals2[x * 3] = normals[index * 3];
        normals2[x * 3 + 1] = normals[index * 3 + 1];
        normals2[x * 3 + 2] = normals[index * 3 + 2];
        texCoords2[x * 2] = texCoords[index * 2];
        texCoords2[x * 2 + 1] = texCoords[index * 2 + 1];
      }

      config = _extends({
        vertices: positions2,
        normals: normals2,
        texCoords: texCoords2
      }, config);
    } else {
      config = _extends({
        vertices: positions,
        normals: normals,
        texCoords: texCoords,
        indices: indices
      }, config);
    }

    _get(Object.getPrototypeOf(Plane.prototype), 'constructor', this).call(this, config);
  }

  return Plane;
})(_model2['default']);

exports['default'] = Plane;
module.exports = exports['default'];

},{"./model":16}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

// Primitives inspired by TDL http://code.google.com/p/webglsamples/,
// copyright 2011 Google Inc. new BSD License
// (http://www.opensource.org/licenses/bsd-license.php).

var Sphere = (function (_Model) {
  _inherits(Sphere, _Model);

  function Sphere() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Sphere);

    var nlat = opt.nlat || 10;
    var nlong = opt.nlong || 10;
    var radius = opt.radius || 1;
    var startLat = 0;
    var endLat = Math.PI;
    var latRange = endLat - startLat;
    var startLong = 0;
    var endLong = 2 * Math.PI;
    var longRange = endLong - startLong;
    var numVertices = (nlat + 1) * (nlong + 1);
    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var indices = new Uint16Array(nlat * nlong * 6);

    if (typeof radius === 'number') {
      var value = radius;
      radius = function (n1, n2, n3, u, v) {
        return value;
      };
    }

    // Create vertices, normals and texCoords
    for (var y = 0; y <= nlat; y++) {
      for (var x = 0; x <= nlong; x++) {
        var u = x / nlong;
        var v = y / nlat;
        var theta = longRange * u;
        var phi = latRange * v;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        var ux = cosTheta * sinPhi;
        var uy = cosPhi;
        var uz = sinTheta * sinPhi;
        var r = radius(ux, uy, uz, u, v);
        var index = x + y * (nlong + 1);
        var i3 = index * 3;
        var i2 = index * 2;

        vertices[i3 + 0] = r * ux;
        vertices[i3 + 1] = r * uy;
        vertices[i3 + 2] = r * uz;

        normals[i3 + 0] = ux;
        normals[i3 + 1] = uy;
        normals[i3 + 2] = uz;

        texCoords[i2 + 0] = u;
        texCoords[i2 + 1] = v;
      }
    }

    // Create indices
    var numVertsAround = nlat + 1;
    for (var x = 0; x < nlat; x++) {
      for (var y = 0; y < nlong; y++) {
        var index = (x * nlong + y) * 6;

        indices[index + 0] = y * numVertsAround + x;
        indices[index + 1] = y * numVertsAround + x + 1;
        indices[index + 2] = (y + 1) * numVertsAround + x;

        indices[index + 3] = (y + 1) * numVertsAround + x;
        indices[index + 4] = y * numVertsAround + x + 1;
        indices[index + 5] = (y + 1) * numVertsAround + x + 1;
      }
    }

    _get(Object.getPrototypeOf(Sphere.prototype), 'constructor', this).call(this, _extends({
      vertices: vertices,
      indices: indices,
      normals: normals,
      texCoords: texCoords
    }, opt));
  }

  return Sphere;
})(_model2['default']);

exports['default'] = Sphere;
module.exports = exports['default'];

},{"./model":16}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var TruncatedCone = (function (_Model) {
  _inherits(TruncatedCone, _Model);

  function TruncatedCone() {
    var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, TruncatedCone);

    var bottomRadius = config.bottomRadius || 0;
    var topRadius = config.topRadius || 0;
    var height = config.height || 1;
    var nradial = config.nradial || 10;
    var nvertical = config.nvertical || 10;
    var topCap = Boolean(config.topCap);
    var bottomCap = Boolean(config.bottomCap);
    var extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);
    var numVertices = (nradial + 1) * (nvertical + 1 + extra);
    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var indices = new Uint16Array(nradial * (nvertical + extra) * 6);
    var vertsAroundEdge = nradial + 1;
    var math = Math;
    var slant = math.atan2(bottomRadius - topRadius, height);
    var msin = math.sin;
    var mcos = math.cos;
    var mpi = math.PI;
    var cosSlant = mcos(slant);
    var sinSlant = msin(slant);
    var start = topCap ? -2 : 0;
    var end = nvertical + (bottomCap ? 2 : 0);
    var i3 = 0;
    var i2 = 0;

    for (var i = start; i <= end; i++) {
      var v = i / nvertical;
      var y = height * v;
      var ringRadius = undefined;

      if (i < 0) {
        y = 0;
        v = 1;
        ringRadius = bottomRadius;
      } else if (i > nvertical) {
        y = height;
        v = 1;
        ringRadius = topRadius;
      } else {
        ringRadius = bottomRadius + (topRadius - bottomRadius) * (i / nvertical);
      }
      if (i === -2 || i === nvertical + 2) {
        ringRadius = 0;
        v = 0;
      }
      y -= height / 2;
      for (var j = 0; j < vertsAroundEdge; j++) {
        var sin = msin(j * mpi * 2 / nradial);
        var cos = mcos(j * mpi * 2 / nradial);

        vertices[i3 + 0] = sin * ringRadius;
        vertices[i3 + 1] = y;
        vertices[i3 + 2] = cos * ringRadius;

        normals[i3 + 0] = i < 0 || i > nvertical ? 0 : sin * cosSlant;
        normals[i3 + 1] = i < 0 ? -1 : i > nvertical ? 1 : sinSlant;
        normals[i3 + 2] = i < 0 || i > nvertical ? 0 : cos * cosSlant;

        texCoords[i2 + 0] = j / nradial;
        texCoords[i2 + 1] = v;

        i2 += 2;
        i3 += 3;
      }
    }

    for (var i = 0; i < nvertical + extra; i++) {
      for (var j = 0; j < nradial; j++) {
        var index = (i * nradial + j) * 6;
        indices[index + 0] = vertsAroundEdge * (i + 0) + 0 + j;
        indices[index + 1] = vertsAroundEdge * (i + 0) + 1 + j;
        indices[index + 2] = vertsAroundEdge * (i + 1) + 1 + j;
        indices[index + 3] = vertsAroundEdge * (i + 0) + 0 + j;
        indices[index + 4] = vertsAroundEdge * (i + 1) + 1 + j;
        indices[index + 5] = vertsAroundEdge * (i + 1) + 0 + j;
      }
    }

    _get(Object.getPrototypeOf(TruncatedCone.prototype), 'constructor', this).call(this, _extends({
      vertices: vertices,
      normals: normals,
      texCoords: texCoords,
      indices: indices
    }, config));
  }

  return TruncatedCone;
})(_model2['default']);

exports['default'] = TruncatedCone;
module.exports = exports['default'];

},{"./model":16}],20:[function(require,module,exports){
// program.js
// Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _io = require('./io');

function getpath(path) {
  var last = path.lastIndexOf('/');
  if (last === '/') {
    return './';
  }
  return path.substr(0, last + 1);
}

// Creates a shader from a string source.
function createShader(gl, shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);
  if (shader === null) {
    throw new Error('Error creating shader with type ' + shaderType);
  }
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    var info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Error while compiling the shader ' + info);
  }
  return shader;
}

// Creates a program from vertex and fragment shader sources.
function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, createShader(gl, vertexShader, gl.VERTEX_SHADER));
  gl.attachShader(program, createShader(gl, fragmentShader, gl.FRAGMENT_SHADER));
  linkProgram(gl, program);
  return program;
}

// preprocess a source with `#include ""` support
// `duplist` records all the pending replacements
function preprocess(base, source, callback, callbackError) {
  var duplist = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

  var match;
  if (match = source.match(/#include "(.*?)"/)) {
    var _ret = (function () {
      var url = getpath(base) + match[1];

      if (duplist[url]) {
        callbackError('Recursive include');
      }

      return {
        v: new _io.XHR({ url: url, noCache: true }).sendAsync().then(function (response) {
          duplist[url] = true;
          return preprocess(url, response, function (replacement) {
            delete duplist[url];
            source = source.replace(/#include ".*?"/, replacement);
            source = source.replace(/\sHAS_EXTENSION\s*\(\s*([A-Za-z_\-0-9]+)\s*\)/g, function (all, ext) {
              return gl.getExtension(ext) ? ' 1 ' : ' 0 ';
            });
            return preprocess(url, source, callback, callbackError, duplist);
          }, callbackError, duplist);
        })['catch'](function (code) {
          callbackError(new Error('Load included file `' + url + '` failed: Code ' + code));
        })
      };
    })();

    if (typeof _ret === 'object') return _ret.v;
  } else {
    return callback(source);
  }
}

function preprocessAsync(base, source) {
  return new Promise(function (resolve, reject) {
    return preprocess(base, source, resolve, reject);
  });
}

// Link a program.
function linkProgram(gl, program) {
  gl.linkProgram(program);
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    throw new Error('Error linking shader ' + gl.getProgramInfoLog(program));
  }
  return true;
}

// Returns a Magic Uniform Setter
function getUniformSetter(program, info, isArray) {
  var name = info.name,
      loc = gl.getUniformLocation(program, name),
      type = info.type,
      matrix = false,
      vector = true,
      glFunction,
      typedArray;

  if (info.size > 1 && isArray) {
    switch (type) {
      case gl.FLOAT:
        glFunction = gl.uniform1fv;
        typedArray = Float32Array;
        vector = false;
        break;
      case gl.INT:case gl.BOOL:case gl.SAMPLER_2D:case gl.SAMPLER_CUBE:
        glFunction = gl.uniform1iv;
        typedArray = Uint16Array;
        vector = false;
        break;
    }
  }

  if (vector) {
    switch (type) {
      case gl.FLOAT:
        glFunction = gl.uniform1f;
        break;
      case gl.FLOAT_VEC2:
        glFunction = gl.uniform2fv;
        typedArray = isArray ? Float32Array : new Float32Array(2);
        break;
      case gl.FLOAT_VEC3:
        glFunction = gl.uniform3fv;
        typedArray = isArray ? Float32Array : new Float32Array(3);
        break;
      case gl.FLOAT_VEC4:
        glFunction = gl.uniform4fv;
        typedArray = isArray ? Float32Array : new Float32Array(4);
        break;
      case gl.INT:case gl.BOOL:case gl.SAMPLER_2D:case gl.SAMPLER_CUBE:
        glFunction = gl.uniform1i;
        break;
      case gl.INT_VEC2:case gl.BOOL_VEC2:
        glFunction = gl.uniform2iv;
        typedArray = isArray ? Uint16Array : new Uint16Array(2);
        break;
      case gl.INT_VEC3:case gl.BOOL_VEC3:
        glFunction = gl.uniform3iv;
        typedArray = isArray ? Uint16Array : new Uint16Array(3);
        break;
      case gl.INT_VEC4:case gl.BOOL_VEC4:
        glFunction = gl.uniform4iv;
        typedArray = isArray ? Uint16Array : new Uint16Array(4);
        break;
      case gl.FLOAT_MAT2:
        matrix = true;
        glFunction = gl.uniformMatrix2fv;
        break;
      case gl.FLOAT_MAT3:
        matrix = true;
        glFunction = gl.uniformMatrix3fv;
        break;
      case gl.FLOAT_MAT4:
        matrix = true;
        glFunction = gl.uniformMatrix4fv;
        break;
      default:
        break;
    }
  }

  glFunction = glFunction.bind(gl);

  // Set a uniform array
  if (isArray && typedArray) {
    return function (val) {
      glFunction(loc, new typedArray(val));
    };

    // Set a matrix uniform
  } else if (matrix) {
      return function (val) {
        glFunction(loc, false, val.toFloat32Array());
      };

      // Set a vector/typed array uniform
    } else if (typedArray) {
        return function (val) {
          typedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
          glFunction(loc, typedArray);
        };

        // Set a primitive-valued uniform
      } else {
          return function (val) {
            glFunction(loc, val);
          };
        }

  // FIXME: Unreachable code
  throw new Error('Unknown type: ' + type);
}

var Program = (function () {

  /*
   * @classdesc Handles loading of programs, mapping of attributes and uniforms
   */

  function Program(vertexShader, fragmentShader) {
    _classCallCheck(this, Program);

    var program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      throw new Error('Failed to create program');
    }

    var attributes = {};
    var attributeEnabled = {};
    var uniforms = {};
    var info = undefined;
    var name = undefined;
    var index = undefined;

    // fill attribute locations
    var len = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < len; i++) {
      info = gl.getActiveAttrib(program, i);
      name = info.name;
      index = gl.getAttribLocation(program, info.name);
      attributes[name] = index;
    }

    // create uniform setters
    len = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < len; i++) {
      info = gl.getActiveUniform(program, i);
      name = info.name;
      // if array name then clean the array brackets
      name = name[name.length - 1] === ']' ? name.substr(0, name.length - 3) : name;
      uniforms[name] = getUniformSetter(program, info, info.name != name);
    }

    this.program = program;
    // handle attributes and uniforms
    this.attributes = attributes;
    this.attributeEnabled = attributeEnabled;
    this.uniforms = uniforms;
  }

  // Get options in object or arguments

  _createClass(Program, null, [{
    key: 'getOptions',
    value: function getOptions(args) {
      var base = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var opt = undefined;
      if (args.length === 2) {
        opt = {
          vs: args[0],
          fs: args[1]
        };
      } else {
        opt = args[0] || {};
      }
      return _extends({}, base, {
        opt: opt
      });
    }

    // Create a program from vertex and fragment shader node ids
  }, {
    key: 'fromShaderIds',
    value: function fromShaderIds() {
      var opt,
          vs,
          fs,
          vectexShader,
          fragmentShader,
          program,
          args$2$0 = arguments;
      return regeneratorRuntime.async(function fromShaderIds$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            opt = getOptions(args$2$0);
            vs = $(opt.vs);
            fs = $(opt.fs);
            context$2$0.next = 5;
            return regeneratorRuntime.awrap(preprocessAsync(opt.path, vs.innerHTML));

          case 5:
            vectexShader = context$2$0.sent;
            context$2$0.next = 8;
            return regeneratorRuntime.awrap(preprocessAsync(opt.path, fs.innerHTML));

          case 8:
            fragmentShader = context$2$0.sent;
            program = new Program(vectexShader, fragmentShader, opt);

            opt.onSuccess(program);
            return context$2$0.abrupt('return', program);

          case 12:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }

    // Create a program from vs and fs sources
  }, {
    key: 'fromShaderSources',
    value: function fromShaderSources() {
      var opt,
          vectexShader,
          fragmentShader,
          program,
          args$2$0 = arguments;
      return regeneratorRuntime.async(function fromShaderSources$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            opt = getOptions(args$2$0, { path: './' });
            context$2$0.next = 3;
            return regeneratorRuntime.awrap(preprocessAsync(opt.path, opt.vs));

          case 3:
            vectexShader = context$2$0.sent;
            context$2$0.next = 6;
            return regeneratorRuntime.awrap(preprocessAsync(opt.path, opt.fs));

          case 6:
            fragmentShader = context$2$0.sent;
            context$2$0.prev = 7;
            program = new Program(vectexShader, fragmentShader);

            if (opt.onSuccess) {
              opt.onSuccess(program, opt);
            }
            return context$2$0.abrupt('return', program);

          case 13:
            context$2$0.prev = 13;
            context$2$0.t0 = context$2$0['catch'](7);

            if (!opt.onError) {
              context$2$0.next = 19;
              break;
            }

            opt.onError(errpr, opt);
            context$2$0.next = 20;
            break;

          case 19:
            throw context$2$0.t0;

          case 20:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this, [[7, 13]]);
    }

    // Build program from default shaders (requires Shaders)
  }, {
    key: 'fromDefaultShaders',
    value: function fromDefaultShaders() {
      var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var _opt = opt;
      var _opt$vs = _opt.vs;
      var vs = _opt$vs === undefined ? 'Default' : _opt$vs;
      var _opt$fs = _opt.fs;
      var fs = _opt$fs === undefined ? 'Default' : _opt$fs;

      var sh = PhiloGL.Shaders;
      opt = _extends({}, opt, {
        vs: sh.Vertex[vs],
        fs: sh.Fragment[fs]
      });
      return fromShaderSources(opt);
    }

    // Implement Program.fromShaderURIs (requires IO)
  }, {
    key: 'fromShaderURIs',
    value: function fromShaderURIs() {
      var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      opt = _extends({
        path: '',
        vs: '',
        fs: '',
        noCache: false,
        onSuccess: $.empty,
        onError: $.empty
      }, opt);

      var vertexShaderURI = opt.path + opt.vs;
      var fragmentShaderURI = opt.path + opt.fs;

      new _io.XHR.Group({
        urls: [vertexShaderURI, fragmentShaderURI],
        noCache: opt.noCache,
        onError: function onError(arg) {
          opt.onError(arg);
        },
        onComplete: function onComplete(ans) {
          try {
            var vertexShader = preprocessAsync(vertexShaderURI, ans[0]);
            var fragmentShader = preprocessAsync(fragmentShaderURI, ans[1]);
            opt = _extends({}, opt, {
              vs: vectexShader,
              fs: fragmentShader
            });
            return Program.fromShaderSources(opt);
          } catch (e) {
            opt.onError(e, opt);
          }
        }
      }).send();
    }
  }]);

  return Program;
})();

exports['default'] = Program;

Object.assign(Program.prototype, {

  $$family: 'program'

});

['setBuffer', 'setBuffers', 'use'].forEach(function (name) {
  Program.prototype[name] = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this);
    app[name].apply(app, args);
    return this;
  };
});

['setFrameBuffer', 'setFrameBuffers', 'setRenderBuffer', 'setRenderBuffers', 'setTexture', 'setTextures'].forEach(function (name) {
  Program.prototype[name] = function () {
    app[name].apply(app, arguments);
    return this;
  };
});
module.exports = exports['default'];

},{"./io":6}],21:[function(require,module,exports){
// scene.js
// Scene Object management and rendering

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _math = require('./math');

var _jqueryMini = require('./jquery-mini');

var _jqueryMini2 = _interopRequireDefault(_jqueryMini);

// Scene class

var Scene = (function () {
  function Scene(program, camera) {
    var opt = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, Scene);

    opt = _extends({
      lights: {
        enable: false,
        // ambient light
        ambient: { r: 0.2, g: 0.2, b: 0.2 },
        // directional light
        directional: {
          direction: { x: 1, y: 1, z: 1 },
          color: { r: 0, g: 0, b: 0 }
        }
        // point light
        // points: []
      },
      effects: {
        fog: false
        // { near, far, color }
      }
    }, opt);

    this.program = opt.program ? program[opt.program] : program;
    this.camera = camera;
    this.models = [];
    this.config = opt;
  }

  _createClass(Scene, [{
    key: 'add',
    value: function add() {
      for (var i = 0, models = this.models, l = arguments.length; i < l; i++) {
        var model = arguments[i];
        // Generate unique id for model
        model.id = model.id || _jqueryMini2['default'].uid();
        models.push(model);
        // Create and load Buffers
        this.defineBuffers(model);
      }
    }
  }, {
    key: 'remove',
    value: function remove(model) {
      var models = this.models;
      var indexOf = models.indexOf(model);

      if (indexOf > -1) {
        models.splice(indexOf, 1);
      }
    }
  }, {
    key: 'getProgram',
    value: function getProgram(obj) {
      var program = this.program;
      if (program.$$family !== 'program' && obj && obj.program) {
        program = program[obj.program];
        program.use();
        return program;
      }
      return program;
    }
  }, {
    key: 'defineBuffers',
    value: function defineBuffers(obj) {
      var program = this.getProgram(obj);
      var prevDynamic = obj.dynamic;
      obj.dynamic = true;
      obj.setState(program);
      obj.dynamic = prevDynamic;
      obj.unsetState(program);
    }
  }, {
    key: 'beforeRender',
    value: function beforeRender(program) {
      // Setup lighting and scene effects like fog, etc.
      this.setupLighting(program);
      this.setupEffects(program);
      if (this.camera) {
        this.camera.setStatus(program);
      }
    }

    // Setup the lighting system: ambient, directional, point lights.
  }, {
    key: 'setupLighting',
    value: function setupLighting(program) {
      // Setup Lighting
      var light = this.config.lights;
      var ambient = light.ambient;
      var directional = light.directional;
      var dcolor = directional.color;
      var dir = directional.direction;
      var enable = light.enable;
      var points = light.points && _jqueryMini2['default'].splat(light.points) || [];
      var numberPoints = points.length;
      var pointLocations = [];
      var pointColors = [];
      var enableSpecular = [];
      var pointSpecularColors = [];

      // Normalize lighting direction vector
      dir = new _math.Vec3(dir.x, dir.y, dir.z).$unit().$scale(-1);

      // Set light uniforms. Ambient and directional lights.
      program.setUniform('enableLights', enable);

      if (!enable) {
        return;
      }

      program.setUniform('ambientColor', [ambient.r, ambient.g, ambient.b]);
      program.setUniform('directionalColor', [dcolor.r, dcolor.g, dcolor.b]);
      program.setUniform('lightingDirection', [dir.x, dir.y, dir.z]);

      // Set point lights
      program.setUniform('numberPoints', numberPoints);
      for (var i = 0, l = numberPoints; i < l; i++) {
        var point = points[i];
        var position = point.position;
        var color = point.color || point.diffuse;
        var spec = point.specular;

        pointLocations.push(position.x, position.y, position.z);
        pointColors.push(color.r, color.g, color.b);

        // Add specular color
        enableSpecular.push(Number(Boolean(spec)));
        if (spec) {
          pointSpecularColors.push(spec.r, spec.g, spec.b);
        } else {
          pointSpecularColors.push(0, 0, 0);
        }
      }

      if (pointLocations.length) {
        program.setUniforms({
          'pointLocation': pointLocations,
          'pointColor': pointColors
        });
        program.setUniforms({
          'enableSpecular': enableSpecular,
          'pointSpecularColor': pointSpecularColors
        });
      }
    }

    // Setup effects like fog, etc.
  }, {
    key: 'setupEffects',
    value: function setupEffects(program) {
      var config = this.config.effects;
      var fog = config.fog;
      var color = fog.color || { r: 0.5, g: 0.5, b: 0.5 };

      if (fog) {
        program.setUniforms({
          'hasFog': true,
          'fogNear': fog.near,
          'fogFar': fog.far,
          'fogColor': [color.r, color.g, color.b]
        });
      } else {
        program.setUniform('hasFog', false);
      }
    }

    // Renders all objects in the scene.
  }, {
    key: 'render',
    value: function render() {
      var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var camera = this.camera;
      var renderProgram = opt.renderProgram;
      var pType = _jqueryMini2['default'].type(this.program);
      var multiplePrograms = !renderProgram && pType === 'object';
      var options = _extends({
        onBeforeRender: _jqueryMini2['default'].empty,
        onAfterRender: _jqueryMini2['default'].empty
      }, opt);

      // If we're just using one program then
      // execute the beforeRender method once.
      if (!multiplePrograms) {
        this.beforeRender(renderProgram || this.program);
      }

      // Go through each model and render it.
      for (var i = 0, models = this.models, l = models.length; i < l; ++i) {
        var elem = models[i];
        if (elem.display) {
          var program = renderProgram || this.getProgram(elem);
          // Setup the beforeRender method for each object
          // when there are multiple programs to be used.
          if (multiplePrograms) {
            this.beforeRender(program);
          }
          elem.onBeforeRender(program, camera);
          options.onBeforeRender(elem, i);
          this.renderObject(elem, program);
          options.onAfterRender(elem, i);
          elem.onAfterRender(program, camera);
        }
      }
    }
  }, {
    key: 'renderToTexture',
    value: function renderToTexture(name) {
      var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var texture = app.textures[name + '-texture'];
      var texMemo = app.textureMemo[name + '-texture'];
      this.render(opt);
      gl.bindTexture(texMemo.textureType, texture);
      // gl.generateMipmap(texMemo.textureType);
      // gl.bindTexture(texMemo.textureType, null);
    }
  }, {
    key: 'renderObject',
    value: function renderObject(obj, program) {
      var camera = this.camera;
      var view = camera.view;
      var projection = camera.projection;
      var object = obj.matrix;
      var world = view.mulMat4(object);
      var worldInverse = world.invert();
      var worldInverseTranspose = worldInverse.transpose();

      obj.setState(program);

      // Now set view and normal matrices
      program.setUniforms({
        objectMatrix: object,
        worldMatrix: world,
        worldInverseMatrix: worldInverse,
        worldInverseTransposeMatrix: worldInverseTranspose
        // worldViewProjection:
        //   view.mulMat4(object).$mulMat4(view.mulMat4(projection))
      });

      // Draw
      // TODO(nico): move this into O3D, but, somehow,
      // abstract the gl.draw* methods inside that object.
      if (obj.render) {
        obj.render(gl, program, camera);
      } else {
        var drawType = obj.drawType !== undefined ? gl.get(obj.drawType) : gl.TRIANGLES;
        if (obj.$indicesLength) {
          gl.drawElements(drawType, obj.$indicesLength, gl.UNSIGNED_SHORT, 0);
        } else {
          gl.drawArrays(drawType, 0, obj.$verticesLength / 3);
        }
      }

      obj.unsetState(program);
    }

    // setup picking framebuffer
  }, {
    key: 'setupPicking',
    value: function setupPicking(opt) {
      // create picking program
      var program = PhiloGL.Program.fromDefaultShaders();
      var floor = Math.floor;

      // create framebuffer
      app.setFrameBuffer('$picking', {
        width: 5,
        height: 1,
        bindToTexture: {
          parameters: [{
            name: 'TEXTURE_MAG_FILTER',
            value: 'NEAREST'
          }, {
            name: 'TEXTURE_MIN_FILTER',
            value: 'NEAREST'
          }, {
            name: 'TEXTURE_WRAP_S',
            value: 'CLAMP_TO_EDGE'
          }, {
            name: 'TEXTURE_WRAP_T',
            value: 'CLAMP_TO_EDGE'
          }]
        },
        bindToRenderBuffer: true
      });

      app.setFrameBuffer('$picking', false);
      this.pickingProgram = opt.pickingProgram || program;
    }
  }, {
    key: 'pick',
    value: function pick(x, y, opt) {
      opt = opt || {};
      // setup the picking program if this is
      // the first time we enter the method.
      if (!this.pickingProgram) {
        this.setupPicking(opt);
      }

      var o3dHash = {};
      var o3dList = [];
      var program = app.usedProgram;
      var pickingProgram = this.pickingProgram;
      var camera = this.camera;
      var oldtarget = camera.target;
      var oldaspect = camera.aspect;
      var config = this.config;
      var memoLightEnable = config.lights.enable;
      var memoFog = config.effects.fog;
      var canvas = gl.canvas;
      var viewport = opt.viewport || {};
      var pixelRatio = opt.pixelRatio || 1;
      var width = viewport.width || canvas.offsetWidth || canvas.width;
      var height = viewport.height || canvas.offsetHeight || canvas.height;
      var resWidth = 5;
      var resHeight = 1;
      var xp = x * pixelRatio - (viewport.x || 0);
      var yp = y * pixelRatio - (viewport.y || 0);
      var ndcx = xp * 2 / width - 1;
      var ndcy = 1 - yp * 2 / height;
      var target = this.unproject([ndcx, ndcy, 1.0], camera);
      var hash = [];
      var pixel = new Uint8Array(1 * 1 * 4);
      var backgroundColor = undefined,
          capture = undefined,
          pindex = undefined;

      this.camera.target = target;
      this.camera.update();
      // setup the scene for picking
      config.lights.enable = false;
      config.effects.fog = false;

      // enable picking and render to texture
      app.setFrameBuffer('$picking', true);
      pickingProgram.use();
      pickingProgram.setUniform('enablePicking', true);

      // render the scene to a texture
      gl.disable(gl.BLEND);
      gl.viewport(0, 0, resWidth, resHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // read the background color so we don't step on it
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      backgroundColor = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;

      // render picking scene
      this.renderPickingScene({
        background: backgroundColor,
        o3dHash: o3dHash,
        o3dList: o3dList,
        hash: hash
      });

      // the target point is in the center of the screen,
      // so it should be the center point.
      gl.readPixels(2, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

      var stringColor = [pixel[0], pixel[1], pixel[2]].join(),
          elem = o3dHash[stringColor],
          pick;

      // console.log('o3dHash', stringColor, x, y, width, height);

      if (!elem) {
        for (var i = 0, l = o3dList.length; i < l; i++) {
          elem = o3dList[i];
          pick = elem.pick(pixel);
          if (pick !== false) {
            elem.$pickingIndex = pick;
          } else {
            elem = false;
          }
        }
      }

      // restore all values and unbind buffers
      app.setFrameBuffer('$picking', false);
      app.setTexture('$picking-texture', false);
      pickingProgram.setUniform('enablePicking', false);
      config.lights.enable = memoLightEnable;
      config.effects.fog = memoFog;

      // restore previous program
      if (program) program.use();
      // restore the viewport size to original size
      gl.viewport(viewport.x || 0, viewport.y || 0, width, height);
      // restore camera properties
      camera.target = oldtarget;
      camera.aspect = oldaspect;
      camera.update();

      // store model hash and pixel array
      this.o3dHash = o3dHash;
      this.o3dList = o3dList;
      this.pixel = pixel;
      this.capture = capture;

      return elem && elem.pickable && elem;
    }
  }, {
    key: 'unproject',
    value: function unproject(pt, camera) {
      return camera.view.invert().mulMat4(camera.projection.invert()).mulVec3(pt);
    }
  }, {
    key: 'renderPickingScene',
    value: function renderPickingScene(opt) {
      // if set through the config, render a custom scene.
      if (this.config.renderPickingScene) {
        this.config.renderPickingScene.call(this, opt);
        return;
      }

      var pickingProgram = this.pickingProgram,
          o3dHash = opt.o3dHash,
          o3dList = opt.o3dList,
          background = opt.background,
          hash = opt.hash,
          index = 0;

      // render to texture
      this.renderToTexture('$picking', {
        renderProgram: pickingProgram,
        onBeforeRender: function onBeforeRender(elem, i) {
          if (i == background) {
            index = 1;
          }
          var suc = i + index,
              hasPickingColors = !!elem.pickingColors;

          pickingProgram.setUniform('hasPickingColors', hasPickingColors);

          if (!hasPickingColors) {
            hash[0] = suc % 256;
            hash[1] = (suc / 256 >> 0) % 256;
            hash[2] = (suc / (256 * 256) >> 0) % 256;
            pickingProgram.setUniform('pickColor', [hash[0] / 255, hash[1] / 255, hash[2] / 255]);
            o3dHash[hash.join()] = elem;
          } else {
            o3dList.push(elem);
          }
        }
      });
    }
  }]);

  return Scene;
})();

exports['default'] = Scene;

Object.assign(Scene.prototype, {
  resetPicking: _jqueryMini2['default'].empty
});

Scene.MAX_TEXTURES = 10;
Scene.MAX_POINT_LIGHTS = 4;
Scene.PICKING_RES = 4;
module.exports = exports['default'];

},{"./jquery-mini":7,"./math":9}],22:[function(require,module,exports){
// shaders.js
// Default Shaders

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Shaders = {
  Vertex: {},
  Fragment: {}
};

Shaders.Vertex.Default = "\n#define LIGHT_MAX 4\n\n// object attributes\nattribute vec3 position;\nattribute vec3 normal;\nattribute vec4 color;\nattribute vec4 pickingColor;\nattribute vec2 texCoord1;\n\n// camera and object matrices\nuniform mat4 viewMatrix;\nuniform mat4 viewInverseMatrix;\nuniform mat4 projectionMatrix;\nuniform mat4 viewProjectionMatrix;\n\n// objectMatrix * viewMatrix = worldMatrix\nuniform mat4 worldMatrix;\nuniform mat4 worldInverseMatrix;\nuniform mat4 worldInverseTransposeMatrix;\nuniform mat4 objectMatrix;\nuniform vec3 cameraPosition;\n\n// lighting configuration\nuniform bool enableLights;\nuniform vec3 ambientColor;\nuniform vec3 directionalColor;\nuniform vec3 lightingDirection;\n\n// point lights configuration\nuniform vec3 pointLocation[LIGHT_MAX];\nuniform vec3 pointColor[LIGHT_MAX];\nuniform int numberPoints;\n\n// reflection / refraction configuration\nuniform bool useReflection;\n\n// varyings\nvarying vec3 vReflection;\nvarying vec4 vColor;\nvarying vec4 vPickingColor;\nvarying vec2 vTexCoord;\nvarying vec4 vNormal;\nvarying vec3 lightWeighting;\n\nvoid main(void) {\n  vec4 mvPosition = worldMatrix * vec4(position, 1.0);\n  vec4 transformedNormal = worldInverseTransposeMatrix * vec4(normal, 1.0);\n\n  // lighting code\n  if(!enableLights) {\n    lightWeighting = vec3(1.0, 1.0, 1.0);\n  } else {\n    vec3 plightDirection;\n    vec3 pointWeight = vec3(0.0, 0.0, 0.0);\n    float directionalLightWeighting =\n      max(dot(transformedNormal.xyz, lightingDirection), 0.0);\n    for (int i = 0; i < LIGHT_MAX; i++) {\n      if (i < numberPoints) {\n        plightDirection = normalize(\n          (viewMatrix * vec4(pointLocation[i], 1.0)).xyz - mvPosition.xyz);\n         pointWeight += max(\n          dot(transformedNormal.xyz, plightDirection), 0.0) * pointColor[i];\n       } else {\n         break;\n       }\n     }\n\n    lightWeighting = ambientColor +\n      (directionalColor * directionalLightWeighting) + pointWeight;\n  }\n\n  // refraction / reflection code\n  if (useReflection) {\n    vReflection =\n      (viewInverseMatrix[3] - (worldMatrix * vec4(position, 1.0))).xyz;\n  } else {\n    vReflection = vec3(1.0, 1.0, 1.0);\n  }\n\n  // pass results to varyings\n  vColor = color;\n  vPickingColor = pickingColor;\n  vTexCoord = texCoord1;\n  vNormal = transformedNormal;\n  gl_Position = projectionMatrix * worldMatrix * vec4(position, 1.0);\n}\n";

Shaders.Fragment.Default = "\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\n// varyings\nvarying vec4 vColor;\nvarying vec4 vPickingColor;\nvarying vec2 vTexCoord;\nvarying vec3 lightWeighting;\nvarying vec3 vReflection;\nvarying vec4 vNormal;\n\n// texture configs\nuniform bool hasTexture1;\nuniform sampler2D sampler1;\nuniform bool hasTextureCube1;\nuniform samplerCube samplerCube1;\n\n// picking configs\nuniform bool enablePicking;\nuniform bool hasPickingColors;\nuniform vec3 pickColor;\n\n// reflection / refraction configs\nuniform float reflection;\nuniform float refraction;\n\n// fog configuration\nuniform bool hasFog;\nuniform vec3 fogColor;\nuniform float fogNear;\nuniform float fogFar;\n\nvoid main(){\n  // set color from texture\n  if (!hasTexture1) {\n    gl_FragColor = vec4(vColor.rgb * lightWeighting, vColor.a);\n  } else {\n    gl_FragColor =\n      vec4(texture2D(sampler1, vec2(vTexCoord.s, vTexCoord.t)).rgb *\n      lightWeighting, 1.0);\n  }\n\n  // has cube texture then apply reflection\n  if (hasTextureCube1) {\n    vec3 nReflection = normalize(vReflection);\n    vec3 reflectionValue;\n    if (refraction > 0.0) {\n     reflectionValue = refract(nReflection, vNormal.xyz, refraction);\n    } else {\n     reflectionValue = -reflect(nReflection, vNormal.xyz);\n    }\n\n    // TODO(nico): check whether this is right.\n    vec4 cubeColor = textureCube(samplerCube1,\n        vec3(-reflectionValue.x, -reflectionValue.y, reflectionValue.z));\n    gl_FragColor = vec4(mix(gl_FragColor.xyz, cubeColor.xyz, reflection), 1.0);\n  }\n\n  // set picking\n  if (enablePicking) {\n    if (hasPickingColors) {\n      gl_FragColor = vPickingColor;\n    } else {\n      gl_FragColor = vec4(pickColor, 1.0);\n    }\n  }\n\n  // handle fog\n  if (hasFog) {\n    float depth = gl_FragCoord.z / gl_FragCoord.w;\n    float fogFactor = smoothstep(fogNear, fogFar, depth);\n    gl_FragColor =\n      mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);\n   }\n }\n";

exports["default"] = Shaders;
module.exports = exports["default"];

},{}],23:[function(require,module,exports){
// webgl.js
// Checks if WebGL is enabled and creates a context for using WebGL.
/* global window */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getContext = getContext;
exports.hasWebGL = hasWebGL;
exports.hasExtension = hasExtension;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _jqueryMini = require('./jquery-mini');

var _jqueryMini2 = _interopRequireDefault(_jqueryMini);

function getContext(canvas, opt) {
  var _arguments = arguments;

  canvas = typeof canvas === 'string' ? (0, _jqueryMini2['default'])(canvas) : canvas;
  var ctx = undefined;
  ctx = canvas.getContext('experimental-webgl', opt);
  if (!ctx) {
    ctx = canvas.getContext('webgl', opt);
  }
  // Set as debug handler
  if (ctx && opt && opt.debug) {
    gl = {};
    for (var m in ctx) {
      var f = ctx[m];
      if (typeof f === 'function') {
        gl[m] = (function (k, v) {
          return function () {
            console.log(k, Array.prototype.join.call(_arguments), Array.prototype.slice.call(_arguments));
            try {
              var ans = v.apply(ctx, _arguments);
            } catch (e) {
              throw new Error(k + ' ' + e);
            }
            var errorStack = [];
            var error = undefined;
            while ((error = ctx.getError()) !== ctx.NO_ERROR) {
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

  // add a get by name param
  if (gl) {
    gl.get = function (name) {
      return typeof name == 'string' ? gl[name] : name;
    };
  }

  return gl;
}

function hasWebGL() {
  // Feature test WebGL
  try {
    var canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (error) {
    return false;
  }
}

function hasExtension(name) {
  if (!PhiloGL.hasWebGL()) {
    return false;
  }
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return context.getExtension(name);
}

},{"./jquery-mini":7}]},{},[5]);
