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
uniform vec4  font_color;

varying vec2  tc0;
varying float doffset;
varying vec2  sdf_texel;
varying float subpixel_offset;


vec3 sdf_triplet_alpha( vec3 sdf, float horz_scale, float vert_scale, float vgrad ) {
    float hdoffset = mix( doffset * horz_scale, doffset * vert_scale, vgrad );
    float rdoffset = mix( doffset, hdoffset, hint_amount );
    vec3 alpha = smoothstep( vec3( 0.5 - rdoffset ), vec3( 0.5 + rdoffset ), sdf );
    alpha = pow( alpha, vec3( 1.0 + 0.2 * vgrad * hint_amount ) );
    return alpha;
}

float sdf_alpha( float sdf, float horz_scale, float vert_scale, float vgrad ) {
    float hdoffset = mix( doffset * horz_scale, doffset * vert_scale, vgrad );
    float rdoffset = mix( doffset, hdoffset, hint_amount );
    float alpha = smoothstep( 0.5 - rdoffset, 0.5 + rdoffset, sdf );
    alpha = pow( alpha, 1.0 + 0.2 * vgrad * hint_amount );
    return alpha;
}

void main() {
    // Sampling the texture, L pattern
    float sdf       = texture2D( font_tex, tc0 ).r;
    float sdf_north = texture2D( font_tex, tc0 + vec2( 0.0, sdf_texel.y ) ).r;
    float sdf_east  = texture2D( font_tex, tc0 + vec2( sdf_texel.x, 0.0 ) ).r;

    // Estimating stroke direction by the distance field gradient vector
    vec2  sgrad     = vec2( sdf_east - sdf, sdf_north - sdf );
    float sgrad_len = max( length( sgrad ), 1.0 / 128.0 );
    vec2  grad      = sgrad / vec2( sgrad_len );
    float vgrad = abs( grad.y ); // 0.0 - vertical stroke, 1.0 - horizontal one

    if ( subpixel_amount > 0.0 ) {
        // Subpixel SDF samples
        vec2  subpixel = vec2( subpixel_offset, 0.0 );
    
        // For displays with vertical subpixel placement:
        // vec2 subpixel = vec2( 0.0, subpixel_offset );
    
        float sdf_sp_n  = texture2D( font_tex, tc0 - subpixel ).r;
        float sdf_sp_p  = texture2D( font_tex, tc0 + subpixel ).r;

        float horz_scale  = 0.5; // Should be 0.33333, a subpixel size, but that is too colorful
        float vert_scale  = 0.6;

        vec3 triplet_alpha = sdf_triplet_alpha( vec3( sdf_sp_n, sdf, sdf_sp_p ), horz_scale, vert_scale, vgrad );
    
        // For BGR subpixels:
        // triplet_alpha = triplet.bgr

        gl_FragColor = vec4( triplet_alpha, 1.0 );

    } else {
        float horz_scale  = 1.1;
        float vert_scale  = 0.6;
        
        float alpha = sdf_alpha( sdf, 1.1, 0.6, vgrad );
        gl_FragColor = vec4( font_color.rgb, font_color.a * alpha );
    }
}
`
