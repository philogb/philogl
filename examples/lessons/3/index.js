
window.webGLStart = function() {

  var Application = PhiloGL.Application;
  var Program = PhiloGL.Program;
  var PerspectiveCamera = PhiloGL.PerspectiveCamera;
  var O3D = PhiloGL.O3D;
  var Mat4 = PhiloGL.Mat4;
  var Fx = PhiloGL.Fx;

  var triangle = new O3D.Model({
    vertices: [ 0,  1, 0,
               -1, -1, 0,
                1, -1, 0],

    colors: [1, 0, 0, 1,
             0, 1, 0, 1,
             0, 0, 1, 1]
  });

  var square = new O3D.Model({
    vertices: [ 1,  1, 0,
               -1,  1, 0,
                1, -1, 0,
               -1, -1, 0],

    colors: [0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1,
             0.5, 0.5, 1, 1]
  });

  var canvas = document.getElementById('lesson03-canvas');

  var app = new Application(canvas);

  var gl = app.gl;

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  var program = Program.fromHTMLTemplates(app, 'shader-vs', 'shader-fs');

  program.use();

  var camera = new PerspectiveCamera({
    aspect: canvas.width/canvas.height,
  });

  var view = new Mat4();
  var rTri = 0.0;
  var rSquare = 0.0;

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
    rTri += 0.01;
    rSquare += 0.1;
  }

  function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Draw triangle
    triangle.position.set(-1.5, 0, -7);
    triangle.rotation.set(0, rTri, 0);
    setupElement(triangle);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    //Draw Square
    square.position.set(1.5, 0, -7);
    square.rotation.set(rSquare, 0, 0);
    setupElement(square);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function tick() {
    drawScene();
    animate();
    Fx.requestAnimationFrame(tick);
  }

  tick();

}
