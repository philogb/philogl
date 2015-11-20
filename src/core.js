// core.js
// Provides general utility methods, module unpacking methods
// and the PhiloGL app creation method.
import $ from './jquery-mini';
import {getContext} from './webgl';
import Camera from './camera';
import Scene from './scene';
import Application from './application';
import IO from './io';
import Program from './program';

// Holds the 3D context, holds the application
var gl, app, globalContext = this;

// Creates a single application object asynchronously
// with a gl context, a camera, a program, a scene, and an event system.
export function PhiloGL(canvasId, opt = {}) {
  opt = {
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
    onLoad: $.empty,
    onError: $.empty,
    ...opt
  };

  const optContext = opt.context;
  const optCamera = opt.camera;
  const optEvents = opt.events;
  const optTextures = opt.textures;
  const optProgram = $.splat(opt.program);
  const optScene = opt.scene;

  // get Context global to all framework
  gl = getContext(canvasId, optContext);

  if (!gl) {
    opt.onError('The WebGL context couldn\'t been initialized');
    return null;
  }

  // get Program
  var popt = {
    'defaults': 'fromDefaultShaders',
    'ids': 'fromShaderIds',
    'sources': 'fromShaderSources',
    'uris': 'fromShaderURIs'
  };

  const programLength = optProgram.length;

  const programCallback = (() => {
    let count = programLength;
    const programs = {};
    let error = false;
    return {
      onSuccess: (p, popt) => {
        programs[popt.id || (programLength - count)] = p;
        count--;
        if (count === 0 && !error) {
          loadProgramDeps(gl, programLength === 1? p : programs, (app) => {
            opt.onLoad(app);
          });
        }
      },
      onError: (p) => {
        count--;
        opt.onError(p);
        error = true;
      }
    };
  })();

  optProgram.forEach((optProgram, i) => {
    let pfrom = optProgram.from, program;
    for (const p in popt) {
      if (pfrom === p) {
        try {
          program = Program[popt[p]]($.extend(programCallback, optProgram));
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

  function loadProgramDeps(gl, program, callback) {
    // get Camera
    const canvas = gl.canvas;
    const camera = new Camera(
      optCamera.fov,
      optCamera.aspect || (canvas.width / canvas.height),
      optCamera.near,
      optCamera.far, optCamera);
    camera.update();

    // get Scene
    var scene = new Scene(program, camera, optScene);

    // make app instance global to all framework
    app = new Application({
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
      Events.create(app, $.extend(optEvents, {
        bind: app
      }));
    }

    // load Textures
    if (optTextures.src.length) {
      new IO.Textures($.extend(optTextures, {
        onComplete: () => {
          callback(app);
        }
      }));
    } else {
      callback(app);
    }
  }
}

// Unpacks the submodules to the global space.
export function unpack(branch) {
  branch = branch || globalContext;
  [
    'Vec3', 'Mat4', 'Quat', 'Camera', 'Program', 'WebGL', 'O3D',
    'Scene', 'Shaders', 'IO', 'Events', 'WorkerGroup', 'Fx', 'Media'
  ].forEach(module => {
    branch[module] = PhiloGL[module];
  });
  branch.gl = gl;
  branch.Utils = $;
}

export const version = '1.5.2';
