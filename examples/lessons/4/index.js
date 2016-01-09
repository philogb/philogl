var webGLStart = function() {

  var pgl = PhiloGL;

  var pyramid = new pgl.O3D.Model({
    vertices: [ 0,  1,  0,
               -1, -1,  1,
                1, -1,  1,
                0,  1,  0,
                1, -1,  1,
                1, -1, -1,
                0,  1,  0,
                1, -1, -1,
               -1, -1, -1,
                0,  1,  0,
               -1, -1, -1,
               -1, -1,  1],

    colors: [1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1,
             1, 0, 0, 1,
             0, 0, 1, 1,
             0, 1, 0, 1,
             1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1,
             1, 0, 0, 1,
             0, 0, 1, 1,
             0, 1, 0, 1]
  });

  var cube = new pgl.O3D.Model({
    vertices: [-1, -1,  1,
                1, -1,  1,
                1,  1,  1,
               -1,  1,  1,

               -1, -1, -1,
               -1,  1, -1,
                1,  1, -1,
                1, -1, -1,

               -1,  1, -1,
               -1,  1,  1,
                1,  1,  1,
                1,  1, -1,

               -1, -1, -1,
                1, -1, -1,
                1, -1,  1,
               -1, -1,  1,

                1, -1, -1,
                1,  1, -1,
                1,  1,  1,
                1, -1,  1,

               -1, -1, -1,
               -1, -1,  1,
               -1,  1,  1,
               -1,  1, -1],

    colors: [1, 0, 0, 1,
             1, 0, 0, 1,
             1, 0, 0, 1,
             1, 0, 0, 1,
             1, 1, 0, 1,
             1, 1, 0, 1,
             1, 1, 0, 1,
             1, 1, 0, 1,
             0, 1, 0, 1,
             0, 1, 0, 1,
             0, 1, 0, 1,
             0, 1, 0, 1,
             1, 0.5, 0.5, 1,
             1, 0.5, 0.5, 1,
             1, 0.5, 0.5, 1,
             1, 0.5, 0.5, 1,
             1, 0, 1, 1,
             1, 0, 1, 1,
             1, 0, 1, 1,
             1, 0, 1, 1,
             0, 0, 1, 1,
             0, 0, 1, 1,
             0, 0, 1, 1,
             0, 0, 1, 1],

    indices: [0, 1, 2, 0, 2, 3,
              4, 5, 6, 4, 6, 7,
              8, 9, 10, 8, 10, 11,
              12, 13, 14, 12, 14, 15,
              16, 17, 18, 16, 18, 19,
              20, 21, 22, 20, 22, 23]
  });

  var canvas = document.getElementById('lesson04-canvas');

  var app = new pgl.Application(canvas);

  var gl = app.gl;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var program = pgl.Program.fromHTMLTemplates(app, 'shader-vs', 'shader-fs');

  program.use();

  var camera = new pgl.PerspectiveCamera({
    aspect: canvas.width/canvas.height,
  });

  var view = new pgl.Mat4;
  var rPyramid = 0;
  var rCube = 0;

  function setupElement(elem) {
    //update element matrix
    elem.update();
    //get new view matrix out of element and camera matrices
    view.mulMat42(camera.view, elem.matrix);
    //set buffers with element data
    program.setBuffers({
      'aVertexPosition': {
        value: elem.vertices,
        size: 3
      },
      'aVertexColor': {
        value: elem.colors,
        size: 4
      }
    });
    //set uniforms
    program.setUniform('uMVMatrix', view);
    program.setUniform('uPMatrix', camera.projection);
  }

  function animate() {
    rPyramid += 0.01;
    rCube += 0.01;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Draw Pyramid
    pyramid.position.set(-1.5, 0, -8);
    pyramid.rotation.set(0, rPyramid, 0);
    setupElement(pyramid);
    gl.drawArrays(gl.TRIANGLES, 0, pyramid.vertices.length / 3);

    //Draw Cube
    cube.position.set(1.5, 0, -8);
    cube.rotation.set(rCube, rCube, rCube);
    setupElement(cube);
    program.setBuffer('indices', {
      value: cube.indices,
      bufferType: gl.ELEMENT_ARRAY_BUFFER,
      size: 1
    });
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  function tick() {
    drawScene();
    animate();
    pgl.Fx.requestAnimationFrame(tick);
  }

  tick();

}
