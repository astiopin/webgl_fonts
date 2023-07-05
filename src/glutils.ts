import { Attrib } from "./types";


export function createProgram(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
  attribs: Attrib[]
) {
  const vshader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vshader, vertex);
  gl.compileShader(vshader);

  const vok = gl.getShaderParameter(vshader, gl.COMPILE_STATUS);
  if (!vok) {
    throw "unable to compile vertex shader:" + gl.getShaderInfoLog(vshader);
  }

  const fshader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fshader, fragment);
  gl.compileShader(fshader);

  const fok = gl.getShaderParameter(fshader, gl.COMPILE_STATUS);
  if (!fok) {
    throw "unable to compile fragment shader:" + gl.getShaderInfoLog(fshader);
  }

  const program = gl.createProgram()!;

  for (let i = 0; i < attribs.length; ++i) {
    const a = attribs[i];
    gl.bindAttribLocation(program, a.loc, a.name);
  }

  gl.attachShader(program, vshader);
  gl.attachShader(program, fshader);

  gl.linkProgram(program);

  const pok = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!pok) {
    throw "unable to link program: " + gl.getProgramInfoLog(program);
  }

  const unf_length = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  const res: { id: WebGLProgram; uniforms: any[] } & Record<string, any> = {
    id: program,
    uniforms: [],
  };

  function make_unf_set(
    name: string,
    location: WebGLUniformLocation,
    type: number
  ) {
    if (type == gl.FLOAT) {
      return function (v0: number) {
        gl.uniform1f(location, v0);
      };
    }
    if (type == gl.FLOAT_VEC2) {
      return function (v0: number, v1: number) {
        gl.uniform2f(location, v0, v1);
      };
    }
    if (type == gl.FLOAT_VEC3) {
      return function (v0: number, v1: number, v2: number) {
        gl.uniform3f(location, v0, v1, v2);
      };
    }
    if (type == gl.FLOAT_VEC4) {
      return function (v0: number, v1: number, v2: number, v3: number) {
        gl.uniform4f(location, v0, v1, v2, v3);
      };
    }

    if (type == gl.SAMPLER_2D) {
      return function (value: number) {
        gl.uniform1i(location, value);
      };
    }

    if (type == gl.SAMPLER_CUBE) {
      return function (value: number) {
        gl.uniform1i(location, value);
      };
    }

    return function () {
      throw (
        "set function is not available for the uniform " +
        name +
        " of type " +
        type.toString(16)
      );
    };
  }

  function make_unf_setv(
    name: string,
    location: WebGLUniformLocation,
    type: number
  ) {
    if (type == gl.FLOAT) {
      return function (value: number[]) {
        gl.uniform1fv(location, value);
      };
    }
    if (type == gl.FLOAT_VEC2) {
      return function (value: number[]) {
        gl.uniform2fv(location, value);
      };
    }
    if (type == gl.FLOAT_VEC3) {
      return function (value: number[]) {
        gl.uniform3fv(location, value);
      };
    }
    if (type == gl.FLOAT_VEC4) {
      return function (value: number[]) {
        gl.uniform4fv(location, value);
      };
    }
    if (type == gl.FLOAT_MAT2) {
      return function (value: number[], transpose = false) {
        gl.uniformMatrix2fv(location, transpose, value);
      };
    }
    if (type == gl.FLOAT_MAT3) {
      return function (value: number[], transpose = false) {
        gl.uniformMatrix3fv(location, transpose, value);
      };
    }
    if (type == gl.FLOAT_MAT4) {
      return function (value: number[], transpose = false) {
        gl.uniformMatrix4fv(location, transpose, value);
      };
    }

    return function () {
      throw (
        "setv function is not available for the uniform " +
        name +
        " of type " +
        type.toString(16)
      );
    };
  }

  for (let i = 0; i < unf_length; ++i) {
    const u = gl.getActiveUniform(program, i)!;
    const location = gl.getUniformLocation(program, u.name)!;

    const uobj = {
      name: u.name,
      idx: i,
      loc: location,
      type: u.type,
      set: make_unf_set(u.name, location, u.type),
      setv: make_unf_setv(u.name, location, u.type),
    };

    res[u.name] = uobj;
    res.uniforms.push(uobj);
  }

  return res;
}

export function initAttribs(
  gl: WebGL2RenderingContext,
  attribs: Attrib[],
  offset = 0
) {
  let stride = 0;

  for (let i = 0; i < attribs.length; ++i) {
    const a = attribs[i];
    if (!a.type) {
      a.type = gl.FLOAT;
    }
    if (a.type == gl.FLOAT) a.bsize = 4;
    if (a.type == gl.BYTE || a.type == gl.UNSIGNED_BYTE) a.bsize = 1;
    if (a.type == gl.SHORT || a.type == gl.UNSIGNED_SHORT) a.bsize = 2;
    if (!a.norm) a.norm = false;

    a.offset = offset + stride;
    stride += a.bsize! * a.size!;
  }

  for (let i = 0; i < attribs.length; ++i) {
    attribs[i].stride = stride;
  }
}

export function bindAttribs(gl: WebGL2RenderingContext, attribs: Attrib[]) {
  for (let i = 0; i < attribs.length; ++i) {
    const a = attribs[i];
    gl.vertexAttribPointer(
      a.loc,
      a.size!,
      a.type!,
      a.norm!,
      a.stride!,
      a.offset!
    );
    gl.enableVertexAttribArray(a.loc);
  }
}

export function loadTexture(
  gl: WebGL2RenderingContext,
  filename: string,
  format: number = gl.RGBA,
  generate_mipmap = true,
  nearest = false,
  repeat = false
) {
  const tex = gl.createTexture()!;
  const image = new Image();
  image.onload = function () {
    setTexImage(gl, image, tex, format, generate_mipmap, nearest, repeat);
  };
  image.src = filename;
  const res = { id: tex, image: image };
  return res;
}

/**
* Loading SDF font images. Resulting textures should not be mipmapped.
*/
export async function loadFont(gl: WebGL2RenderingContext, name: string, path = "/fonts") {
  const tex = loadTexture(gl, `${path}/${name}.png`, gl.LUMINANCE, false);
  const font = await fetch(`${path}/${name}.json`).then((res) => res.json());

  return { tex, font };
}

export function setTexImage(
  gl: WebGL2RenderingContext,
  image: HTMLImageElement,
  tex: WebGLTexture,
  format: number,
  generate_mipmap: boolean,
  nearest_filtering: boolean,
  repeat_uv: boolean
) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, image);

  if (!nearest_filtering) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }

  if (repeat_uv) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  if (generate_mipmap) {
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
    gl.generateMipmap(gl.TEXTURE_2D);
  } else {
    if (!nearest_filtering) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
}

export function colorFromString(string: string, fallback_value = [0, 0, 0]) {
  const val = parseInt(string.replace("#", ""), 16);
  if (Number.isNaN(val)) return fallback_value;
  const b = (val & 0xff) / 255.0;
  const g = ((val >> 8) & 0xff) / 255.0;
  const r = ((val >> 16) & 0xff) / 255.0;
  return [r, g, b];
}
