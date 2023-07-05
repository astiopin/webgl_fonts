import { bindAttribs, createProgram, initAttribs } from "./glutils";
import { StringResult, fontMetrics, writeString } from "./textutils";
import { Attrib, RenderOptions, ImageTexture, Font } from "./types";
import fragCode from "./shader.frag";
import vertCode from "./shader.vert";

export function createRenderer(gl: WebGL2RenderingContext) {
  const canvas = gl.canvas as HTMLCanvasElement;
  // Vertex attributes

  const attribs: Attrib[] = [
    { loc: 0, name: "pos", size: 2 }, // Vertex position
    { loc: 1, name: "tex0", size: 2 }, // Texture coordinate
    { loc: 2, name: "sdf_size", size: 1 }, // Glyph SDF distance in screen pixels
  ];
  initAttribs(gl, attribs);

  // 10000 ought to be enough for anybody

  const vertex_array = new Float32Array((10000 * 6 * attribs[0].stride!) / 4);

  const vertex_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertex_array, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.enable(gl.BLEND);

  const prog = createProgram(gl, vertCode, fragCode, attribs);

  type Layout = {
    font: Font;
    font_size: number;
    text: string;
  };

  // state variables
  let pixel_ratio = window.devicePixelRatio || 1;
  let str_res: StringResult; // Result of a writeString function, Contains text bounding rectangle.
  let vcount = 0; // Text string vertex count
  let canvas_width = canvas.clientWidth;
  let canvas_height = canvas.clientHeight;
  let prev_font: Font | null = null;
  let prev_font_size = -1;
  let prev_text = "";

  function layout({ font, font_size, text }: Layout) {
    const font_size_scaled = Math.round(font_size * pixel_ratio);
    const fmetrics = fontMetrics(
      font.font_bundle,
      font_size_scaled,
      font_size_scaled * 0.2
    );

    // Laying out the text
    str_res = writeString(
      text,
      font.font_bundle,
      fmetrics,
      [0, 0],
      vertex_array
    );
    vcount = str_res.array_pos / (attribs[0].stride! / 4) /*size of float*/;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertex_array);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  function render({
    font,
    font_size,
    text,
    font_color,
    bg_color,
    font_hinting,
    subpixel,
  }: RenderOptions) {
    // Setting canvas size considering display DPI
    const new_pixel_ratio = window.devicePixelRatio || 1;

    let do_update = false;
    if (pixel_ratio != new_pixel_ratio) {
      do_update = true;
      pixel_ratio = new_pixel_ratio;
    }
    if (prev_font != font) {
      do_update = true;
      prev_font = font;
    }
    if (prev_font_size != font_size) {
      do_update = true;
      prev_font_size = font_size;
    }
    if (prev_text != text) {
      do_update = true;
      prev_text = text;
    }

    if (do_update) {
      // adjust the layout
      layout({ font, font_size, text });
    }

    const tex = font.font_texture;

    const cw = Math.round(pixel_ratio * canvas_width * 0.5) * 2.0;
    const ch = Math.round(pixel_ratio * canvas_height * 0.5) * 2.0;

    canvas.width = cw;
    canvas.height = ch;

    canvas.style.width = cw / pixel_ratio + "px";
    canvas.style.height = ch / pixel_ratio + "px";

    // Centering the text rectangle

    const dx = Math.round(-0.5 * str_res.rect[2]);
    const dy = Math.round(0.5 * str_res.rect[3]);

    const ws = 2.0 / cw;
    const hs = 2.0 / ch;

    // Transformation matrix. 3x3 ortho.
    // Canvas size, [0,0] is at the text rect's top left corner, Y goes up.

    const screen_mat = new Float32Array([
      ws,
      0,
      0,
      0,
      hs,
      0,
      dx * ws,
      dy * hs,
      1,
    ]);

    // Clearing the canvas

    gl.clearColor(bg_color[0], bg_color[1], bg_color[2], 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Setting up our shader values and rendering
    // a vcount of vertices from the vertex_buffer

    gl.useProgram(prog.id);

    prog.font_tex.set(0);
    prog.sdf_tex_size.set(tex.image.width, tex.image.height);
    prog.sdf_border_size.set(font.font_bundle.iy);
    prog.transform.setv(screen_mat);
    prog.hint_amount.set(font_hinting ? 1.0 : 0.0);
    prog.font_color.set(font_color[0], font_color[1], font_color[2], 1.0);
    prog.subpixel_amount.set(subpixel ? 1.0 : 0.0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex.id);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    bindAttribs(gl, attribs);

    if (subpixel) {
      // Subpixel antialiasing.
      // Method proposed by Radek Dutkiewicz @oomek
      // Text color goes to constant blend factor and
      // triplet alpha comes from the fragment shader output

      gl.blendColor(font_color[0], font_color[1], font_color[2], 1.0);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.CONSTANT_COLOR, gl.ONE_MINUS_SRC_COLOR);
    } else {
      // Greyscale antialising
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    gl.drawArrays(gl.TRIANGLES, 0, vcount);
  }

  return {
    render,
  };
}
