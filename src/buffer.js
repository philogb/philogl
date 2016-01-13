
import $ from './jquery-mini';

export default class Buffer {

  constructor(gl, opt = {}) {
    this.gl = gl;

    // Set some defaults.
    opt = $.extend({
      bufferType: gl.ARRAY_BUFFER,
      size: 1,
      dataType: gl.FLOAT,
      stride: 0,
      offset: 0,
      drawType: gl.STATIC_DRAW,
      instanced: 0
    }, opt);
    this.data = opt.data;
    this.attribute = opt.attribute;
    this.bufferType = opt.bufferType;
    this.size = opt.size,
    this.dataType = opt.dataType;
    this.stride = opt.stride;
    this.offset = opt.offset;
    this.drawType = opt.drawType;
    this.instanced = opt.instanced;

    // Create and fill the buffer.
    this.buffer = gl.createBuffer();
    if (this.data !== undefined) {
      gl.bindBuffer(opt.bufferType, this.buffer);
      gl.bufferData(opt.bufferType, this.data, opt.drawType);
      gl.bindBuffer(opt.bufferType, null);
    }

  }

}
