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


var vertCode = `
attribute vec2  pos;        // Vertex position
attribute vec2  tex0;       // Tex coord
attribute float sdf_size;   // Signed distance field size in screen pixels

uniform float sdf_tex_size; // Size of font texture. Assuming square image
uniform mat3  transform;

varying vec2  tc0;
varying float doffset;
varying float sdf_texel;

void main(void) {
    tc0 = tex0;
    doffset = 1.0 / sdf_size;       // Distance field delta for one screen pixel
    sdf_texel = 1.0 / sdf_tex_size;

    vec3 screen_pos = transform * vec3( pos, 1.0 );    
    gl_Position = vec4( screen_pos.xy, 0.0, 1.0 );
}
`
