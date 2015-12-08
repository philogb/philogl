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

import {PhiloGL} from './core';
import * as O3D from './objects';
import * as math from './math';
import Fx from './addons/fx';

if (typeof window !== 'undefined') {
    window.PhiloGL = {
        PhiloGL: PhiloGL,
        O3D: O3D,
        Mat4: math.Mat4,
        Fx: Fx,
    }
}

// PhiloGL 1.X compatibility
// export O3D from './objects';
// export IO from './io';
// export Media from './media';
