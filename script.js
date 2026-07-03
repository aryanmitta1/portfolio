/* ============================================================
   Aryan Mitta — Space Portfolio · interactions
   ============================================================ */

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const COARSE  = matchMedia("(pointer: coarse)").matches;

/* ---------- Interactive constellation ---------- */
(() => {
  const canvas = document.getElementById("starfield");
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
  const FRAME = 1000 / 30;       // cap at 30fps to cut sustained CPU/GPU load
  function draw(now) {
    rafId = requestAnimationFrame(draw);
    if (now - last < FRAME) return;
    last = now;
    ctx.clearRect(0, 0, w, h);
    const linkDist = 150 * dpr;
    const mouseDist = 200 * dpr;
    const mx = mouse.x * dpr, my = mouse.y * dpr;

    // faint background dust
    ctx.fillStyle = "#fff";
    for (const s of dust) {
      s.tw += s.tws;
      ctx.globalAlpha = (0.4 + Math.sin(s.tw) * 0.4) * 0.5;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * dpr, 0, 6.2832); ctx.fill();
    }

    // move + draw nodes
    for (const p of nodes) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
      if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
    }

    // links between nodes — compare squared distances and only take the sqrt
    // for pairs actually within range (the vast majority are not), avoiding a
    // Math.hypot call on every O(n²) pair.
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
      // link to cursor
      const dmx = a.x - mx, dmy = a.y - my;
      const dmSq = dmx * dmx + dmy * dmy;
      let near = false;
      if (dmSq < mouseDistSq) {
        near = true;
        ctx.globalAlpha = (1 - Math.sqrt(dmSq) / mouseDist) * 0.5;
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
  }

  function start() { if (!rafId) { last = 0; rafId = requestAnimationFrame(draw); } }
  function stop()  { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

  // Only run while the hero is on screen AND the tab is visible — the
  // constellation lives in the hero, so there's no reason to animate a
  // full-screen canvas while the user reads the rest of the page.
  let heroOnScreen = true;
  function evaluate() { (heroOnScreen && !document.hidden) ? start() : stop(); }

  addEventListener("resize", resize, { passive: true });
  if (!COARSE) addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener("mouseout", () => { mouse.x = -9999; mouse.y = -9999; });
  document.addEventListener("visibilitychange", evaluate);

  const heroEl = document.getElementById("hero");
  if (heroEl && "IntersectionObserver" in window) {
    new IntersectionObserver((e) => { heroOnScreen = e[0].isIntersecting; evaluate(); }, { threshold: 0 }).observe(heroEl);
  }

  resize(); evaluate();
  if (!REDUCED) setInterval(() => { if (!shooting && heroOnScreen && !document.hidden && Math.random() > 0.55) spawnShooting(); }, 5500);
})();

/* ---------- Custom cursor + spotlight + planet parallax ---------- */
(() => {
  if (COARSE || REDUCED) return;
  const cursor = document.getElementById("cursor");
  const spot = document.getElementById("spotlight");
  const planet = document.querySelector(".planet");
  let tx = innerWidth / 2, ty = innerHeight * 0.3;
  let sx = tx, sy = ty, raf = 0, shown = false;

  function frame() {
    sx += (tx - sx) * 0.1; sy += (ty - sy) * 0.1;
    spot.style.transform = `translate3d(${sx}px, ${sy}px, 0)`;
    if (planet) {
      const px = (sx / innerWidth - 0.5) * 26, py = (sy / innerHeight - 0.5) * 26;
      planet.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    }
    // keep animating only until it settles, then idle (no perpetual rAF)
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

  // grow cursor over interactive elements
  document.querySelectorAll("a, button, .about__tags li, .chips span").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });
})();

/* ---------- Card cursor-spotlight glow ---------- */
(() => {
  if (COARSE) return;
  const cards = document.querySelectorAll(".ccard, .skill-card, .edu-card, .contact");
  cards.forEach((card) => {
    card.classList.add("glow-target");
    // Cache the rect on enter and reuse it while hovering — a card doesn't move
    // under the cursor, so reading getBoundingClientRect() every pointermove
    // (which forces a synchronous layout) is pure waste.
    // Coalesce moves to one write per frame: the ::after glow only repaints
    // once per composited frame anyway, so setting --mx/--my on every event
    // (60–120Hz) is wasted style invalidation.
    let rect = null, raf = 0, mx = 0, my = 0;
    const write = () => { raf = 0; card.style.setProperty("--mx", mx + "px"); card.style.setProperty("--my", my + "px"); };
    card.addEventListener("pointerenter", () => { rect = card.getBoundingClientRect(); card.classList.add("is-glow"); });
    card.addEventListener("pointermove", (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      mx = e.clientX - rect.left; my = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(write);
    });
    card.addEventListener("pointerleave", () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } card.classList.remove("is-glow"); rect = null; });
  });
})();

