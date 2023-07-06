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
      font.fontBundle,
      font_size_scaled,
      font_size_scaled * 0.2
    );

    // Laying out the text
    str_res = writeString(
      text,
      font.fontBundle,
      fmetrics,
      [0, 0],
      vertex_array
    );
    vcount = str_res.array_pos / (attribs[0].stride! / 4); /*size of float*/

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertex_array);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  function render({
    font,
    fontSize,
    text,
    fontColor,
    backgroundColor,
    fontHinting,
    subpixel,
    align = "left",
    baseline = "top",
    translateX = 0,
    translateY = 0,
    alignItems = "start",
    justifyContent = "start",
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
    if (prev_font_size != fontSize) {
      do_update = true;
      prev_font_size = fontSize;
    }
    if (prev_text != text) {
      do_update = true;
      prev_text = text;
    }

    if (do_update) {
      // adjust the layout
      layout({ font, font_size: fontSize, text });
    }

    const tex = font.fontTexture;

    const cw = Math.round(pixel_ratio * canvas_width * 0.5) * 2.0;
    const ch = Math.round(pixel_ratio * canvas_height * 0.5) * 2.0;

    // Centering the text rectangle
    let dx = Math.round(-0.5 * str_res.rect[2]);
    let dy = Math.round(0.5 * str_res.rect[3]);

    if (align == "left") {
      dx = 0;
    } else if (align == "right") {
      dx = -str_res.rect[2];
    }

    if (baseline == "top") {
      dy = 0;
    } else if (baseline == "bottom") {
      dy = str_res.rect[3];
    }

    const ws = 2.0 / cw;
    const hs = 2.0 / ch;

    let dax = 0.5;
    let day = 0.5;
    if (alignItems === "start") {
      dax = 0.0;
    } else if (alignItems === "end") {
      dax = 1.0;
    }

    // y axis is inverted in WebGL
    if (justifyContent === "start") {
      day = 1.0;
    } else if (justifyContent === "end") {
      day = 0.0;
    }

    dx += translateX + cw * (dax - 0.5);
    dy += -translateY + ch * (day - 0.5);

    // Transformation matrix. 3x3 ortho.
    // Canvas size, [0,0] is at the text rect's top left corner, Y goes up.
    // Clearing the canvas

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

    // Enable the scissor test. This will limit the clear operation to a specific region.
    gl.enable(gl.SCISSOR_TEST);
    const scissorX = canvas.width / 2 + dx;
    const scissorY = canvas.height / 2 + dy - str_res.rect[3];
    const scissorWidth = str_res.rect[2];
    const scissorHeight = str_res.rect[3];
    gl.scissor(scissorX, scissorY, scissorWidth, scissorHeight);
    gl.clearColor(
      backgroundColor[0],
      backgroundColor[1],
      backgroundColor[2],
      1.0
    );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);

    // Setting up our shader values and rendering
    // a vcount of vertices from the vertex_buffer
    gl.useProgram(prog.id);

    prog.font_tex.set(0);
    prog.sdf_tex_size.set(tex.image.width, tex.image.height);
    prog.sdf_border_size.set(font.fontBundle.iy);
    prog.transform.setv(screen_mat);
    prog.hint_amount.set(fontHinting ? 1.0 : 0.0);
    prog.font_color.set(fontColor[0], fontColor[1], fontColor[2], 1.0);
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

      gl.blendColor(fontColor[0], fontColor[1], fontColor[2], 1.0);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.CONSTANT_COLOR, gl.ONE_MINUS_SRC_COLOR);
    } else {
      // Greyscale antialising
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    gl.drawArrays(gl.TRIANGLES, 0, vcount);

    // reset the blend function
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  return {
    render,
  };
}
