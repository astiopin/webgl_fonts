import roboto_font from "./fonts/roboto";
import roboto_bold_font from "./fonts/roboto-bold";
import ubuntu_font from "./fonts/ubuntu";
import ubuntu_bold_font from "./fonts/ubuntu-bold";
import dejavu_font from "./fonts/dejavu-serif";
import dejavu_italic_font from "./fonts/dejavu-serif-italic";
import sf_mono_font from "./fonts/sf-mono";
import inter_font from "./fonts/inter";
import inter_tight_bold_font from "./fonts/inter-tight-bold";
import { loadTexture, colorFromString } from "./glutils";
import type { Font } from "./types";
import { createRenderer } from "./render";
import "./style.css";

let do_update = true;

function update_text() {
  do_update = true;
}

function glMain() {
  // Initializing input widgets

  const fonts_select = document.getElementById("fonts") as HTMLSelectElement;
  fonts_select.addEventListener("input", update_text, false);
  fonts_select.onchange = update_text;

  const font_size_input = document.getElementById(
    "font_size"
  ) as HTMLInputElement;
  font_size_input.addEventListener("input", update_text, false);
  font_size_input.onchange = update_text;

  const font_hinting_input = document.getElementById(
    "font_hinting"
  ) as HTMLInputElement;
  font_hinting_input.addEventListener("input", update_text, false);
  font_hinting_input.onchange = update_text;

  const subpixel_input = document.getElementById(
    "subpixel"
  ) as HTMLInputElement;
  subpixel_input.addEventListener("input", update_text, false);
  subpixel_input.onchange = update_text;

  const font_color_input = document.getElementById(
    "font_color"
  ) as HTMLInputElement;
  font_color_input.addEventListener("input", update_text, false);
  font_color_input.onchange = update_text;

  const bg_color_input = document.getElementById(
    "background_color"
  ) as HTMLInputElement;
  bg_color_input.addEventListener("input", update_text, false);
  bg_color_input.onchange = update_text;

  const textarea = document.getElementById("text") as HTMLTextAreaElement;
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

  const all_fonts: { [key: string]: Font } = {
    roboto: roboto_font,
    roboto_bold: roboto_bold_font,
    ubuntu: ubuntu_font,
    ubuntu_bold: ubuntu_bold_font,
    dejavu: dejavu_font,
    dejavu_italic: dejavu_italic_font,
    sf_mono: sf_mono_font,
    inter: inter_font,
    inter_tight_bold: inter_tight_bold_font,
  };


  // GL stuff
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2", {
    premultipliedAlpha: false,
    alpha: false,
  })!;

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
  sf_mono_font.tex = loadTexture(gl, "fonts/sf-mono.png", gl.LUMINANCE, false);
  inter_font.tex = loadTexture(gl, "fonts/inter.png", gl.LUMINANCE, false);
  inter_tight_bold_font.tex = loadTexture(
    gl,
    "fonts/inter-tight-bold.png",
    gl.LUMINANCE,
    false
  );

  let font_color = [0.1, 0.1, 0.1];
  let bg_color = [0.9, 0.9, 0.9];

  const renderer = createRenderer({ gl, canvas });

  function loop() {
    font_color = colorFromString(font_color_input.value, [0.1, 0.1, 0.1]);
    bg_color = colorFromString(bg_color_input.value, [0.9, 0.9, 0.9]);

    renderer.render({
      font_size: Number(font_size_input.value),
      font: all_fonts[fonts_select.value] ?? roboto_font,
      font_hinting: font_hinting_input.checked ? 1 : 0,
      subpixel: subpixel_input.checked ? 1 : 0,
      text: textarea.value,
      do_update,
      font_color,
      bg_color,
    });

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

glMain();
