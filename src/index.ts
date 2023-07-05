import {
  createProgram,
  initAttribs,
  bindAttribs,
  loadTexture,
  colorFromString,
  // @ts-ignore
} from "./glutils";
// @ts-ignore
import { fontMetrics, writeString } from "./textutils";

// function that takes the arguments
export type Options = {
  canvas: HTMLCanvasElement;
  text: string;
  x: number;
  y: number;
};

export {
  createProgram,
  initAttribs,
  bindAttribs,
  loadTexture,
  colorFromString,
  fontMetrics,
  writeString,
};
