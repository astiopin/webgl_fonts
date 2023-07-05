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
import { Options } from "./types";

export function drawText(options: Options) {
  throw new Error("Not implemented");
}

export {
  createProgram,
  initAttribs,
  bindAttribs,
  loadTexture,
  colorFromString,
  fontMetrics,
  writeString,
};
