// o3d.js
// Scene Objects
/* eslint-disable guard-for-in */

// Define some locals
import {Vec3, Mat4} from '../math';
import Scene from '../scene';
import $ from '../jquery-mini';

const slice = Array.prototype.slice;

function normalizeColors(arr, len) {
  if (arr && arr.length < len) {
    const a0 = arr[0];
    const a1 = arr[1];
    const a2 = arr[2];
    const a3 = arr[3];
    const ans = [a0, a1, a2, a3];
    let times = len / arr.length;
    let index;

    while (--times) {
      index = times * 4;
      ans[index + 0] = a0;
      ans[index + 1] = a1;
      ans[index + 2] = a2;
      ans[index + 3] = a3;
    }

    return new Float32Array(ans);
  }
  return arr;
}

// Model repository
// map attribute names to property names
// TODO(nico): textures are treated separately.
/*
const attributeMap = {
  'position': 'vertices',
  'normal': 'normals',
  'pickingColor': 'pickingColors',
  'colors': 'color'
};
*/

// Model abstract O3D Class
export default class Model {

  /* eslint-disable max-statements  */
  /* eslint-disable complexity  */
  constructor(opt = {}) {
    this.id = opt.id || $.uid();
    // picking options
    this.pickable = Boolean(opt.pickable);
    this.pick = opt.pick || () => false;

    this.vertices = opt.vertices;
    this.normals = opt.normals;
    this.textures = opt.textures && $.splat(opt.textures);
    this.colors = opt.colors;
    this.indices = opt.indices;
    this.shininess = opt.shininess || 0;
    this.reflection = opt.reflection || 0;
    this.refraction = opt.refraction || 0;

    if (opt.pickingColors) {
      this.pickingColors = opt.pickingColors;
    }

    if (opt.texCoords) {
      this.texCoords = opt.texCoords;
    }

    // extra uniforms
    this.uniforms = opt.uniforms || {};
    // extra attribute descriptors
    this.attributes = opt.attributes || {};
    // override the render method
    this.render = opt.render;
    // whether to render as triangles, lines, points, etc.
    this.drawType = opt.hasOwnProperty('drawType') ? opt.drawType : 'TRIANGLES';
    // whether to display the object at all
    this.display = 'display' in opt ? opt.display : true;
    // before and after render callbacks
    this.onBeforeRender = opt.onBeforeRender || $.empty;
    this.onAfterRender = opt.onAfterRender || $.empty;
    // set a custom program per o3d
    if (opt.program) {
      this.program = opt.program;
    }
    // model position, rotation, scale and all in all matrix
    this.position = new Vec3();
    this.rotation = new Vec3();
    this.scale = new Vec3(1, 1, 1);
    this.matrix = new Mat4();

    if (opt.computeCentroids) {
      this.computeCentroids();
    }

    if (opt.computeNormals) {
      this.computeNormals();
    }
  }
  /* eslint-enable max-statements */
  /* eslint-enable complexity */

  // ensure known attributes use typed arrays

  get hash() {
    return this.id + ' ' + this.$pickingIndex;
  }

