// Pixi texture info
varying vec2 vTextureCoord;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

// Tint
varying vec4 vColor;

// fwidth equivalent smoothing factor (in our case, spread * scale)
varying float vFWidth;

void main(void) {
  vec4 color;

  %forloop%

  float smoothing = vFWidth;

  // un-pre multiplying alpha
  // This _could_ be dangerous if alpha is 0 but we have a min ahead in the code
  // so if alpha is 0 we will take that 0 and be happy.
  color.rgb /= color.a;

  // MSDF
  float median = color.r + color.g + color.b -
                 min(color.r, min(color.g, color.b)) -
                 max(color.r, max(color.g, color.b));
  // SDF
  median = min(median, color.a);

  float screenPxDistance = vFWidth*(median - 0.5);
  float alpha = clamp(screenPxDistance + 0.5, 0.0, 1.0);

  gl_FragColor = vec4(vColor * alpha);
}