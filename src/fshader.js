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

var fragCode=`
precision mediump float;

uniform sampler2D font_tex;
uniform float hint_amount;
uniform float subpixel_amount;

uniform vec3 bg_color;
uniform vec3 font_color;

varying vec2  tc0;
varying float doffset;
varying float sdf_texel;


// Wrote this routine a couple years ago without a single line
// of a commentary. Seemed obvious back than. Now it looks
// like some black magic. Write comments.

vec3 subpixel( float v, float a ) {
    float av = abs( v );
    float pv = clamp(  v, 0.0, 1.0 );
    float nv = clamp( -v, 0.0, 1.0 );

    vec3 rgb_max = mix( 
        vec3( 1.0,    1.0,    1.0   ), 
        vec3( 0.333,  0.833,  0.333 ), 
        vec3( nv,     av,     pv    ) );
    
    vec3 rgb_min = mix( 
        vec3( 0.0,    0.0,    0.0   ), 
        vec3( 0.667,  0.167,  0.667 ), 
        vec3( pv,     av,     nv    ) );
    
    vec3 rgb_range  = rgb_max - rgb_min;
    vec3 rgb_cut    = clamp( vec3( a ), rgb_min, rgb_max );
    vec3 res        = ( rgb_cut - rgb_min ) / rgb_range;
    res = clamp( res, 0.0, 1.0 );
    return res;
}


void main() {
    // Sampling the texture, L pattern
    float sdf       = texture2D( font_tex, tc0 ).r;
    float sdf_north = texture2D( font_tex, tc0 + vec2( 0.0, sdf_texel ) ).r;
    float sdf_east  = texture2D( font_tex, tc0 + vec2( sdf_texel, 0.0 ) ).r;

    // Estimating stroke direction by the distance field gradient vector
    vec2  grad  = normalize( vec2( sdf_east - sdf, sdf_north - sdf ) + vec2( 1e-5 ) /* Beware the NaN */ );
    float vgrad = abs( grad.y ); // 0.0 - vertical stroke, 1.0 - horizontal one
    
    float horz_scale  = 1.1; // Blurring vertical strokes along the X axis a bit
    float vert_scale  = 0.6; // While adding some contrast to the horizontal strokes
    float hdoffset    = mix( doffset * horz_scale, doffset * vert_scale, vgrad ); 
    float res_doffset = mix( doffset, hdoffset, hint_amount );
    
    float alpha       = smoothstep( 0.5 - res_doffset, 0.5 + res_doffset, sdf );

    // Unfortunately there is no support for ARB_blend_func_extended in WebGL.
    // Fortunately the background is filled with a solid color so we can do
    // the blending inside the shader.
    
    // Discarding pixels beyond a threshold to minimise possible artifacts.
    if ( alpha < 20.0 / 256.0 ) discard;
    
    vec3 channels = subpixel( grad.x * 0.5 * subpixel_amount, alpha );

    // For subpixel rendering we have to blend each color channel separately
    vec3 res = mix( bg_color, font_color, channels );
    
    gl_FragColor = vec4( res, 1.0 );
}
`
