/* ============================================================
   Aryan Mitta — Space Portfolio · interactions
   ============================================================ */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE  = matchMedia("(pointer: coarse)").matches;

/* ---------- Interactive constellation ---------- */
(() => {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d", { alpha: true });
  let w, h, dpr, nodes = [], dust = [], shooting = null, paused = false;
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
    const n = Math.min(80, Math.floor((innerWidth * innerHeight) / 17000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18 * dpr,
      vy: (Math.random() - 0.5) * 0.18 * dpr,
      r: Math.random() * 1.3 + 0.6,
    }));
    const d = Math.min(90, Math.floor((innerWidth * innerHeight) / 14000));
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

  const LINK = 150 * dpr;       // recomputed below per-frame via factor
  function draw() {
    if (paused) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, w, h);
    const linkDist = 150 * dpr;
    const mouseDist = 200 * dpr;
    const mx = mouse.x * dpr, my = mouse.y * dpr;

    // faint background dust
    for (const s of dust) {
      s.tw += s.tws;
      ctx.globalAlpha = (0.4 + Math.sin(s.tw) * 0.4) * 0.5;
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * dpr, 0, 6.2832); ctx.fill();
    }

    // move + draw nodes
    for (const p of nodes) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
    }

    // links between nodes
    ctx.lineWidth = 1 * dpr;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < linkDist) {
          ctx.globalAlpha = (1 - dist / linkDist) * 0.22;
          ctx.strokeStyle = "#9fb0ff";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      // link to cursor
      const dmx = a.x - mx, dmy = a.y - my;
      const dm = Math.hypot(dmx, dmy);
      let near = false;
      if (dm < mouseDist) {
        near = true;
        ctx.globalAlpha = (1 - dm / mouseDist) * 0.5;
        ctx.strokeStyle = "#aebcff";
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
      }
      // node dot
      ctx.globalAlpha = near ? 0.95 : 0.6;
      ctx.fillStyle = near ? "#cdd6ff" : "#aab4d8";
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r * dpr, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // shooting star
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
    requestAnimationFrame(draw);
  }

  addEventListener("resize", resize, { passive: true });
  if (!COARSE) addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener("mouseout", () => { mouse.x = -9999; mouse.y = -9999; });
  document.addEventListener("visibilitychange", () => { paused = document.hidden; });
  resize(); draw();
  if (!REDUCED) setInterval(() => { if (!shooting && !paused && Math.random() > 0.55) spawnShooting(); }, 5500);
})();

/* ---------- Custom cursor + spotlight + planet parallax ---------- */
(() => {
  if (COARSE || REDUCED) return;
  const cursor = document.getElementById("cursor");
  const spot = document.getElementById("spotlight");
  const planet = document.querySelector(".planet");
  let tx = innerWidth / 2, ty = innerHeight * 0.3;
  let cx = tx, cy = ty, sx = tx, sy = ty, shown = false;

  addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    cursor.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    if (!shown) { cursor.classList.add("is-visible"); shown = true; }
  }, { passive: true });

  // grow cursor over interactive elements
  document.querySelectorAll("a, button, .about__tags li, .chips span").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });

  (function loop() {
    sx += (tx - sx) * 0.08; sy += (ty - sy) * 0.08;
    spot.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
    if (planet) {
      const px = (sx / innerWidth - 0.5) * 26, py = (sy / innerHeight - 0.5) * 26;
      planet.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }
    requestAnimationFrame(loop);
  })();
})();

/* ---------- Card cursor-spotlight glow ---------- */
(() => {
  if (COARSE) return;
  const cards = document.querySelectorAll(".xp__card, .skill-card, .lead-card, .edu-card, .mission, .contact");
  cards.forEach((card) => {
    card.classList.add("glow-target");
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
    card.addEventListener("pointerenter", () => card.classList.add("is-glow"));
    card.addEventListener("pointerleave", () => card.classList.remove("is-glow"));
  });
})();

/* ---------- Nav ---------- */
(() => {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const progress = document.getElementById("scrollProgress");
  const anchors = [...links.querySelectorAll("a")];
  const sections = anchors.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  let ticking = false;

  function update() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 30);
    const docH = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";
    let current = sections[0];
    for (const sec of sections) if (sec.getBoundingClientRect().top <= innerHeight * 0.35) current = sec;
    anchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + (current && current.id)));
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
  toggle.addEventListener("click", () => { links.classList.toggle("open"); toggle.classList.toggle("open"); });
  links.addEventListener("click", (e) => { if (e.target.tagName === "A") { links.classList.remove("open"); toggle.classList.remove("open"); } });
})();

/* ---------- Scroll reveal ---------- */
(() => {
  const items = document.querySelectorAll(".reveal");
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

/* ---------- Stat counters ---------- */
(() => {
  const nums = document.querySelectorAll(".stat__num");
  const fmt = (v, t) => (Number.isInteger(t) ? Math.round(v).toString() : v.toFixed(1));
  const run = (el) => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || "";
    const start = performance.now(), dur = 1500;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e, target) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
})();

/* ---------- Fly-by rocket ---------- */
(() => {
  if (REDUCED) return;
  const rocket = document.getElementById("rocket");
  if (!rocket) return;
  let flying = false;

  function launch() {
    if (flying || document.hidden) return;
    flying = true;
    const dur = 5 + Math.random() * 2.5;
    rocket.style.setProperty("--dur", dur + "s");
    rocket.style.setProperty("--y0", (68 + Math.random() * 26) + "vh");
    rocket.style.setProperty("--y1", (4 + Math.random() * 34) + "vh");
    rocket.style.setProperty("--rot", (48 + Math.random() * 18) + "deg");
    rocket.classList.remove("rocket--fly");
    void rocket.offsetWidth;            // force reflow to restart animation
    rocket.classList.add("rocket--fly");
    setTimeout(() => { rocket.classList.remove("rocket--fly"); flying = false; }, dur * 1000 + 120);
  }

  setTimeout(launch, 3200);                                  // first flyby after load
  setInterval(() => { if (Math.random() > 0.4) launch(); }, 15000);  // periodic

  const brand = document.querySelector(".nav__brand");       // easter egg: click logo to launch
  if (brand) brand.addEventListener("click", () => launch());
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

document.getElementById("year").textContent = new Date().getFullYear();
