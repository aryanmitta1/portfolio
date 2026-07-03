/* ============================================================
   Aryan Mitta — GLASS · interactions
   Multi-page-safe trim of the main portfolio script.
   Same backdrop / reveal / nav behavior, no single-page hash spy.
   ============================================================ */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE  = matchMedia("(pointer: coarse)").matches;

/* ---------- Interactive constellation ---------- */
(() => {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let w, h, dpr, nodes = [], dust = [], shooting = null;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    build();
  }
  function build() {
    const n = Math.min(52, Math.floor((innerWidth * innerHeight) / 26000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18 * dpr,
      vy: (Math.random() - 0.5) * 0.18 * dpr,
      r: Math.random() * 1.3 + 0.6,
    }));
    const d = Math.min(55, Math.floor((innerWidth * innerHeight) / 22000));
    dust = Array.from({ length: d }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 0.8 + 0.2,
      tw: Math.random() * Math.PI * 2, tws: Math.random() * 0.012 + 0.004,
    }));
  }
  function spawnShooting() {
    if (REDUCED) return;
    shooting = {
      x: Math.random() * w * 0.7, y: Math.random() * h * 0.3,
      vx: (Math.random() * 4 + 5) * dpr, vy: (Math.random() * 1.8 + 2) * dpr, life: 1,
    };
  }

  let rafId = 0, last = 0;
  const FRAME = 1000 / 30;
  function draw(now) {
    rafId = requestAnimationFrame(draw);
    if (now - last < FRAME) return;
    last = now;
    ctx.clearRect(0, 0, w, h);
    const linkDist = 150 * dpr;
    const mouseDist = 200 * dpr;
    const mx = mouse.x * dpr, my = mouse.y * dpr;

    ctx.fillStyle = "#fff";
    for (const s of dust) {
      s.tw += s.tws;
      ctx.globalAlpha = (0.4 + Math.sin(s.tw) * 0.4) * 0.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * dpr, 0, 6.2832); ctx.fill();
    }

    for (const p of nodes) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
    }

    // squared-distance compare; take sqrt only for in-range pairs (see note in
    // the main portfolio script — avoids Math.hypot on every O(n²) pair).
    const linkDistSq = linkDist * linkDist;
    const mouseDistSq = mouseDist * mouseDist;
    ctx.lineWidth = 1 * dpr;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < linkDistSq) {
          ctx.globalAlpha = (1 - Math.sqrt(dSq) / linkDist) * 0.22;
          ctx.strokeStyle = "#9fb0ff";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dmx = a.x - mx, dmy = a.y - my;
      const dmSq = dmx * dmx + dmy * dmy;
      let near = false;
      if (dmSq < mouseDistSq) {
        near = true;
        ctx.globalAlpha = (1 - Math.sqrt(dmSq) / mouseDist) * 0.5;
        ctx.strokeStyle = "#aebcff";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
      }
      ctx.globalAlpha = near ? 0.95 : 0.6;
      ctx.fillStyle = near ? "#cdd6ff" : "#aab4d8";
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r * dpr, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (shooting) {
      const s = shooting;
      const tx = s.x - s.vx * 9, ty = s.y - s.vy * 9;
      const g = ctx.createLinearGradient(tx, ty, s.x, s.y);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, `rgba(220,228,255,${s.life * 0.9})`);
      ctx.strokeStyle = g; ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(s.x, s.y); ctx.stroke();
      s.x += s.vx; s.y += s.vy; s.life -= 0.012;
      if (s.life <= 0 || s.x > w || s.y > h) shooting = null;
    }
  }

  function start() { if (!rafId) { last = 0; rafId = requestAnimationFrame(draw); } }
  function stop()  { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

  // Freeze the full-screen canvas once the user scrolls a viewport past the
  // top — the constellation only reads against the upper part of the page,
  // and there's no reason to keep compositing it behind dense content below.
  let onScreen = true;
  function evaluate() { (onScreen && !document.hidden) ? start() : stop(); }
  let sraf = 0;
  addEventListener("scroll", () => {
    if (sraf) return;
    sraf = requestAnimationFrame(() => {
      const next = window.scrollY < innerHeight * 1.1;
      if (next !== onScreen) { onScreen = next; evaluate(); }
      sraf = 0;
    });
  }, { passive: true });

  addEventListener("resize", resize, { passive: true });
  if (!COARSE) addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener("mouseout", () => { mouse.x = -9999; mouse.y = -9999; });
  document.addEventListener("visibilitychange", evaluate);
  resize(); evaluate();
  if (!REDUCED) setInterval(() => { if (!shooting && onScreen && !document.hidden && Math.random() > 0.55) spawnShooting(); }, 5500);
})();

