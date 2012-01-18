#ifdef GL_ES
precision highp float;
#endif

#define PI 3.141592654
#define PI2 (3.141592654 * 2.)

#define PATTERN_DIM 128.0

uniform float offset;
uniform float rotation;
uniform vec2 scaling;
uniform vec2 resolution;
uniform float radialFactor;

uniform sampler2D sampler1;

float cubic(float x) {
  x = abs(x);
  if (x < 1.0) {
    return 1.0 - x * x * (2.0 + x);
  } else if (x < 2.0) {
    return 4.0 - x * (8.0 + x * (5.0 - x));
  } else {
    return 0.0;
  }
}

vec4 sampDirNearest(float x, float y) {
  return texture2D(sampler1, vec2(floor(mod(x, PATTERN_DIM)) / PATTERN_DIM, floor(mod(y, PATTERN_DIM)) / PATTERN_DIM));
}

vec4 sampNearest(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  return sampDirNearest(x, y);
}

vec4 sampLinear(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  float fx = x - floor(x);
  float fy = y - floor(y);
  return mix(
    mix(sampDirNearest(x, y), sampDirNearest(x + 1.0, y), fx),
    mix(sampDirNearest(x, y + 1.0), sampDirNearest(x + 1.0, y + 1.0), fx),
    fy);
}

vec4 mix4(vec4 c1, vec4 c2, vec4 c3, vec4 c4, float fr) {
  return ((((-c1+c2-c3+c4)*fr+(2.0*c1-2.0*c2+c3-c4))*fr)+(-c1+c3))*fr+c2;
}

vec4 sampCubic(float x, float y) {
  x *= PATTERN_DIM;
  y *= PATTERN_DIM;
  float fx = x - floor(x);
  float fy = y - floor(y);
  return mix4(
    mix4(sampDirNearest(x-1.0,y-1.0), sampDirNearest(x,y-1.0), sampDirNearest(x+1.0,y-1.0), sampDirNearest(x+2.0,y-1.0),fx),
    mix4(sampDirNearest(x-1.0,y),     sampDirNearest(x,y),     sampDirNearest(x+1.0,y),     sampDirNearest(x+2.0,y),    fx),
    mix4(sampDirNearest(x-1.0,y+1.0), sampDirNearest(x,y+1.0), sampDirNearest(x+1.0,y+1.0), sampDirNearest(x+2.0,y+1.0),fx),
    mix4(sampDirNearest(x-1.0,y+2.0), sampDirNearest(x,y+2.0), sampDirNearest(x+1.0,y+2.0), sampDirNearest(x+2.0,y+2.0),fx),
    fy
  );
}

vec2 resampling(float xt, float yt) {
  float heightDim = PATTERN_DIM - 2. * offset;
  float from = offset / PATTERN_DIM;
  float to = 1. - offset / PATTERN_DIM;
  float xtmod = mod(xt, PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, heightDim) / heightDim;

  if (mod(xt / PATTERN_DIM, 2.0) < 1.0) {
    if (mod(yt / heightDim, 2.0) < 1.0) {
      if (ytmod > 1. - xtmod) {
        xt = xtmod;
        yt = ytmod * (to - from) + from;
      } else {
        xt = 1. - xtmod;
        yt = (1. - ytmod) * (to - from) + from;
      }
    } else {
      if (ytmod < xtmod) {
        xt = xtmod;
        yt = (1. - ytmod) * (to - from) + from;
      } else {
        xt = 1. - xtmod;
        yt = ytmod * (to - from) + from;
      }
    }
  } else {
    if (mod(yt / heightDim, 2.0) < 1.0) {
      if (ytmod > xtmod) {
        xt = 1. - xtmod;
        yt = ytmod * (to - from) + from;
      } else {
        xt = xtmod;
        yt = (1. - ytmod) * (to - from) + from;
      }
    } else {
      if (ytmod < 1. - xtmod) {
        xt = 1. - xtmod;
        yt = (1. - ytmod) * (to - from) + from;
      } else {
        xt = xtmod;
        yt = ytmod * (to - from) + from;
      }
    }
  }

  return vec2(xt, yt);
}

void main(void) {
  vec2 pos = gl_FragCoord.xy;

  float xt =  pos.x * cos(rotation) * scaling.x + pos.y * sin(rotation) * scaling.y;
  float yt = -pos.x * sin(rotation) * scaling.x + pos.y * cos(rotation) * scaling.y;

  vec2 samp00 = resampling(xt - 0.5  / PATTERN_DIM, yt - 0.5 / PATTERN_DIM);
  vec2 samp10 = resampling(xt + 0.5  / PATTERN_DIM, yt - 0.5 / PATTERN_DIM);
  vec2 samp01 = resampling(xt - 0.5  / PATTERN_DIM, yt + 0.5 / PATTERN_DIM);
  vec2 samp11 = resampling(xt + 0.5  / PATTERN_DIM, yt + 0.5 / PATTERN_DIM);

  vec4 color00 = sampLinear(samp00.x, samp00.y);
  vec4 color10 = sampLinear(samp10.x, samp10.y);
  vec4 color01 = sampLinear(samp01.x, samp01.y);
  vec4 color11 = sampLinear(samp11.x, samp11.y);


  //add a radial blend
  vec4 colorFrom = (color00 + color10 + color01 + color11) * 0.25;
  vec4 colorTo = colorFrom * radialFactor;
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float ratio = resolution.y / resolution.x;
  vec2 center = vec2(.5, .5);

  gl_FragColor = mix(colorFrom, colorTo, distance(uv, center) / distance(vec2(1., 1.), center));
}
