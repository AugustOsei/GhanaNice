/* Footer landscape: the engraved Volta with moving water.
   A WebGL pass redraws the engraving and displaces only the pixels under the water mask, so
   the horizontal engraved lines ripple while the hills and the boat stay put; the sky drifts
   a few pixels. The plain <img> underneath is the fallback (no WebGL, reduced motion). */
(() => {
  const scene = document.querySelector('.footer-scene');
  const canvas = scene?.querySelector('.footer-water');
  if (!scene || !canvas) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
  if (!gl) return;

  const vertex = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  /* Cover-fit anchored to the bottom (like object-position: X% 100%), then displacement. */
  const fragment = `
    precision mediump float;
    uniform sampler2D uImage;
    uniform sampler2D uMask;
    uniform vec2 uRes;
    uniform vec2 uImg;
    uniform float uAnchorX;
    uniform float uTime;
    void main() {
      vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
      float scale = max(uRes.x / uImg.x, uRes.y / uImg.y);
      vec2 drawn = uImg * scale;
      vec2 offset = (uRes - drawn) * vec2(uAnchorX, 1.0);
      vec2 uv = (p - offset) / drawn;

      float water = texture2D(uMask, uv).r;
      float depth = clamp((uv.y - 0.55) / 0.45, 0.0, 1.0);
      float t = uTime;
      /* Two slow travelling waves; amplitude grows toward the viewer. */
      float wave = sin(uv.x * 38.0 - t * 1.3 + sin(uv.y * 70.0 + t * 0.6) * 1.6)
                 + 0.6 * sin(uv.x * 91.0 + uv.y * 140.0 - t * 2.1);
      float dy = wave * (0.0007 + depth * 0.0016) * water;
      float dx = sin(uv.y * 210.0 - t * 0.9) * 0.0012 * depth * water;

      /* Sky: a gentle sideways drift that fades out well above the hills. */
      float sky = smoothstep(0.30, 0.16, uv.y) * (1.0 - water);
      dx += sin(t * 0.12 + uv.y * 7.0) * 0.0035 * sky;

      gl_FragColor = texture2D(uImage, uv + vec2(dx, dy));
    }`;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }
  const vs = compile(gl.VERTEX_SHADER, vertex);
  const fs = compile(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uniform = name => gl.getUniformLocation(program, name);
  const u = { res: uniform('uRes'), img: uniform('uImg'), anchor: uniform('uAnchorX'), time: uniform('uTime') };
  gl.uniform1i(uniform('uImage'), 0);
  gl.uniform1i(uniform('uMask'), 1);

  function texture(unit, image) {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  }

  function load(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  let running = false;
  let visible = false;
  let imageSize = [2400, 1800];
  let frame = 0;
  const start = performance.now();

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw(now) {
    if (!visible) { running = false; return; }
    const anchor = parseFloat(getComputedStyle(scene).getPropertyValue('--scene-x')) || 50;
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform2f(u.img, imageSize[0], imageSize[1]);
    gl.uniform1f(u.anchor, anchor / 100);
    gl.uniform1f(u.time, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frame = requestAnimationFrame(draw);
  }

  function run() {
    if (running || !visible) return;
    running = true;
    frame = requestAnimationFrame(draw);
  }

  /* Only start work once the footer is near, and only animate while it is on screen. */
  let loaded = false;
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) { cancelAnimationFrame(frame); running = false; return; }
    if (loaded) return run();
    loaded = true;
    const wide = Math.max(innerWidth, innerHeight) * Math.min(devicePixelRatio || 1, 2) > 1400;
    Promise.all([
      load(wide ? 'assets/footer/volta-engraving.webp' : 'assets/footer/volta-engraving-1200.webp'),
      load('assets/footer/volta-water-mask.png')
    ]).then(([image, mask]) => {
      imageSize = [image.naturalWidth, image.naturalHeight];
      texture(0, image);
      texture(1, mask);
      resize();
      scene.classList.add('is-live');
      run();
    }).catch(() => {});
  }, { rootMargin: '300px 0px' }).observe(scene);

  addEventListener('resize', () => { if (loaded) resize(); });
})();
