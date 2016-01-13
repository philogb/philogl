// rye: TODO- Research browserify --standalone esp. wrt babel.
//            Can we create the two import paths this way and
//            get rid of the babel-polyfill try/catch below?

try {
    // TODO: do we really need this? I tried without it and
    // lesson 1, at least, worked fine.
    require('babel-polyfill');
} catch (e) {
    console.warn('Already have an instance of babel-polyfill.');
}

export * from './webgl';
export * from './math';
export {default as Event} from './event';
export {default as Program} from './program';
export * from './io';
export {default as Camera} from './camera';
export * from './objects';
export {default as Shaders} from './shaders';
export {default as Scene} from './scene';
export * from './media';

// rye: TODO- Need to clean up the discrepancies between
//            the browserify imports and the <script> imports.
//      TODO- Create separate build paths for the
//            browserify/<script> imports.
import Scene from './scene';
import {hasWebGL, createGLContext} from './webgl';
import * as O3D from './objects';
import * as math from './math';
import Fx from './addons/fx';
import WorkerGroup from './addons/workers';
import Shaders from './shaders';
import * as IO from './io';
import {PerspectiveCamera, OrthoCamera} from './camera';
import Img from './media';
import Program from './program';
import Application from './application';
import {loadTextures} from './io';
import {Events} from './event';
import Buffer from './buffer';

if (typeof window !== 'undefined') {
    window.PhiloGL = {
        Buffer: Buffer,
        Events: Events,
        O3D: O3D,
        Mat4: math.Mat4,
        Vec3: math.Vec3,
        Fx: Fx,
        Shaders: Shaders,
        IO: IO,
        PerspectiveCamera: PerspectiveCamera,
        OrthoCamera: OrthoCamera,
        Scene: Scene,
        hasWebGL: hasWebGL,
        createGLContext: createGLContext,
        loadTextures: loadTextures,
        WorkerGroup: WorkerGroup,
        Program: Program,
        Application: Application,
        Media: {
            Image: Img,
        },
    };
}

// PhiloGL 1.X compatibility
// export O3D from './objects';
// export IO from './io';
// export Media from './media';
