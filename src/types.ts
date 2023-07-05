// function that takes the arguments
export type Options = {
  canvas: HTMLCanvasElement;
  text: string;
  x: number;
  y: number;
};

export type Attrib = {
  name: string;
  loc: number;
  type?: number;
  norm?: boolean;
  bsize?: number;
  offset?: number;
  stride?: number;
  size?: number;
};

export type ImageTexture = {
  id: WebGLTexture;
  image: HTMLImageElement;
};

export type Font = {
  ix: number;
  iy: number;
  aspect: number;
  row_height: number;
  ascent: number;
  descent: number;
  line_gap: number;
  cap_height: number;
  x_height: number;
  space_advance: number;
  chars: { [key: string]: FontChar };
  kern: { [key: string]: number };
  tex?: ImageTexture;
};

export type FontMetrics = {
  cap_scale: number;
  low_scale: number;
  pixel_size: number;
  ascent: number;
  line_height: number;
};

export type FontChar = {
  rect: number[];
  bearing_x?: number;
  bearing_y?: number;
  advance_x?: number;
  advance_y?: number;
  flags: number;
};