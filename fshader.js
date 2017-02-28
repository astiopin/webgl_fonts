var fragCode=`
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

precision mediump float;

uniform sampler2D font_tex;
uniform float hint_amount;
uniform float subpixel_amount;

uniform vec3 bg_color;
uniform vec3 font_color;

varying vec2  tc0;
varying float doffset;
varying float sdf_texel;


/*
 *  Subpixel coverage calculation
 *    
 *  v - edge slope    -1.0 to 1.0          triplet
 *  a - pixel coverage 0.0 to 1.0          coverage
 *                                       
 *      |<- glyph edge                      R  G  B
 *  +---+---+                             +--+--+--+
 *  |   |XXX| v = 1.0 (edge facing west)  |  |xx|XX|
 *  |   |XXX| a = 0.5 (50% coverage)      |  |xx|XX|
 *  |   |XXX|                             |  |xx|XX|
 *  +---+---+                             +--+--+--+
 *    pixel                                0  50 100
 *
 *
 *        R   G   B
 *         
 *   1.0        +--+   <- top (abs( v ))
 *              |  
 *       -+-----+--+-- <- ceil: 100% coverage
 *        |     |XX|     
 *   0.0  |  +--+XX|     
 *        |  |xx|XX|     
 *       -+--+--+--+-- <- floor: 0% coverage
 *           |
 *  -1.0  +--+         <-  -abs(v)
 *        |
 *        |
 *        |         
 *  -2.0  +            <- bottom: -abs(v)-1.0
 */

vec3 subpixel( float v, float a ) {
    float vt      = 0.35 * v; // 1.0 will make your eyes bleed
    vec3  rgb_max = vec3( -vt, 0.0, vt );
    float top     = abs( vt );
    float bottom  = -top - 1.0;
    float cfloor  = mix( top, bottom, a );
    vec3  res     = clamp( rgb_max - vec3( cfloor ), 0.0, 1.0 );
    return res;
}


void main() {
    // Sampling the texture, L pattern
    float sdf       = texture2D( font_tex, tc0 ).r;
    float sdf_north = texture2D( font_tex, tc0 + vec2( 0.0, sdf_texel ) ).r;
    float sdf_east  = texture2D( font_tex, tc0 + vec2( sdf_texel, 0.0 ) ).r;

    // Estimating stroke direction by the distance field gradient vector
    vec2  sgrad     = vec2( sdf_east - sdf, sdf_north - sdf );
    float sgrad_len = max( length( sgrad ), 1.0 / 128.0 );
    vec2  grad      = sgrad / vec2( sgrad_len );
    float vgrad = abs( grad.y ); // 0.0 - vertical stroke, 1.0 - horizontal one
    
    float horz_scale  = 1.1; // Blurring vertical strokes along the X axis a bit
    float vert_scale  = 0.6; // While adding some contrast to the horizontal strokes
    float hdoffset    = mix( doffset * horz_scale, doffset * vert_scale, vgrad ); 
    float res_doffset = mix( doffset, hdoffset, hint_amount );
    
    float alpha       = smoothstep( 0.5 - res_doffset, 0.5 + res_doffset, sdf );

    // Additional contrast
    alpha             = pow( alpha, 1.0 + 0.2 * vgrad * hint_amount );

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
