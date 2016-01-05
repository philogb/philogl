/* global window, document, PhiloGL */

window.webGLStart = function() {

  // ES5 replacement of
  //  import {Program, Camera, createGLContext} = PhiloGL;
  var Program = PhiloGL.Program;
  var Camera = PhiloGL.Camera;
  var createGLContext = PhiloGL.createGLContext;

  var canvas = document.getElementById('lesson01-canvas');

  // Change the 
  var gl = createGLContext(canvas, {
    onError: function(e) {
      alert("An error ocurred while loading the application");
      console.log(e);
    }
  });

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Note: Does not need to be async as currently implemented...
  // Only versions that use XMLHttpRequests need to be async
  var program = Program.fromHTMLTemplates({
      vs: 'shader-vs',
      fs: 'shader-fs'
  });
  // Could also be implementd as new Program({'ids', ...})

  program.setBuffers({
    'triangle': {
      attribute: 'aVertexPosition',
      value: new Float32Array([0, 1, 0, -1, -1, 0, 1, -1, 0]),
      size: 3
    },

    'square': {
      attribute: 'aVertexPosition',
      value: new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0]),
      size: 3
    }
  });

  // TODO - check that default parameters are supported and correspond
  //  to how PhiloGL would normally create the camera...
  var camera = new Camera();
  // TODO - this should not be necessary for a new camera?
  camera.view.id();

  // Draw Triangle
  camera.view.$translate(-1.5, 0, -7);
  program.setUniform('uMVMatrix', camera.view);
  program.setUniform('uPMatrix', camera.projection);
  program.setBuffer('triangle');
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // Draw Square
  camera.view.$translate(3, 0, 0);
  program.setUniform('uMVMatrix', camera.view);
  program.setUniform('uPMatrix', camera.projection);
  program.setBuffer('square');
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

};
