import { FontBundle, FontChar, FontMetrics } from "./types";

export function fontMetrics(
  font: FontBundle,
  pixel_size: number,
  more_line_gap = 0.0
) {
  // We use separate scale for the low case characters
  // so that x-height fits the pixel grid.
  // Other characters use cap-height to fit to the pixels
  const cap_scale = pixel_size / font.cap_height;
  const low_scale = Math.round(font.x_height * cap_scale) / font.x_height;

  // Ascent should be a whole number since it's used to calculate the baseline
  // position which should lie at the pixel boundary
  const ascent = Math.round(font.ascent * cap_scale);

  // Same for the line height
  const line_height = Math.round(
    cap_scale * (font.ascent + font.descent + font.line_gap) + more_line_gap
  );

  return {
    cap_scale: cap_scale,
    low_scale: low_scale,
    pixel_size: pixel_size,
    ascent: ascent,
    line_height: line_height,
  };
}

export function charRect(
  pos: number[],
  font: FontBundle,
  font_metrics: FontMetrics,
  font_char: FontChar,
  kern = 0.0
) {
  // Low case characters have first bit set in 'flags'
  const lowcase = (font_char.flags & 1) == 1;

  // Pen position is at the top of the line, Y goes up
  const baseline = pos[1] - font_metrics.ascent;

  // Low case chars use their own scale
  const scale = lowcase ? font_metrics.low_scale : font_metrics.cap_scale;

  // Laying out the glyph rectangle
  const g = font_char.rect;
  const bottom = baseline - scale * (font.descent + font.iy);
  const top = bottom + scale * font.row_height;
  const left =
    pos[0] + font.aspect * scale * (font_char.bearing_x! + kern - font.ix);
  const right = left + font.aspect * scale * (g[2] - g[0]);
  const p = [left, top, right, bottom];

  // Advancing pen position
  const new_pos_x =
    pos[0] + font.aspect * scale * (font_char.advance_x! + kern);

  // Signed distance field size in screen pixels
  //const sdf_size  = 2.0 * font.iy * scale;

  const vertices = [
    p[0],
    p[1],
    g[0],
    g[1],
    scale,
    p[2],
    p[1],
    g[2],
    g[1],
    scale,
    p[0],
    p[3],
    g[0],
    g[3],
    scale,

    p[0],
    p[3],
    g[0],
    g[3],
    scale,
    p[2],
    p[1],
    g[2],
    g[1],
    scale,
    p[2],
    p[3],
    g[2],
    g[3],
    scale,
  ];

  return { vertices: vertices, pos: [new_pos_x, pos[1]] };
}

export type StringResult = {
  rect: number[];
  string_pos: number;
  array_pos: number;
};

export function writeString(
  string: string,
  font: FontBundle,
  font_metrics: FontMetrics,
  pos: number[],
  vertex_array: Float32Array,
  str_pos = 0,
  array_pos = 0
): StringResult {
  let prev_char = " "; // Used to calculate kerning
  let cpos = pos; // Current pen position
  let x_max = 0.0; // Max width - used for bounding box
  const scale = font_metrics.cap_scale;

  for (;;) {
    if (str_pos == string.length) break;
    const glyph_float_count = 6 * 5; // two rectangles, 5 floats per vertex
    if (array_pos + glyph_float_count >= vertex_array.length) break;

    let schar = string[str_pos];
    str_pos++;

    if (schar == "\n") {
      if (cpos[0] > x_max) x_max = cpos[0]; // Expanding the bounding rect
      cpos[0] = pos[0];
      cpos[1] -= font_metrics.line_height;
      prev_char = " ";
      continue;
    }

    if (schar == " ") {
      cpos[0] += font.space_advance * scale;
      prev_char = " ";
      continue;
    }

    let font_char = font.chars[schar];
    if (!font_char) {
      // Substituting unavailable characters with '?'
      schar = "?";
      font_char = font.chars["?"];
    }

    let kern = font.kern[prev_char + schar];
    if (!kern) kern = 0.0;

    // calculating the glyph rectangle and copying it to the vertex array

    const rect = charRect(cpos, font, font_metrics, font_char, kern);

    for (let i = 0; i < rect.vertices.length; ++i) {
      vertex_array[array_pos] = rect.vertices[i];
      array_pos++;
    }

    prev_char = schar;
    cpos = rect.pos;
  }

  const res = {
    rect: [
      pos[0],
      pos[1],
      x_max - pos[0],
      pos[1] - cpos[1] + font_metrics.line_height,
    ],
    string_pos: str_pos,
    array_pos: array_pos,
  };

  return res;
}
