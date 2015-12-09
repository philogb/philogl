try {
    require('babel-polyfill');
} catch (e) {
    console.warn('Already have an instance of babel-polyfill.');
}

export * from './webgl';
export * from './core';
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
import {PhiloGL} from './core';
import * as O3D from './objects';
import * as math from './math';
import Fx from './addons/fx';
import Shaders from './shaders';
import * as IO from './io';

if (typeof window !== 'undefined') {
    window.PhiloGL = {
        PhiloGL: PhiloGL,
        O3D: O3D,
        Mat4: math.Mat4,
        Fx: Fx,
        Shaders: Shaders,
        IO: IO,
    }
}

// PhiloGL 1.X compatibility
// export O3D from './objects';
// export IO from './io';
// export Media from './media';
