import { colorFromString, loadFont } from "./glutils";
import { createRenderer } from "./render";
import "./style.css";

async function glMain() {
  // Initializing input widgets
  const fonts_select = document.getElementById("fonts") as HTMLSelectElement;
  fonts_select.onchange = async () => {
    const font_name = fonts_select.value;
    current_font = await loadFont(gl, font_name);
  };

  const font_size_input = document.getElementById(
    "font_size"
  ) as HTMLInputElement;

  const font_hinting_input = document.getElementById(
    "font_hinting"
  ) as HTMLInputElement;

  const subpixel_input = document.getElementById(
    "subpixel"
  ) as HTMLInputElement;

  const font_color_input = document.getElementById(
    "font_color"
  ) as HTMLInputElement;

  const bg_color_input = document.getElementById(
    "background_color"
  ) as HTMLInputElement;

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

  // GL stuff
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2", {
    premultipliedAlpha: false,
    alpha: false,
  })!;

  const renderer = createRenderer(gl);

  let current_font = await loadFont(gl, "roboto");
  let font_color = [0.1, 0.1, 0.1];
  let bg_color = [0.9, 0.9, 0.9];

  function loop() {
    font_color = colorFromString(font_color_input.value, [0.1, 0.1, 0.1]);
    bg_color = colorFromString(bg_color_input.value, [0.9, 0.9, 0.9]);

    renderer.render({
      font_size: Number(font_size_input.value),
      font: current_font,
      font_hinting: font_hinting_input.checked,
      subpixel: subpixel_input.checked,
      text: textarea.value,
      font_color,
      bg_color,
    });

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

glMain();
