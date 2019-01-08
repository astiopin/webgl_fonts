# WebGL Font Rendering

Demonstration of a font rendering on the GPU with glyph hinting and subpixel antialiasing.

The demo uses [signed distance field method](http://www.valvesoftware.com/publications/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf) for glyph rendering.

[Click here to see the demo](http://astiopin.github.io/webgl_fonts) (requires WebGL).

Font atlas generation tool is [here](https://github.com/astiopin/sdf_atlas).

## Hinting

The idea is pretty simple. First we're placing the text baseline exactly at the pixel boundary. Next we're using two different methods to place the glyphs. Lowcase characters are scaled in a such way that the [x-height](https://en.wikipedia.org/wiki/X-height) spans a whole number of pixels. All other characters are scaled to fit the [cap height](https://en.wikipedia.org/wiki/Cap_height) to the pixel boundary.

![Glyph hinting](http://astiopin.github.io/webgl_fonts/assets/scaling.png)

At the rasterisation stage we're modifying the antialiazing routine so that the antialiazed edge distance depends on a stroke direction, which makes horizontal strokes appear sharper than the vertical ones.

![Result](http://astiopin.github.io/webgl_fonts/assets/result.png)
