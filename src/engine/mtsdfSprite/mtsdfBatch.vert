precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;
attribute float aFWidth;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec4 tint;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
varying float vFWidth;

void main(void) {
  gl_Position = vec4(
      (projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy,
      0.0, 1.0);

  vTextureCoord = aTextureCoord;
  vTextureId = aTextureId;
  vFWidth = aFWidth;
  vColor = aColor * tint;
}