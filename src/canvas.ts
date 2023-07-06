export function getCanvas() {
  const canvas = document.getElementById("glcanvas") as HTMLCanvasElement;

  function onResize() {
    console.log("onResize");
    const dppx = window.devicePixelRatio;
    const width = 700 * dppx;
    const height = 400 * dppx;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width / dppx}px`;
    canvas.style.height = `${height / dppx}px`;
  }

  onResize();

  window.addEventListener("resize", onResize);

  return canvas;
}