  set vertices(val) {
    if (!val) {
      delete this.$vertices;
      delete this.$verticesLength;
      return;
    }
    var vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$vertices = val;
    } else if (this.$verticesLength === vlen) {
      this.$vertices.set(val);
    } else {
      this.$vertices = new Float32Array(val);
    }
    this.$verticesLength = vlen;
  }

  get vertices() {
    return this.$vertices;
  }

  set normals(val) {
    if (!val) {
      delete this.$normals;
      delete this.$normalsLength;
      return;
    }
    var vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$normals = val;
    } else if (this.$normalsLength === vlen) {
      this.$normals.set(val);
    } else {
      this.$normals = new Float32Array(val);
    }
    this.$normalsLength = vlen;
  }

  get normals() {
    return this.$normals;
  }

  set colors(val) {
    if (!val) {
      delete this.$colors;
      delete this.$colorsLength;
      return;
    }
    var vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$colors = val;
    } else if (this.$colorsLength === vlen) {
      this.$colors.set(val);
    } else {
      this.$colors = new Float32Array(val);
    }
    if (this.$vertices && this.$verticesLength / 3 * 4 !== vlen) {
      this.$colors =
        normalizeColors(slice.call(this.$colors), this.$verticesLength / 3 * 4);
    }
    this.$colorsLength = this.$colors.length;
  }

  get colors() {
    return this.$colors;
  }

  set pickingColors(val) {
    if (!val) {
      delete this.$pickingColors;
      delete this.$pickingColorsLength;
      return;
    }
    var vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$pickingColors = val;
    } else if (this.$pickingColorsLength === vlen) {
      this.$pickingColors.set(val);
    } else {
      this.$pickingColors = new Float32Array(val);
    }
    if (this.$vertices && this.$verticesLength / 3 * 4 !== vlen) {
      this.$pickingColors = normalizeColors(
        slice.call(this.$pickingColors), this.$verticesLength / 3 * 4);
    }
    this.$pickingColorsLength = this.$pickingColors.length;
  }

  get pickingColors() {
    return this.$pickingColors;
  }

  set texCoords(val) {
    if (!val) {
      delete this.$texCoords;
      delete this.$texCoordsLength;
      return;
    }
    if ($.type(val) === 'object') {
      var ans = {};
      for (var prop in val) {
        var texCoordArray = val[prop];
        ans[prop] = texCoordArray.BYTES_PER_ELEMENT ?
          texCoordArray : new Float32Array(texCoordArray);
      }
      this.$texCoords = ans;
    } else {
      var vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$texCoords = val;
      } else if (this.$texCoordsLength === vlen) {
        this.$texCoords.set(val);
      } else {
        this.$texCoords = new Float32Array(val);
      }
      this.$texCoordsLength = vlen;
    }
  }

  get texCoords() {
    return this.$texCoords;
  }

  set indices(val) {
    if (!val) {
      delete this.$indices;
      delete this.$indicesLength;
      return;
    }
    var vlen = val.length;
    if (val.BYTES_PER_ELEMENT) {
      this.$indices = val;
    } else if (this.$indicesLength === vlen) {
      this.$indices.set(val);
    } else {
      this.$indices = new Uint16Array(val);
    }
    this.$indicesLength = vlen;
  }

  get indices() {
    return this.$indices;
  }

  update() {
    const pos = this.position;
    const rot = this.rotation;
    const scale = this.scale;

    this.matrix.id();
    this.matrix.$translate(pos.x, pos.y, pos.z);
    this.matrix.$rotateXYZ(rot.x, rot.y, rot.z);
    this.matrix.$scale(scale.x, scale.y, scale.z);
  }

  computeCentroids() {
    const faces = this.faces;
    const vertices = this.vertices;
    const centroids = [];

    faces.forEach(face => {
      const centroid = [0, 0, 0];
      let acum = 0;

      face.forEach(idx => {
        const vertex = vertices[idx];
        centroid[0] += vertex[0];
        centroid[1] += vertex[1];
        centroid[2] += vertex[2];
        acum++;
      });

      centroid[0] /= acum;
      centroid[1] /= acum;
      centroid[2] /= acum;

      centroids.push(centroid);
    });

    this.centroids = centroids;
  }

  computeNormals() {
    const faces = this.faces;
    const vertices = this.vertices;
    const normals = [];

    faces.forEach(face => {
      const v1 = vertices[face[0]];
      const v2 = vertices[face[1]];
      const v3 = vertices[face[2]];
      const dir1 = {
        x: v3[0] - v2[0],
        y: v3[1] - v2[1],
        z: v3[1] - v2[2]
      };
      const dir2 = {
        x: v1[0] - v2[0],
        y: v1[1] - v2[1],
        z: v1[2] - v2[2]
      };

      Vec3.$cross(dir2, dir1);

      if (Vec3.norm(dir2) > 1e-6) {
        Vec3.unit(dir2);
      }

      normals.push([dir2.x, dir2.y, dir2.z]);
    });

    this.normals = normals;
  }

  setUniforms(program) {
    program.setUniforms(this.uniforms);
  }

  setAttributes(program) {
    const attributes = this.attributes;
    for (const name in attributes) {
      const descriptor = attributes[name];
      const bufferId = this.id + '-' + name;
      if (!Object.keys(descriptor).length) {
        program.setBuffer(bufferId, true);
      } else {
        descriptor.attribute = name;
        program.setBuffer(bufferId, descriptor);
        delete descriptor.value;
      }
    }
  }

  setVertices(program) {
    if (!this.$vertices) {
      return;
    }

    if (this.dynamic) {
      program.setBuffer('position-' + this.id, {
        attribute: 'position',
        value: this.$vertices,
        size: 3
      });
    } else {
      program.setBuffer('position-' + this.id);
    }
  }

  setNormals(program) {
    if (!this.$normals) {
      return;
    }

    if (this.dynamic) {
      program.setBuffer('normal-' + this.id, {
        attribute: 'normal',
        value: this.$normals,
        size: 3
      });
    } else {
      program.setBuffer('normal-' + this.id);
    }
  }

  setIndices(program) {
    const gl = program.app.gl;
    if (!this.$indices) {
      return;
    }

    if (this.dynamic) {
      program.setBuffer('indices-' + this.id, {
        bufferType: gl.ELEMENT_ARRAY_BUFFER,
        drawType: gl.STATIC_DRAW,
        value: this.$indices,
        size: 1
      });
    } else {
      program.setBuffer('indices-' + this.id);
    }
  }

  setPickingColors(program) {
    if (!this.$pickingColors) {
      return;
    }

    if (this.dynamic) {
      program.setBuffer('pickingColor-' + this.id, {
        attribute: 'pickingColor',
        value: this.$pickingColors,
        size: 4
      });
    } else {
      program.setBuffer('pickingColor-' + this.id);
    }
  }

  setColors(program) {
    if (!this.$colors) {
      return;
    }

    if (this.dynamic) {
      program.setBuffer('color-' + this.id, {
        attribute: 'color',
        value: this.$colors,
        size: 4
      });
    } else {
      program.setBuffer('color-' + this.id);
    }
  }

  setTexCoords(program) {
    if (!this.$texCoords) {
      return;
    }

    const id = this.id;
    let i;
    let txs;
    let l;
    let tex;

    if (this.dynamic) {
      // If is an object containing textureName -> textureCoordArray
      // Set all textures, samplers and textureCoords.
      if ($.type(this.$texCoords) === 'object') {
        for (i = 0, txs = this.textures, l = txs.length; i < l; i++) {
          tex = txs[i];
          program.setBuffer('texCoord-' + i + '-' + id, {
            attribute: 'texCoord' + (i + 1),
            value: this.$texCoords[tex],
            size: 2
          });
        }
      // An array of textureCoordinates
      } else {
        program.setBuffer('texCoord-' + id, {
          attribute: 'texCoord1',
          value: this.$texCoords,
          size: 2
        });
      }
    } else if ($.type(this.$texCoords) === 'object') {
      for (i = 0, txs = this.textures, l = txs.length; i < l; i++) {
        program.setBuffer('texCoord-' + i + '-' + id);
      }
    } else {
      program.setBuffer('texCoord-' + id);
    }
  }

  setTextures(program, force) {
    const app = program.app;
    const gl = app.gl;
    this.textures = this.textures ? $.splat(this.textures) : [];
    let tex2D = 0;
    let texCube = 0;
    const mtexs = Scene.MAX_TEXTURES;
    for (let i = 0, texs = this.textures, l = texs.length; i < mtexs; i++) {
      if (i < l) {
        const isCube = app.textureMemo[texs[i]].isCube;
        if (isCube) {
          program.setUniform('hasTextureCube' + (i + 1), true);
          program.setTexture(texs[i], gl['TEXTURE' + i]);
          program.setUniform('samplerCube' + (texCube + 1), i);
          texCube++;
        } else {
          program.setUniform('hasTexture' + (i + 1), true);
          program.setTexture(texs[i], gl['TEXTURE' + i]);
          program.setUniform('sampler' + (tex2D + 1), i);
          tex2D++;
        }
      } else {
        program.setUniform('hasTextureCube' + (i + 1), false);
        program.setUniform('hasTexture' + (i + 1), false);
        program.setUniform('sampler' + (++tex2D), i);
        program.setUniform('samplerCube' + (++texCube), i);
      }
    }
  }

  setState(program) {
    this.setUniforms(program);
    this.setAttributes(program);
    this.setVertices(program);
    this.setColors(program);
    this.setPickingColors(program);
    this.setNormals(program);
    this.setTextures(program);
    this.setTexCoords(program);
    this.setIndices(program);
  }

  unsetState(program) {
    const gl = program.app.gl;
    var attributes = program.attributes;

    // unbind the array and element buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    for (var name in attributes) {
      gl.disableVertexAttribArray(attributes[name]);
    }

  }
}
