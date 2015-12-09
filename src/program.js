// program.js
// Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

import $ from './jquery-mini';
import {XHR} from './io';
import Shaders from './shaders';

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
    throw new Error(`Error creating shader with type ${shaderType}`);
  }
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!compiled) {
    var info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Error while compiling the shader ${info}`);
  }
  return shader;
}

// Creates a program from vertex and fragment shader sources.
function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program,
    createShader(gl, vertexShader, gl.VERTEX_SHADER));
  gl.attachShader(program,
    createShader(gl, fragmentShader, gl.FRAGMENT_SHADER));
  linkProgram(gl, program);
  return program;
}

// preprocess a source with `#include ""` support
// `duplist` records all the pending replacements
function preprocess(base, source, callback, callbackError, duplist = {}) {
  var match;
  if ((match = source.match(/#include "(.*?)"/))) {
    const url = getpath(base) + match[1];

    if (duplist[url]) {
      callbackError('Recursive include');
    }

    return new XHR({url: url, noCache: true})
    .sendAsync()
    .then(response => {
      duplist[url] = true;
      return preprocess(url, response, function(replacement) {
        delete duplist[url];
        source = source.replace(/#include ".*?"/, replacement);
        source = source.replace(
          /\sHAS_EXTENSION\s*\(\s*([A-Za-z_\-0-9]+)\s*\)/g,
          function (all, ext) {
            return gl.getExtension(ext) ? ' 1 ': ' 0 ';
          }
        );
        return preprocess(url, source, callback, callbackError, duplist);
      }, callbackError, duplist);
    })
    .catch(code => {
      callbackError(new Error(
        'Load included file `' + url + '` failed: Code ' + code));
    });
  } else {
    return callback(source);
  }
}

function preprocessAsync(base, source) {
  return new Promise(
    (resolve, reject) => preprocess(base, source, resolve, reject)
  );
}

// Link a program.
function linkProgram(gl, program) {
  gl.linkProgram(program);
  var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
    throw new Error(`Error linking shader ${gl.getProgramInfoLog(program)}`);
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
      glFunction, typedArray;

  if (info.size > 1 && isArray) {
    switch (type) {
      case gl.FLOAT:
        glFunction = gl.uniform1fv;
        typedArray = Float32Array;
        vector = false;
        break;
      case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: case gl.SAMPLER_CUBE:
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
      case gl.INT: case gl.BOOL: case gl.SAMPLER_2D: case gl.SAMPLER_CUBE:
        glFunction = gl.uniform1i;
        break;
      case gl.INT_VEC2: case gl.BOOL_VEC2:
        glFunction = gl.uniform2iv;
        typedArray = isArray ? Uint16Array : new Uint16Array(2);
        break;
      case gl.INT_VEC3: case gl.BOOL_VEC3:
        glFunction = gl.uniform3iv;
        typedArray = isArray ? Uint16Array : new Uint16Array(3);
        break;
      case gl.INT_VEC4: case gl.BOOL_VEC4:
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
    return function(val) {
      glFunction(loc, new typedArray(val));
    };

  // Set a matrix uniform
  } else if (matrix) {
    return function(val) {
      glFunction(loc, false, val.toFloat32Array());
    };

  // Set a vector/typed array uniform
  } else if (typedArray) {
    return function(val) {
      typedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
      glFunction(loc, typedArray);
    };

  // Set a primitive-valued uniform
  } else {
    return function(val) {
      glFunction(loc, val);
    };
  }

  // FIXME: Unreachable code
  throw new Error(`Unknown type: ${type}`);
}

export default class Program {

  /*
   * @classdesc Handles loading of programs, mapping of attributes and uniforms
   */
  constructor(vertexShader, fragmentShader) {
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      throw new Error('Failed to create program');
    }

    const attributes = {};
    const attributeEnabled = {};
    const uniforms = {};
    let info;
    let name;
    let index;

    // fill attribute locations
    let len = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < len; i++) {
      info = gl.getActiveAttrib(program, i);
      name = info.name;
      index = gl.getAttribLocation(program, info.name);
      attributes[name] = index;
    }

    // create uniform setters
    len = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < len; i++) {
      info = gl.getActiveUniform(program, i);
      name = info.name;
      // if array name then clean the array brackets
      name = name[name.length -1] === ']' ?
        name.substr(0, name.length -3) : name;
      uniforms[name] = getUniformSetter(program, info, info.name != name);
    }

    this.program = program;
    // handle attributes and uniforms
    this.attributes = attributes;
    this.attributeEnabled = attributeEnabled;
    this.uniforms = uniforms;
  }

  // rye: TODO- This is a temporary measure to get things working
  //            until we decide on how to manage uniforms.
  setUniform(name, value) {
    if (name in this.uniforms) {
      this.uniforms[name](value);
    }
  }

  // rye: TODO- This is a temporary measure to get things working
  //            until we decide on how to manage uniforms.
  setUniforms(forms) {
    for (let name of Object.keys(forms)) {
      if (name in this.uniforms) {
        this.uniforms[name](forms[name]);
      }
    }
  }

  // Get options in object or arguments
  static getOptions(args, base = {}) {
    let opt;
    if (args.length === 2) {
      opt = {
        vs: args[0],
        fs: args[1]
      };
    } else {
      opt = args[0] || {};
    }
    return {
      ...base,
      ...opt
    };
  }

  // Create a program from vertex and fragment shader node ids
  static async fromShaderIds() {
    const opt = Program.getOptions(arguments);
    const vs = $(opt.vs);
    const fs = $(opt.fs);
    const vectexShader = await preprocessAsync(opt.path, vs.innerHTML);
    const fragmentShader = await preprocessAsync(opt.path, fs.innerHTML);
    const program = new Program(vectexShader, fragmentShader, opt);
    opt.onSuccess(program, opt);
    return program;
  }

  // Create a program from vs and fs sources
  static async fromShaderSources() {
    var opt = Program.getOptions(arguments, {path: './'});
    const vectexShader = await preprocessAsync(opt.path, opt.vs);
    const fragmentShader = await preprocessAsync(opt.path, opt.fs);
    try {
      const program = new Program(vectexShader, fragmentShader);
      if (opt.onSuccess) {
        opt.onSuccess(program, opt);
      }
      return program;
    } catch (error) {
      if (opt.onError) {
        opt.onError(error, opt);
      } else {
        throw error;
      }
    }
  }

  // Build program from default shaders (requires Shaders)
  static fromDefaultShaders(opt = {}) {
    const {vs = 'Default', fs = 'Default'} = opt;
    const sh = Shaders;
    opt = {
      ...opt,
      vs: sh.Vertex[vs],
      fs: sh.Fragment[fs]
    };
    return Program.fromShaderSources(opt);
  }

  // Implement Program.fromShaderURIs (requires IO)
  static fromShaderURIs(opt = {}) {
    opt = {
      path: '',
      vs: '',
      fs: '',
      noCache: false,
      onSuccess: $.empty,
      onError: $.empty,
      ...opt
    };

    const vertexShaderURI = opt.path + opt.vs;
    const fragmentShaderURI = opt.path + opt.fs;

    new XHR.Group({
      urls: [vertexShaderURI, fragmentShaderURI],
      noCache: opt.noCache,
      onError(arg) {
        opt.onError(arg);
      },
      onComplete(ans) {
        try {
          const vertexShader = preprocessAsync(vertexShaderURI, ans[0]);
          const fragmentShader = preprocessAsync(fragmentShaderURI, ans[1]);
          opt = {
            ...opt,
            vs: vectexShader,
            fs: fragmentShader,
          };
          return Program.fromShaderSources(opt);
        } catch (e) {
          opt.onError(e, opt);
        }
      }
    }).send();
  }

}

Object.assign(Program.prototype, {

  $$family: 'program'

});

['setBuffer', 'setBuffers', 'use'].forEach(function(name) {
  Program.prototype[name] = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this);
    app[name].apply(app, args);
    return this;
  };
});

['setFrameBuffer', 'setFrameBuffers', 'setRenderBuffer',
 'setRenderBuffers', 'setTexture', 'setTextures'].forEach(function(name) {
  Program.prototype[name] = function() {
    app[name].apply(app, arguments);
    return this;
  };
});
