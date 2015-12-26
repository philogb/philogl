// core.js
// Provides general utility methods, module unpacking methods
// and the PhiloGL app creation method.
/* eslint-disable no-new */
/* eslint-disable no-try-catch */
/* eslint-disable callback-return */
/* eslint-disable no-console */
/* global console */
import {getContext} from './webgl';
import Camera from './camera';
import Scene from './scene';
import Application from './application';
import {loadTextures} from './io';
import Program from './program';
import {Events} from './event';

import $ from './jquery-mini';
import assert from 'assert';
/* global globalContext */

const SUB_MODULES = [
  'Vec3', 'Mat4', 'Quat', 'Camera', 'Program', 'WebGL', 'O3D',
  'Scene', 'Shaders', 'IO', 'Events', 'WorkerGroup', 'Fx', 'Media'
];

const DEFAULT_OPTS = {
  // debug: true
  context: {},
  camera: {fov: 45, near: 0.1, far: 500},
  // from: (defaults|ids|sources|uris)
  program: {from: 'defaults', vs: 'Default', fs: 'Default'},
     // All the scene.js options: lights: { ... }
  scene: {},
  textures: {src: []},
   // All the events.js options: onClick: fn, onTouchStart: fn...
  events: {},
  onLoad: () => {},
  onError: error => console.error(error)
};

// get Program
var PROGRAM_CONSTRUCTORS = {
  'defaults': 'fromDefaultShaders',
  'ids': 'fromShaderIds',
  'sources': 'fromShaderSources',
  'uris': 'fromShaderURIs'
};

// Creates a single application object asynchronously
// with a gl context, a camera, a program, a scene, and an event system.
export async function PhiloGL(canvasId, opt = {}) {
  // ** We can't merge DEFAULT_OPTS and opt in this way; it's not a
  // deep merge. For example, if opt.camera doesn't define fov, then
  // the result won't have camera.fov defined. **
  // opt = {...DEFAULT_OPTS, ...opt};

  // rye: TODO- use lodash.defaultsDeep instead of $merge.
  opt = $.merge(DEFAULT_OPTS, opt);

  const {
    context: contextOpts,
    scene: sceneOpts,
    camera: cameraOpts,
    program = []
  } = opt;
  const optProgram = Array.isArray(program) ? program : [program];

  // get Context global to all framework
  const gl = getContext(canvasId, contextOpts);
  if (!gl) {
    opt.onError('The WebGL context could not be initialized');
    return null;
  }

  // get Camera
  const canvas = gl.canvas;

  const camera = new Camera(
    cameraOpts.fov,
    cameraOpts.aspect || (canvas.width / canvas.height),
    cameraOpts.near,
    cameraOpts.far,
    cameraOpts
  );
  camera.update();

  // Create app
  const app = new Application({
    gl: gl,
    canvas: canvas,
    camera: camera
  });

  let programs = await loadPrograms(app, optProgram);
  programs = programs.length === 1 ? programs[0] : programs;
  await loadProgramDeps(app, programs, opt);

  // Create a default Scene
  app.scene = new Scene(app, app.program, app.camera, sceneOpts);

  // Deprecated, as PhiloGL now returns a promise
  opt.onLoad(app);

  return app;
}

async function loadPrograms(app, programDescriptors) {
  const programPromises = programDescriptors.map(async (programOpts, i) => {
    const asyncProgramConstructor = programOpts.from;
    assert(asyncProgramConstructor in PROGRAM_CONSTRUCTORS);
    const program = await Program[PROGRAM_CONSTRUCTORS[asyncProgramConstructor]]({
      ...programOpts,
      app: app
    });
    return program;
  });
  return await Promise.all(programPromises);
}

async function loadProgramDeps(app, program, opt) {

  const optEvents = opt.events;
  const optTextures = opt.textures;
  optTextures.app = app;

  app.program = program;

  // Use program
  if (program instanceof Program) {
    program.use();
  }

  // get Events
  if (optEvents) {
    Events.create(app, {...optEvents, bind: app});
  }

  // load Textures
  if (optTextures.src.length) {
    await loadTextures(optTextures);
  }
}

// Unpacks the submodules to the global space.
// @deprecated - mainly for examples
export function unpack(branch) {
  branch = branch || globalContext;
  SUB_MODULES.forEach(module => {
    branch[module] = PhiloGL[module];
  });
  branch.gl = globalContext.gl;
  branch.Utils = $;
}

// TODO - read from package.json?
export const version = '1.5.2';
