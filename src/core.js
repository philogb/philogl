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
import $ from './jquery-mini';
import {getContext} from './webgl';
import Camera from './camera';
import Scene from './scene';
import Application from './application';
import {loadTextures} from './io';
import Program from './program';
import Events from './event';

const DEFAULT_OPTS = {
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
  onLoad: () => {},
  onError: error => console.error(error)
};

// get Program
var popt = {
  'defaults': 'fromDefaultShaders',
  'ids': 'fromShaderIds',
  'sources': 'fromShaderSources',
  'uris': 'fromShaderURIs'
};

const globalContext = typeof window !== 'undefined' ? window : global;

// Creates a single application object asynchronously
// with a gl context, a camera, a program, a scene, and an event system.
export function PhiloGL(canvasId, opt = {}) {
  opt = {
    ...DEFAULT_OPTS,
    ...opt
  };

  const optContext = opt.context;
  const optProgram = $.splat(opt.program);

  // get Context global to all framework
  const gl = getContext(canvasId, optContext);
  globalContext.gl = gl;

  if (!gl) {
    opt.onError('The WebGL context couldn\'t be initialized');
    return null;
  }

  const programLength = optProgram.length;

  let count = programLength;
  const programs = {};
  let error = false;
  const programCallback = {
    onSuccess: (p, popt) => {
      programs[popt.id || (programLength - count)] = p;
      count--;
      if (count === 0 && !error) {
        const program = programLength === 1 ? p : programs;
        loadProgramDeps(gl, program, (app) => {
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

  optProgram.forEach((programOpts, i) => {
    let pfrom = programOpts.from;
    let program;
    for (const p in popt) {
      if (pfrom === p) {
        try {
          program = Program[popt[p]]({
            ...programCallback,
            programOpts
          });
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

async function loadProgramDeps(gl, program, opt) {
  const optCamera = opt.camera;
  const optEvents = opt.events;
  const optScene = opt.scene;
  const optTextures = opt.textures;

  // get Camera
  const canvas = gl.canvas;
  const camera = new Camera(
    optCamera.fov,
    optCamera.aspect || (canvas.width / canvas.height),
    optCamera.near,
    optCamera.far,
    optCamera);
  camera.update();

  // get Scene
  var scene = new Scene(program, camera, optScene);

  // make app instance global to all framework
  const app = new Application({
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
    Events.create(app, {
      ...optEvents,
      bind: app
    });
  }

  // load Textures
  if (optTextures.src.length) {
    const textureMap = await loadTextures(optTextures);
    app.setTextures(textureMap);
  }

  globalContext.app = app;
  return app;
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
  branch.gl = globalContext.gl;
  branch.Utils = $;
}

// TODO - read from package.json?
export const version = '1.5.2';
