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
export {Model} from './objects/model';
export {Cone} from './objects/cone';
export {Cube} from './objects/cube';
export {Cylinder} from './objects/cylinder';
export {IcoSphere} from './objects/ico-sphere';
export {Plane} from './objects/plane';
export {Sphere} from './objects/sphere';
export {TruncatedCone} from './objects/cone';
export {default as Shaders} from './shaders';
export {default as Scene} from './scene';
export * from './media';

// rye: TODO- Need to clean up the discrepancies between
//            the browserify imports and the <script> imports.
//      TODO- Create separate build paths for the
//            browserify/<script> imports.
import Scene from './scene';
import {hasWebGL, createGLContext} from './webgl';
import * as math from './math';
import Fx from './addons/fx';
import WorkerGroup from './addons/workers';
import Shaders from './shaders';
import * as IO from './io';
import {PerspectiveCamera, OrthoCamera} from './camera';
import Img from './media';
import Program from './program';
import {loadTextures} from './io';
import {Events} from './event';
import Buffer from './buffer';
import {Texture2D, TextureCube} from './texture';
import Framebuffer from './fbo';
import Model from './objects/model';
import Cone from './objects/cone';
import Cube from './objects/cube';
import Cylinder from './objects/cylinder';
import IcoSphere from './objects/ico-sphere';
import Plane from './objects/plane';
import Sphere from './objects/sphere';
import TruncatedCone from './objects/cone';

if (typeof window !== 'undefined') {
    window.PhiloGL = {
        Model: Model,
        Cone: Cone,
        Cube: Cube,
        Cylinder: Cylinder,
        IcoSphere: IcoSphere,
        Plane: Plane,
        Sphere: Sphere,
        TruncatedCone: TruncatedCone,
        Framebuffer: Framebuffer,
        Texture2D: Texture2D,
        TextureCube: TextureCube,
        Buffer: Buffer,
        Events: Events,
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
        Media: {
            Image: Img,
        },
    };
}
