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

export {
  fragCode,
  vertCode,
  createProgram,
  initAttribs,
  bindAttribs,
  loadTexture,
  colorFromString,
  fontMetrics,
  writeString,
};
