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
import {Events} from './event';

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

// Creates a single application object asynchronously
// with a gl context, a camera, a program, a scene, and an event system.
export function PhiloGL(canvasId, opt = {}) {
  // rye: TODO- use lodash.defaultsDeep instead of $merge.
  opt = $.merge(DEFAULT_OPTS, opt);

  const optContext = opt.context;
  const optProgram = $.splat(opt.program);

  // get Context global to all framework
  const gl = getContext(canvasId, optContext);

  // get Camera
  const canvas = gl.canvas;
  const camera = new Camera(
    opt.camera.fov,
    opt.camera.aspect || (canvas.width / canvas.height),
    opt.camera.near,
    opt.camera.far,
    opt.camera);
  camera.update();

  const app = new Application({
    gl: gl,
    canvas: canvas,
    camera: camera
  });

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
        loadProgramDeps(app, program, opt, (app) => {
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

  optProgram.forEach(async (programOpts, i) => {
    programOpts.app = app;
    let pfrom = programOpts.from;
    let program;
    for (const p in popt) {
      if (pfrom === p) {
        try {
          program = await Program[popt[p]]({
            ...programCallback,
            ...programOpts
          });
        } catch (e) {
          programCallback.onError(e);
        }
        break;
      }
    }
    if (program) {
      programCallback.onSuccess(program, optProgram); // Should this be programOpts instead of optProgram?
    }
  });

}

async function loadProgramDeps(app, program, opt, callback) {

  const optEvents = opt.events;
  const optScene = opt.scene;
  const optTextures = opt.textures;
  optTextures.app = app;

  app.program = program;

  // get Scene
  var scene = new Scene(app, app.program, app.camera, optScene);

  app.scene = scene;

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

  callback(app);
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
