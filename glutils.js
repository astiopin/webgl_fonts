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


function createProgram( gl, vertex, fragment, attribs ) {
    var vshader = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource( vshader, vertex );
    gl.compileShader( vshader );

    var vok = gl.getShaderParameter( vshader, gl.COMPILE_STATUS );
;    
    if ( !vok ) {
        throw "unable to compile vertex shader:" + gl.getShaderInfoLog( vshader );
    }

    var fshader = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource( fshader, fragment );
    gl.compileShader( fshader );

    var fok = gl.getShaderParameter( fshader, gl.COMPILE_STATUS );
    if ( !fok ) {
        throw "unable to compile fragment shader:" + gl.getShaderInfoLog( fshader );
    }

    var program = gl.createProgram();

    for ( var i = 0; i < attribs.length; ++i ) {
        var a = attribs[ i ];
        gl.bindAttribLocation( program, a.loc, a.name );
    }

    gl.attachShader( program, vshader );
    gl.attachShader( program, fshader );

    gl.linkProgram( program );

    var pok = gl.getProgramParameter( program, gl.LINK_STATUS );
    if ( !pok ) {
        throw "unable to link program: " + gl.getProgramInfoLog( program );
    }

    var unf_length = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS );

    var res = { id : program, uniforms : [] };
    
    function make_unf_set( name, location, type ) {
        if ( type == gl.FLOAT ) {
            return function( v0 ) {
                gl.uniform1f( location, v0 );
            }
        }
        if ( type == gl.FLOAT_VEC2 ) {
            return function( v0, v1 ) {
                gl.uniform2f( location, v0, v1 );
            }
        }
        if ( type == gl.FLOAT_VEC3 ) {
            return function( v0, v1, v2 ) {
                gl.uniform3f( location, v0, v1, v2 );
            }
        }
        if ( type == gl.FLOAT_VEC4 ) {
            return function( v0, v1, v2, v3 ) {
                gl.uniform4f( location, v0, v1, v2, v3 );
            }
        }

        if ( type == gl.SAMPLER_2D ) {
            return function( value ) {
                gl.uniform1i( location, value );
            }
        }

        if ( type == gl.SAMPLER_CUBE ) {
            return function( value ) {
                gl.uniform1i( location, value );
            }
        }    

        return function() {
            throw "set function is not available for the uniform " + name + " of type " + type.toString(16);
        }
    }

    function make_unf_setv( name, location, type ) {
        if ( type == gl.FLOAT ) {
            return function( value ) {
                gl.uniform1fv( location, value );
            }
        }
        if ( type == gl.FLOAT_VEC2 ) {
            return function( value ) {
                gl.uniform2fv( location, value );
            }
        }
        if ( type == gl.FLOAT_VEC3 ) {
            return function( value ) {
                gl.uniform3fv( location, value );
            }
        }
        if ( type == gl.FLOAT_VEC4 ) {
            return function( value ) {
                gl.uniform4fv( location, value );
            }
        }
        if ( type == gl.FLOAT_MAT2 ) {
            return function( value, transpose = false ) {
                gl.uniformMatrix2fv( location, transpose, value );
            }
        }
        if ( type == gl.FLOAT_MAT3 ) {
            return function( value, transpose = false ) {
                gl.uniformMatrix3fv( location, transpose, value );
            }
        }
        if ( type == gl.FLOAT_MAT4 ) {
            return function( value, transpose = false ) {
                gl.uniformMatrix4fv( location, transpose, value );
            }
        }

        return function() {
            throw "setv function is not available for the uniform " + name + " of type " + type.toString(16);
        }
    }
    
    for ( var i = 0; i < unf_length; ++i ) {
        var u = gl.getActiveUniform( program, i );
        var location = gl.getUniformLocation( program, u.name );
        
        var uobj = {
            name : name,
            idx  : i,
            loc  : location,
            type : u.type,
            set  : make_unf_set( u.name, location, u.type ),
            setv : make_unf_setv( u.name, location, u.type )
        }

        res[ u.name ] = uobj;
        res.uniforms.push( uobj );
    }

    return res;
}


function initAttribs( gl, attribs, offset = 0 ) {
    var stride = 0;

    for ( var i = 0; i < attribs.length; ++i ) {
        var a = attribs[i];
        if ( !a.type ) {
            a.type = gl.FLOAT;
        }
        if ( a.type == gl.FLOAT ) a.bsize = 4;
        if ( a.type == gl.BYTE  || a.type == gl.UNSIGNED_BYTE )  a.bsize = 1;
        if ( a.type == gl.SHORT || a.type == gl.UNSIGNED_SHORT ) a.bsize = 2;
        if ( !a.norm ) a.norm = false;
        
        a.offset = offset + stride;
        stride += a.bsize * a.size;
    }

    for ( var i = 0; i < attribs.length; ++i ) {
        attribs[ i ].stride = stride;
    }
}


function bindAttribs( gl, attribs ) {
    for ( var i = 0; i < attribs.length; ++i ) {
        var a = attribs[i];
        gl.vertexAttribPointer( a.loc, a.size, a.type, a.norm, a.stride, a.offset );
        gl.enableVertexAttribArray( a.loc );
    }
}

function loadTexture( gl, filename, format = gl.RGBA, generate_mipmap = true, nearest = false, repeat = false ) {
    var tex = gl.createTexture();
    var image = new Image();
    image.onload = function() { setTexImage( gl, image, tex, format, generate_mipmap, nearest, repeat ); };
    image.src = filename;
    var res = { id: tex, image: image };
    return res;
}

function setTexImage( gl, image, tex, format, generate_mipmap, nearest_filtering, repeat_uv ) {
    gl.bindTexture( gl.TEXTURE_2D, tex );
    gl.texImage2D( gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image );

    if ( !nearest_filtering ) {
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    } else {
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    }

    if ( repeat_uv ) {
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );        
    } else {
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
    }

    if ( generate_mipmap ) {
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
        gl.generateMipmap( gl.TEXTURE_2D );
    } else {
        if ( !nearest_filtering ) {
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );
        } else {
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
        }
    }
    gl.bindTexture( gl.TEXTURE_2D, null );
}

function colorFromString( string, fallback_value = [0,0,0] ) {
    var val = parseInt( string.replace( "#","" ), 16 );
    if ( val == NaN ) return fallback_value;
    var b = ( val & 0xff ) / 255.0;
    var g = ( ( val >> 8 ) & 0xff ) / 255.0;
    var r = ( ( val >> 16 ) & 0xff ) / 255.0;
    return [ r, g, b ];
}
