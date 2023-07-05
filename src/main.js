import roboto_font from "./fonts/roboto";
import roboto_bold_font from "./fonts/roboto-bold";
import ubuntu_font from "./fonts/ubuntu";
import ubuntu_bold_font from "./fonts/ubuntu-bold";
import dejavu_font from "./fonts/dejavu-serif";
import dejavu_italic_font from "./fonts/dejavu-serif-italic";
import fragCode from "./fshader.frag";
import vertCode from "./vshader.vert";
import {
  createProgram,
  initAttribs,
  bindAttribs,
  loadTexture,
  colorFromString,
} from "./glutils";
import { fontMetrics, writeString } from "./textutils";

var do_update = true;

function update_text() {
  do_update = true;
}

function glMain() {
  // Initializing input widgets

  var fonts_select = document.getElementById("fonts");
  fonts_select.addEventListener("input", update_text, false);
  fonts_select.onchange = update_text;

  var font_size_input = document.getElementById("font_size");
  font_size_input.addEventListener("input", update_text, false);
  font_size_input.onchange = update_text;

  var font_hinting_input = document.getElementById("font_hinting");
  font_hinting_input.addEventListener("input", update_text, false);
  font_hinting_input.onchange = update_text;

  var subpixel_input = document.getElementById("subpixel");
  subpixel_input.addEventListener("input", update_text, false);
  subpixel_input.onchange = update_text;

  var font_color_input = document.getElementById("font_color");
  font_color_input.addEventListener("input", update_text, false);
  font_color_input.onchange = update_text;

  var bg_color_input = document.getElementById("background_color");
  bg_color_input.addEventListener("input", update_text, false);
  bg_color_input.onchange = update_text;

  var textarea = document.getElementById("text");
  textarea.value = `To be, or not to be--that is the question:
Whether 'tis nobler in the mind to suffer
The slings and arrows of outrageous fortune
Or to take arms against a sea of troubles
And by opposing end them. To die, to sleep--
No more--and by a sleep to say we end
The heartache, and the thousand natural shocks
That flesh is heir to. 'Tis a consummation
Devoutly to be wished. To die, to sleep--
To sleep--perchance to dream: ay, there's the rub,
For in that sleep of death what dreams may come
When we have shuffled off this mortal coil,
Must give us pause. There's the respect
That makes calamity of so long life.`;
  textarea.addEventListener("input", update_text, false);
  textarea.onchange = update_text;

  var all_fonts = {
    roboto: roboto_font,
    roboto_bold: roboto_bold_font,
    ubuntu: ubuntu_font,
    ubuntu_bold: ubuntu_bold_font,
    dejavu: dejavu_font,
    dejavu_italic: dejavu_italic_font,
  };

  var font = all_fonts[fonts_select.value];

  // GL stuff

  var canvas = document.getElementById("glcanvas");
  var gl = canvas.getContext("experimental-webgl", {
    premultipliedAlpha: false,
    alpha: false,
  });

  // Loading SDF font images. Resulting textures should NOT be mipmapped!

  roboto_font.tex = loadTexture(gl, "fonts/roboto.png", gl.LUMINANCE, false);
  roboto_bold_font.tex = loadTexture(
    gl,
    "fonts/roboto-bold.png",
    gl.LUMINANCE,
    false
  );
  ubuntu_font.tex = loadTexture(
    gl,
    "fonts/ubuntu.png",
    gl.LUMINANCE,
    false,
    true
  );
  ubuntu_bold_font.tex = loadTexture(
    gl,
    "fonts/ubuntu-bold.png",
    gl.LUMINANCE,
    false
  );
  dejavu_font.tex = loadTexture(
    gl,
    "fonts/dejavu-serif.png",
    gl.LUMINANCE,
    false
  );
  dejavu_italic_font.tex = loadTexture(
    gl,
    "fonts/dejavu-serif-italic.png",
    gl.LUMINANCE,
    false
  );

  // Vertex attributes

  var attribs = [
    { loc: 0, name: "pos", size: 2 }, // Vertex position
    { loc: 1, name: "tex0", size: 2 }, // Texture coordinate
    { loc: 2, name: "sdf_size", size: 1 }, // Glyph SDF distance in screen pixels
  ];
  initAttribs(gl, attribs);

  // 10000 ought to be enough for anybody

  var vertex_array = new Float32Array((10000 * 6 * attribs[0].stride) / 4);

  var vertex_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertex_array, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.enable(gl.BLEND);

  var prog = createProgram(gl, vertCode, fragCode, attribs);

  var str_res; // Result of a writeString function.
  // Contains text bounding rectangle.

  var vcount = 0; // Text string vertex count
  var tex; // Font texture

  var font_hinting = 1.0;
  var subpixel = 1.0;

  var font_color = [0.1, 0.1, 0.1];
  var bg_color = [0.9, 0.9, 0.9];

  var canvas_width = canvas.clientWidth;
  var canvas_height = canvas.clientHeight;
  var pixel_ratio = window.devicePixelRatio || 1;

  function render() {
    if (do_update) {
      font_color = colorFromString(font_color_input.value, [0.1, 0.1, 0.1]);
      bg_color = colorFromString(bg_color_input.value, [0.9, 0.9, 0.9]);

      font = all_fonts[fonts_select.value];
      if (!font) {
        font = roboto_font;
      }
      tex = font.tex;

      var font_size = Math.round(font_size_input.value * pixel_ratio);
      var fmetrics = fontMetrics(font, font_size, font_size * 0.2);

      // Laying out the text
      str_res = writeString(
        textarea.value,
        font,
        fmetrics,
        [0, 0],
        vertex_array
      );
      vcount = str_res.array_pos / (attribs[0].stride / 4) /*size of float*/;

      gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertex_array);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      font_hinting = font_hinting_input.checked ? 1.0 : 0.0;
      subpixel = subpixel_input.checked ? 1.0 : 0.0;

      do_update = false;
    }

    // Setting canvas size considering display DPI

    var new_pixel_ratio = window.devicePixelRatio || 1;

    if (pixel_ratio != new_pixel_ratio) {
      do_update = true;
      pixel_ratio = new_pixel_ratio;
    }

    var cw = Math.round(pixel_ratio * canvas_width * 0.5) * 2.0;
    var ch = Math.round(pixel_ratio * canvas_height * 0.5) * 2.0;

    canvas.width = cw;
    canvas.height = ch;

    canvas.style.width = cw / pixel_ratio + "px";
    canvas.style.height = ch / pixel_ratio + "px";

    // Centering the text rectangle

    var dx = Math.round(-0.5 * str_res.rect[2]);
    var dy = Math.round(0.5 * str_res.rect[3]);

    var ws = 2.0 / cw;
    var hs = 2.0 / ch;

    // Transformation matrix. 3x3 ortho.
    // Canvas size, [0,0] is at the text rect's top left corner, Y goes up.

    var screen_mat = new Float32Array([
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
    prog.sdf_border_size.set(font.iy);
    prog.transform.setv(screen_mat);
    prog.hint_amount.set(font_hinting);
    prog.font_color.set(font_color[0], font_color[1], font_color[2], 1.0);
    prog.subpixel_amount.set(subpixel);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex.id);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    bindAttribs(gl, attribs);

    if (subpixel == 1.0) {
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

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

glMain();
