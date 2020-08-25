// Nick Hinds and Jason Moon
// texture-transparency
// 4-7-20

precision mediump float;

uniform sampler2D uTexture;
uniform sampler2D uTextureBonus;
uniform float uAlpha;
uniform float uTime;

varying vec2 textureCoords;

void main(void) {
    // gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
    // gl_FragColor = vec4(textureCoords, 0.0, 1.0);
    // Bonus todo #1&2
    vec4 color0 = texture2D(uTexture, textureCoords+(cos(uTime)/(3.14159265359)/1.5));
    vec4 color1 = texture2D(uTextureBonus, textureCoords+(cos(uTime)/(3.14159265359)/1.5));
    gl_FragColor = color0 * color1;
	gl_FragColor.a = uAlpha;
}
