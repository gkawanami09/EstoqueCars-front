export const smokeVertexShader = `
attribute float aLife;
attribute float aSize;
varying float vLife;

void main() {
  vLife = aLife;
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (350.0 / -viewPosition.z);
  gl_Position = projectionMatrix * viewPosition;
}
`

export const smokeFragmentShader = `
precision mediump float;
varying float vLife;
uniform float uOpacity;

void main() {
  vec2 centered = gl_PointCoord - vec2(0.5);
  float radial = length(centered) * 2.0;
  float core = smoothstep(1.0, 0.0, radial);
  float fade = smoothstep(0.0, 0.25, vLife) * smoothstep(1.0, 0.55, vLife);
  float alpha = core * fade * uOpacity;
  vec3 color = mix(vec3(0.2, 0.23, 0.28), vec3(0.72, 0.74, 0.78), vLife);
  gl_FragColor = vec4(color, alpha);
}
`