/* ---------- Nav ---------- */
(() => {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const progress = document.getElementById("scrollProgress");
  const anchors = [...links.querySelectorAll("a")];
  const sectionAnchors = anchors.filter((a) => (a.getAttribute("href") || "").startsWith("#"));
  const sections = sectionAnchors.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  // Progress bar + "scrolled" state: the scroll frame reads ONLY window.scrollY
  // (never layout), so it can't force a reflow. docH is cached and refreshed
  // off the scroll path. Progress is a composited scaleX, not a width change.
  let docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let ticking = false;
  function update() {
    ticking = false;
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 30);
    if (progress) progress.style.transform = "scaleX(" + Math.min(1, y / docH) + ")";
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  let rt;
  function remeasure() { docH = Math.max(1, document.documentElement.scrollHeight - innerHeight); update(); }
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(remeasure, 150); }, { passive: true });
  addEventListener("load", remeasure);
  // content-visibility sections settle to their real height after first paint,
  // which changes total scroll height. A ResizeObserver refreshes docH off the
  // scroll path (no per-frame layout read) so the progress bar stays accurate.
  if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(document.body);
  update();

  // Active section: IntersectionObserver with a thin trigger band at ~35% of
  // the viewport height. Whichever section straddles that line wins. This runs
  // off the main scroll thread — zero layout reads, no drift, no jank.
  if (sections.length && "IntersectionObserver" in window) {
    const visible = new Set();
    const setActive = (el) => {
      const href = "#" + el.id;
      sectionAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === href));
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
      // among sections crossing the band, choose the lowest one in document order
      let best = null;
      for (const s of sections) if (visible.has(s)) best = s;
      if (best) setActive(best);
    }, { rootMargin: "-35% 0px -65% 0px", threshold: 0 });
    sections.forEach((s) => io.observe(s));
    sectionAnchors[0].classList.add("active");
  }

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
  const run = (el) => {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || "";
    const decimals = (el.dataset.target.split(".")[1] || "").length;
    const fmt = (v) => v.toFixed(decimals);
    const start = performance.now(), dur = 1500;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
})();

/* ---------- Freeze offscreen CSS animations (hero, marquee) ---------- */
(() => {
  const targets = document.querySelectorAll(".hero, .marquee");
  if (!targets.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("anim-paused", !e.isIntersecting));
  }, { threshold: 0 });
  targets.forEach((t) => io.observe(t));
})();

/* ---------- Coursework constellation: draw lines + hover tooltip ---------- */
(() => {
  const map = document.getElementById("starmap");
  if (!map) return;

  // draw the connecting lines once the map scrolls into view
  if (!("IntersectionObserver" in window)) { map.classList.add("is-drawn"); }
  else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { map.classList.add("is-drawn"); io.unobserve(map); } });
    }, { threshold: 0.3 });
    io.observe(map);
  }

  // single shared tooltip, repositioned over whichever star is active
  const tip = document.getElementById("starTip");
  if (!tip) return;
  const tName = tip.querySelector(".starmap__tip-name");
  const tCourse = tip.querySelector(".starmap__tip-course");
  const stars = map.querySelectorAll(".star");

  function show(star) {
    tName.textContent = star.getAttribute("data-name") || "";
    tCourse.innerHTML = star.getAttribute("data-course") || "";
    // place tip at the star's center (star uses --x / --y percentages)
    const xv = star.style.getPropertyValue("--x");
    const yv = star.style.getPropertyValue("--y");
    tip.style.left = xv;
    tip.style.top = yv;
    // flip below the star when it sits near the top edge, else float above
    const yNum = parseFloat(yv);
    tip.classList.toggle("starmap__tip--below", yNum < 22);
    tip.classList.add("is-on");
  }
  function hide() { tip.classList.remove("is-on"); }

  stars.forEach((s) => {
    s.addEventListener("mouseenter", () => show(s));
    s.addEventListener("focus", () => show(s));
    s.addEventListener("mouseleave", hide);
    s.addEventListener("blur", hide);
  });
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

