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
  const float w = 1.154700538379251529; // sqrt(4/3)
  const float w_2 = 0.5773502691896257; // sqrt(1/3)
  const float l = 0.3333333333;
  const float offsetX = 0.21132486540518711774542560; // (1 - sqrt(1/3))/2;

  float xtmod = mod(xt, w * PATTERN_DIM) / PATTERN_DIM;
  float ytmod = mod(yt, PATTERN_DIM) / PATTERN_DIM;

  if (mod(floor(yt / PATTERN_DIM), 2.0) < l) {
    xtmod = mod(xtmod + w_2, w);
  }

  if (xtmod > w_2) {
    if (ytmod > l && ytmod < l + l ||
      ytmod < l && ytmod > (w - xtmod) * w_2 ||
      ytmod > l + l && ytmod < 1.0 - (xtmod - w_2) * w_2
      ) {
      return vec2(xtmod - w_2 + offsetX, ytmod);
    }
  } else {
    if (ytmod > l && ytmod < l + l ||
        ytmod < l && ytmod > xtmod * w_2 ||
        ytmod > l + l && ytmod < 1.0 - (w_2 - xtmod) * w_2
        ) {
        return vec2(- xtmod * 0.5 + ytmod / w + offsetX, 1.0 - ytmod * 0.5 - xtmod / w);
      }
  }

  if (ytmod > l) {
    ytmod -= 1.0;
    xtmod = mod(xtmod + w_2, w);
  }

  return vec2(offsetX + (w - xtmod) * 0.5 - ytmod / w, 1.0 - (w - xtmod) / w - ytmod * 0.5);
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
