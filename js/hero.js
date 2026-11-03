(function () {
  'use strict';
  const canvas = document.getElementById('hero-canvas');
  const track = document.getElementById('scroll-track');
  if (!canvas || !track) return;
  const ctx = canvas.getContext('2d');
  const steps = [...document.querySelectorAll('.story-step')];
  const bar = document.getElementById('scroll-bar');
  const hint = document.querySelector('.scroll-hint');

  /* ---- видео (all-intra, поэтому перемотка по кадрам плавная) ---- */
  const video = document.createElement('video');
  video.src = 'assets/video_smooth.mp4';
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
  video.load();

  const poster = new Image(); poster.src = 'assets/poster.jpg';
  let ready = false, dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  function resize() {
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    draw();
  }
  function draw() {
    const src = ready ? video : (poster.complete && poster.naturalWidth ? poster : null);
    if (!src) return;
    const sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight;
    if (!sw) return;
    const cw = canvas.width, ch = canvas.height, k = Math.max(cw / sw, ch / sh);
    const w = sw * k, h = sh * k;
    ctx.drawImage(src, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  video.addEventListener('loadeddata', () => { ready = true; draw(); });
  video.addEventListener('seeked', draw);
  poster.onload = draw;
  window.addEventListener('resize', resize);
  resize();

  /* ---- скролл-прогресс ---- */
  let target = 0, current = 0, lastSet = -1;
  function progress() {
    const r = track.getBoundingClientRect();
    const max = track.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / max));
  }
  function loop() {
    target = progress();
    current += (target - current) * 0.12;            // плавное сглаживание
    if (Math.abs(target - current) < 0.0004) current = target;
    if (ready && video.duration) {
      const t = Math.min(video.duration - 0.04, current * video.duration);
      if (Math.abs(t - lastSet) > 1 / 60 && !video.seeking) { video.currentTime = t; lastSet = t; }
      else if (!video.seeking && Math.abs(t - lastSet) > 0) { /* ждём seeked */ }
    }
    // story: выезд слева/справа
    steps.forEach((s, i) => {
      const a = parseFloat(s.dataset.start), b = parseFloat(s.dataset.end);
      s.classList.toggle('active', current >= a && current <= b);
    });
    if (bar) bar.style.width = (current * 100).toFixed(1) + '%';
    if (hint) hint.classList.toggle('gone', current > 0.02);
    runScenes();
    requestAnimationFrame(loop);
  }

  /* ---- сцены с резкой сменой (3 разных перехода) ---- */
  const wrap = document.getElementById('scenes');
  const scenes = wrap ? [...wrap.querySelectorAll('.scene')] : [];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  function runScenes() {
    if (!wrap) return;
    const r = wrap.getBoundingClientRect(), max = wrap.offsetHeight - window.innerHeight;
    const p = clamp(-r.top / max);
    // p: 0..1 → три сцены, между ними переходы
    const seg = p * 3;            // 0..3
    scenes.forEach((sc, i) => {
      const local = clamp(seg - i);                // прогресс сцены i: 0..1 (появление в первой половине, текст во второй)
      const reveal = ease(clamp(local * 2.2));     // 0..1 — сам переход
      if (i === 0) {
        // 1: расширяющийся круг
        sc.style.clipPath = `circle(${reveal * 150}% at 50% 50%)`;
      } else if (i === 1) {
        // 2: диагональная шторка
        const x = (1 - reveal) * 130;
        sc.style.clipPath = `polygon(${x}% 0, 100% 0, 100% 100%, ${x - 30}% 100%)`;
      } else {
        // 3: вспышка + зум
        sc.style.clipPath = 'none';
        sc.style.opacity = reveal;
        sc.style.transform = `scale(${1.25 - reveal * .25})`;
        sc.style.filter = `brightness(${1 + (1 - reveal) * 2.2}) blur(${(1 - reveal) * 10}px)`;
      }
      sc.style.visibility = seg > i - 0.01 ? 'visible' : 'hidden';
      // текст слева и справа
      const tin = ease(clamp((local - 0.35) / 0.4));
      const l = sc.querySelector('.txt-l'), rr = sc.querySelector('.txt-r');
      if (l) { l.style.transform = `translateX(${(1 - tin) * -120}px)`; l.style.opacity = tin; }
      if (rr) { rr.style.transform = `translateX(${(1 - tin) * 120}px)`; rr.style.opacity = tin; }
    });
  }
  requestAnimationFrame(loop);
  // на iOS видео нужно «разбудить» первым касанием
  const wake = () => { video.play().then(() => video.pause()).catch(() => {}); window.removeEventListener('touchstart', wake); };
  window.addEventListener('touchstart', wake, { passive: true });
})();
