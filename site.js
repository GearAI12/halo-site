// Halo site motion: load-in, scroll reveals, scroll-scrubbed statement and
// phones, count-ups and the live clock pill. No dependencies.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  requestAnimationFrame(() => {
    body.classList.add("loaded");
    document.documentElement.style.setProperty("--load", "1");
  });

  // reveal once in view
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // count-ups
  const fmt = new Intl.NumberFormat("en-US");
  const countIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      countIO.unobserve(e.target);
      const el = e.target, to = +el.dataset.count;
      if (reduce) { el.textContent = fmt.format(to); continue; }
      const t0 = performance.now(), dur = 1600;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt.format(Math.round(to * eased));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => countIO.observe(el));

  // scroll-driven: hero parallax, statement words, phone tilt
  const statement = document.querySelector(".statement");
  const words = statement ? [...statement.querySelectorAll(".w")] : [];
  const scrubs = [...document.querySelectorAll(".feature[data-scrub]")];
  const root = document.documentElement;
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    body.classList.toggle("scrolled", y > vh * 0.5);
    if (reduce) return;
    if (y < vh * 1.5) root.style.setProperty("--sy", y.toFixed(0));

    if (statement) {
      const r = statement.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
      const lit = p * 1.25 * words.length;
      words.forEach((w, i) => w.style.setProperty("--o", (0.16 + 0.84 * Math.min(1, Math.max(0, lit - i))).toFixed(3)));
    }
    for (const f of scrubs) {
      const r = f.getBoundingClientRect();
      // 0 when the section top enters the bottom of the screen, 1 by mid-screen
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      f.style.setProperty("--p", p.toFixed(3));
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();

  // live clock pill: rolling digits, time spent on this page
  const clock = document.querySelector("[data-clock]");
  if (clock) {
    clock.textContent = "";
    const cols = [];
    "00:00".split("").forEach((ch) => {
      if (ch === ":") { clock.append(":"); return; }
      const d = document.createElement("span"); d.className = "digit";
      const inner = document.createElement("span");
      for (let n = 0; n <= 9; n++) { const s = document.createElement("span"); s.textContent = n; inner.append(s); }
      d.append(inner); clock.append(d); cols.push(inner);
    });
    const start = Date.now();
    const tick = () => {
      const s = Math.floor((Date.now() - start) / 1000);
      const str = String(Math.min(99, Math.floor(s / 60))).padStart(2, "0") + String(s % 60).padStart(2, "0");
      cols.forEach((c, i) => { c.style.transform = `translateY(${-1.2 * +str[i]}em)`; });
    };
    tick(); setInterval(tick, 1000);
  }
})();
