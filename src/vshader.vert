attribute vec2 pos;        // Vertex position
attribute vec2 tex0;       // Tex coord
//attribute float sdf_size;   // Signed distance field size in screen pixels
attribute float scale;

uniform vec2 sdf_tex_size; // Size of font texture in pixels
uniform mat3 transform;
uniform float sdf_border_size;

varying vec2 tc0;
varying float doffset;
varying vec2 sdf_texel;
varying float subpixel_offset;

void main(void) {
    float sdf_size = 2.0 * scale * sdf_border_size;
    tc0 = tex0;
    doffset = 1.0 / sdf_size;         // Distance field delta in screen pixels
    sdf_texel = 1.0 / sdf_tex_size;
    subpixel_offset = 0.3333 / scale; // 1/3 of screen pixel to texels

    vec3 screen_pos = transform * vec3(pos, 1.0);
    gl_Position = vec4(screen_pos.xy, 0.0, 1.0);
}
