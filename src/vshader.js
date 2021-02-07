var vertCode = `
/*
 * Copyright (c) 2017 Anton Stepin astiopin@gmail.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */


attribute vec2  pos;        // Vertex position
attribute vec2  tex0;       // Tex coord
//attribute float sdf_size;   // Signed distance field size in screen pixels
attribute float scale;

uniform vec2  sdf_tex_size; // Size of font texture in pixels
uniform mat3  transform;
uniform float sdf_border_size;

varying vec2  tc0;
varying float doffset;
varying vec2  sdf_texel;
varying float subpixel_offset;

void main(void) {
    float sdf_size = 2.0 * scale * sdf_border_size;
    tc0 = tex0;
    doffset = 1.0 / sdf_size;         // Distance field delta in screen pixels
    sdf_texel = 1.0 / sdf_tex_size;
    subpixel_offset = 0.3333 / scale; // 1/3 of screen pixel to texels

    vec3 screen_pos = transform * vec3( pos, 1.0 );    
    gl_Position = vec4( screen_pos.xy, 0.0, 1.0 );
}
`
