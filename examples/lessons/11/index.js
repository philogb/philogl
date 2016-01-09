var webGLStart = function() {

  var $id = function(d) { return document.getElementById(d); };

  var pgl = PhiloGL;

  var pos;

  //Create moon
  var moon = new PhiloGL.O3D.Sphere({
    nlat: 30,
    nlong: 30,
    radius: 2,
    textures: 'moon.gif'
  });

  var canvas = document.getElementById('lesson11-canvas');

  var app = new pgl.Application(canvas),
      gl = app.gl;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.viewport(0, 0, +canvas.width, +canvas.height);

  var program = pgl.Program.fromDefaultShaders(app);
  program.use();

  var camera = new pgl.PerspectiveCamera({
    aspect: canvas.width/canvas.height,
    position: new pgl.Vec3(0, 0, -7),
  });

  var scene = new pgl.Scene(app, program, camera);

  pgl.Events.create(app, {
    onDragStart: function(e) {
      pos = {
        x: e.x,
        y: e.y
      };
    },
    onDragMove: function(e) {
      var z = camera.position.z,
          sign = Math.abs(z) / z;
      moon.rotation.y += -(pos.x - e.x) / 100;
      moon.rotation.x += sign * (pos.y - e.y) / 100;
      moon.update();
      pos.x = e.x;
      pos.y = e.y;
    },
    onMouseWheel: function(e) {
      e.stop();
      camera.position.z += e.wheel;
      camera.update();
    }
  });

  pgl.loadTextures(app, {
    src: ['moon.gif'],
    parameters: [{
      name: 'TEXTURE_MAG_FILTER',
      value: 'LINEAR'
    }, {
      name: 'TEXTURE_MIN_FILTER',
      value: 'LINEAR_MIPMAP_NEAREST',
      generateMipmap: true
    }]
  }).then(function() {
    var lighting = $id('lighting'),
        ambient = {
          r: $id('ambientR'),
          g: $id('ambientG'),
          b: $id('ambientB')
        },
        direction = {
          x: $id('lightDirectionX'),
          y: $id('lightDirectionY'),
          z: $id('lightDirectionZ'),

          r: $id('directionalR'),
          g: $id('directionalG'),
          b: $id('directionalB')
        };

    //Add object to the scene
    scene.add(moon);

    //Draw the scene
    function draw() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      //Setup lighting
      var lights = scene.config.lights;
      lights.enable = lighting.checked;
      lights.ambient = {
        r: +ambient.r.value,
        g: +ambient.g.value,
        b: +ambient.b.value
      };
      lights.directional = {
        color: {
          r: +direction.r.value,
          g: +direction.g.value,
          b: +direction.b.value
        },
        direction: {
          x: +direction.x.value,
          y: +direction.y.value,
          z: +direction.z.value
        }
      };
      //render moon
      scene.render();
      //request new frame
      PhiloGL.Fx.requestAnimationFrame(draw);
    }
    //Animate
    draw();
  });

}