/* ---------- Decrypt / scramble role line ---------- */
(() => {
  const el = document.getElementById("decryptText");
  if (!el || REDUCED) return;
  const titles = [
    "Avionics Software Engineer", "Embedded Systems Developer", "Aerospace Software",
    "Telemetry & Test Engineer", "Sensor Fusion Tinkerer",
  ];
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&_/<>*";
  let idx = 0, heroSeen = true;

  const hero = document.getElementById("hero");
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver((e) => { heroSeen = e[0].isIntersecting; }, { threshold: 0.05 }).observe(hero);
  }

  const STEP = 1000 / 60;   // logical frame length the effect was tuned at
  const RENDER = 1000 / 30; // but only touch the DOM ~30×/sec, not per rAF
  function scrambleTo(text) {
    return new Promise((resolve) => {
      const from = el.textContent;
      const len = Math.max(from.length, text.length);
      const q = [];
      for (let i = 0; i < len; i++) {
        q.push({ a: from[i] || "", b: text[i] || "", s: Math.floor(Math.random() * 16), e: 0, c: "" });
        q[i].e = q[i].s + 10 + Math.floor(Math.random() * 16);
      }
      // Build the per-character cells ONCE for this transition; each frame we
      // then only mutate textContent / toggle the class — no innerHTML reparse,
      // no node churn. `frame` is derived from the rAF timestamp so the effect
      // keeps the same duration regardless of the display's refresh rate.
      el.textContent = "";
      const cells = q.map(() => el.appendChild(document.createElement("span")));
      let startT = -1, lastT = -1e9;
      function tick(now) {
        if (startT < 0) startT = now;
        if (now - lastT < RENDER) { requestAnimationFrame(tick); return; }
        lastT = now;
        const frame = ((now - startT) / STEP) | 0;
        let done = 0;
        for (let i = 0; i < q.length; i++) {
          const it = q[i], cell = cells[i];
          if (frame >= it.e) {
            done++;
            if (cell.className) cell.className = "";
            if (cell.textContent !== it.b) cell.textContent = it.b;
          } else if (frame >= it.s) {
            if (!it.c || Math.random() < 0.28) it.c = charset[(Math.random() * charset.length) | 0];
            if (cell.className !== "scramble") cell.className = "scramble";
            cell.textContent = it.c;
          } else if (cell.textContent !== it.a) {
            cell.className = "";
            cell.textContent = it.a;
          }
        }
        if (done === q.length) { resolve(); return; }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  async function loop() {
    while (true) {
      await new Promise((r) => setTimeout(r, 2400));
      if (document.hidden || !heroSeen) continue;   // don't churn the DOM when unseen
      idx = (idx + 1) % titles.length;
      await scrambleTo(titles[idx]);
    }
  }
  setTimeout(loop, 1400);
})();

/* ---------- Ambient sound (off by default) ---------- */
(() => {
  const btn = document.getElementById("soundToggle");
  if (!btn) return;
  let ctx, master, started = false, on = false;

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 340; lp.connect(master);
    const bus = ctx.createGain(); bus.gain.value = 0.5; bus.connect(lp);
    [[55, "sine", 0.4], [55.5, "sine", 0.4], [82.5, "triangle", 0.12]].forEach(([f, type, g]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const gn = ctx.createGain(); gn.gain.value = g; o.connect(gn); gn.connect(bus); o.start();
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = 0.16; lfo.connect(lg); lg.connect(master.gain); lfo.start();
    started = true; return true;
  }
  function setOn(v) {
    on = v; btn.classList.toggle("is-on", on);
    if (on) {
      if (!started && !build()) { on = false; btn.classList.remove("is-on"); return; }
      if (ctx.resume) ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.8);
    } else if (started) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    }
  }
  btn.addEventListener("click", () => setOn(!on));

  window.__spaceWhoosh = function () {
    if (!on || !started) return;
    const t = ctx.currentTime, dur = 0.9;
    const buf = ctx.createBuffer(1, (ctx.sampleRate * dur) | 0, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(280, t); bp.frequency.exponentialRampToValueAtTime(1700, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t + dur);
  };
})();

/* ---------- Focused-card carousels (experience + on-campus) ---------- */
(() => {
  const roots = document.querySelectorAll(".carousel");
  if (!roots.length) return;

  roots.forEach((root) => {
    const viewport = root.querySelector(".carousel__viewport");
    const track = root.querySelector(".carousel__track");
    const cards = Array.from(track.children);
    const dotsWrap = root.querySelector(".carousel__dots");
    const prev = root.querySelector(".carousel__arrow--prev");
    const next = root.querySelector(".carousel__arrow--next");
    if (!cards.length) return;

    const start = parseInt(root.getAttribute("data-start") || "0", 10);
    let idx = Math.min(Math.max(0, start), cards.length - 1);

    // build dots
    cards.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "carousel__dot";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Card ${i + 1} of ${cards.length}`);
      b.addEventListener("click", () => { idx = i; render(); });
      dotsWrap.appendChild(b);
    });
    const dots = Array.from(dotsWrap.children);

    function render() {
      const vpCenter = viewport.clientWidth / 2;
      const card = cards[idx];
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      track.style.transform = `translateX(${vpCenter - cardCenter}px)`;
      cards.forEach((c, i) => c.classList.toggle("is-active", i === idx));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
    }

    function go(delta) { idx = (idx + delta + cards.length) % cards.length; render(); }
    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));

    // clicking a side card brings it to focus
    cards.forEach((c, i) => c.addEventListener("click", () => { if (i !== idx) { idx = i; render(); } }));

    // keyboard support when carousel is focused
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
      else if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
    });

    let rAF;
    const recenter = () => { cancelAnimationFrame(rAF); rAF = requestAnimationFrame(render); };
    window.addEventListener("resize", recenter);
    // The carousel's section uses content-visibility:auto, so while it's off
    // screen its subtree isn't laid out and offsets read 0 — re-center every
    // time it scrolls into view so the intended card is actually centered.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) recenter();
      }, { threshold: 0.1 }).observe(root);
    }
    // Re-center once web fonts settle (text reflow changes card width).
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recenter);
    recenter();
  });
})();

document.getElementById("year").textContent = new Date().getFullYear();