/* ---------- Custom cursor + spotlight + planet parallax ---------- */
(() => {
  if (COARSE || REDUCED) return;
  const cursor = document.getElementById("cursor");
  const spot = document.getElementById("spotlight");
  const planet = document.querySelector(".planet");
  if (!cursor || !spot) return;
  let tx = innerWidth / 2, ty = innerHeight * 0.3;
  let sx = tx, sy = ty, raf = 0, shown = false;

  function frame() {
    sx += (tx - sx) * 0.1; sy += (ty - sy) * 0.1;
    spot.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
    if (planet) {
      const px = (sx / innerWidth - 0.5) * 26, py = (sy / innerHeight - 0.5) * 26;
      planet.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }
    if (Math.abs(tx - sx) > 0.4 || Math.abs(ty - sy) > 0.4) raf = requestAnimationFrame(frame);
    else raf = 0;
  }

  addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    cursor.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    if (!shown) { cursor.classList.add("is-visible"); shown = true; }
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => { if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; } });

  document.querySelectorAll("a, button, .about__tags li, .chips span").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
})();

/* ---------- Card cursor-spotlight glow ---------- */
(() => {
  if (COARSE) return;
  const cards = document.querySelectorAll(".g-card, .skill-card, .lead-card, .edu-card, .contact");
  cards.forEach((card) => {
    card.classList.add("glow-target");
    // Cache rect on enter; a hovered card doesn't move, so reading layout every
    // pointermove just forces needless reflow.
    let rect = null;
    card.addEventListener("pointerenter", () => { rect = card.getBoundingClientRect(); card.classList.add("is-glow"); });
    card.addEventListener("pointermove", (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
      card.style.setProperty("--my", (e.clientY - rect.top) + "px");
    });
    card.addEventListener("pointerleave", () => { card.classList.remove("is-glow"); rect = null; });
  });
})();

/* ---------- Nav (scrolled state + progress + mobile toggle) ---------- */
(() => {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const progress = document.getElementById("scrollProgress");
  // Scroll frame reads ONLY window.scrollY (no layout reads → no reflow).
  // docH is cached off the scroll path; progress is a composited scaleX.
  let docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let ticking = false;
  function update() {
    ticking = false;
    const y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 30);
    if (progress) progress.style.transform = "scaleX(" + Math.min(1, y / docH) + ")";
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  function remeasure() { docH = Math.max(1, document.documentElement.scrollHeight - innerHeight); update(); }
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(remeasure, 150); }, { passive: true });
  addEventListener("load", remeasure);
  // refresh docH when content-visibility sections settle (off the scroll path)
  if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(document.body);
  update();
  if (toggle && links) {
    toggle.addEventListener("click", () => { links.classList.toggle("open"); toggle.classList.toggle("open"); });
    links.addEventListener("click", (e) => { if (e.target.tagName === "A") { links.classList.remove("open"); toggle.classList.remove("open"); } });
  }
})();

/* ---------- Scroll reveal ---------- */
(() => {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("visible")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), (i % 6) * 80);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  items.forEach((i) => io.observe(i));
})();

/* ---------- Freeze offscreen CSS animations ---------- */
(() => {
  const targets = document.querySelectorAll(".hero__orbit, .marquee");
  if (!targets.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("anim-paused", !e.isIntersecting));
  }, { threshold: 0 });
  targets.forEach((t) => io.observe(t));
})();

/* ---------- Section dividers: animate only while in view ---------- */
(() => {
  const dividers = document.querySelectorAll(".divider");
  if (!dividers.length) return;
  if (!("IntersectionObserver" in window)) { dividers.forEach((d) => d.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("is-in", e.isIntersecting));
  }, { threshold: 0 });
  dividers.forEach((d) => io.observe(d));
})();

/* ---------- Gallery lightbox ---------- */
(() => {
  const grid = document.getElementById("gallery-grid");
  const box = document.getElementById("lightbox");
  if (!grid || !box) return;

  const figures = Array.from(grid.querySelectorAll(".frame"));
  const imgEl = document.getElementById("lbImg");
  const capEl = document.getElementById("lbCap");
  const countEl = document.getElementById("lbCount");
  const closeBtn = document.getElementById("lbClose");
  const prevBtn = document.getElementById("lbPrev");
  const nextBtn = document.getElementById("lbNext");
  let idx = -1;

  function show(i) {
    idx = (i + figures.length) % figures.length;
    const fig = figures[idx];
    const src = fig.querySelector("img").getAttribute("src");
    imgEl.src = src;
    imgEl.alt = fig.querySelector("img").alt || "";
    capEl.textContent = fig.getAttribute("data-cap") || "";
    countEl.textContent = (idx + 1) + " / " + figures.length;
  }
  function open(i) {
    show(i);
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function close() {
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    idx = -1;
  }

  figures.forEach((fig, i) => {
    fig.addEventListener("click", () => open(i));
    fig.setAttribute("tabindex", "0");
    fig.setAttribute("role", "button");
    fig.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", (e) => { e.stopPropagation(); show(idx - 1); });
  nextBtn.addEventListener("click", (e) => { e.stopPropagation(); show(idx + 1); });
  box.addEventListener("click", (e) => { if (e.target === box) close(); });

  addEventListener("keydown", (e) => {
    if (!box.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });

  // swipe on touch
  let sx = 0;
  box.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();

/* ---------- Footer year ---------- */
(() => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
