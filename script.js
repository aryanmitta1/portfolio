/* ============================================================
   Aryan Mitta — Space Portfolio · interactions
   ============================================================ */

/* ---------- Starfield: subtle white stars on black ---------- */
(() => {
  const canvas = document.getElementById("starfield");
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, dpr, stars = [], shooting = null, scrollY = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(innerWidth * dpr);
    h = canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    build();
  }
  function build() {
    const count = Math.min(220, Math.floor((innerWidth * innerHeight) / 7800));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.85 + 0.15,
      r: Math.random() * 1.1 + 0.25,
      tw: Math.random() * Math.PI * 2,
      tws: Math.random() * 0.015 + 0.004,
    }));
  }
  function spawnShooting() {
    if (reduced) return;
    shooting = {
      x: Math.random() * w * 0.7, y: Math.random() * h * 0.35,
      vx: (Math.random() * 4 + 5) * dpr, vy: (Math.random() * 1.8 + 2) * dpr, life: 1,
    };
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.tw += s.tws;
      const tw = 0.5 + Math.sin(s.tw) * 0.5;
      const py = (s.y + scrollY * s.z * 0.12 * dpr) % h;
      const yy = py < 0 ? py + h : py;
      ctx.globalAlpha = tw * (0.25 + s.z * 0.55);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, yy, s.r * (0.5 + s.z) * dpr, 0, Math.PI * 2);
      ctx.fill();
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
    requestAnimationFrame(draw);
  }
  addEventListener("resize", resize, { passive: true });
  addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
  resize(); draw();
  if (!reduced) setInterval(() => { if (!shooting && Math.random() > 0.45) spawnShooting(); }, 5200);
})();

/* ---------- Mouse spotlight + planet parallax ---------- */
(() => {
  if (matchMedia("(pointer: coarse)").matches) return;
  const root = document.documentElement;
  const planet = document.querySelector(".planet");
  let tx = 50, ty = 30, cx = 50, cy = 30;
  addEventListener("mousemove", (e) => {
    tx = (e.clientX / innerWidth) * 100;
    ty = (e.clientY / innerHeight) * 100;
  }, { passive: true });
  (function loop() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    root.style.setProperty("--mx", cx + "%");
    root.style.setProperty("--my", cy + "%");
    if (planet) {
      const px = (cx - 50) * 0.18, py = (cy - 50) * 0.18;
      planet.style.transform = `translate(${px}px, ${py}px)`;
    }
    requestAnimationFrame(loop);
  })();
})();

/* ---------- Nav: scroll state, mobile, active link ---------- */
(() => {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const progress = document.getElementById("scrollProgress");
  const anchors = [...links.querySelectorAll("a")];
  const sections = anchors.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 30);
    const docH = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";
    let current = sections[0];
    for (const sec of sections) if (sec.getBoundingClientRect().top <= innerHeight * 0.35) current = sec;
    anchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + (current && current.id)));
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toggle.addEventListener("click", () => { links.classList.toggle("open"); toggle.classList.toggle("open"); });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") { links.classList.remove("open"); toggle.classList.remove("open"); }
  });
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

document.getElementById("year").textContent = new Date().getFullYear();
