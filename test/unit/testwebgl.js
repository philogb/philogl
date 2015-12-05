import Program from '../../src/program';
import {getContext} from '../../src/webgl';
import test from 'tape';

test('WebGL#types', t => {
    t.ok(typeof Program === 'function');
    t.ok(typeof getContext === 'function');
    t.end();
});


