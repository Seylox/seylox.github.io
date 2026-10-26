// BERND.md v2: the night drive.
// Turns scroll position into a camera moving along a road of signs.
// Without this script (or with reduced motion) the page stays a plain document.
(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches || !CSS.supports("transform", "translate3d(0, 0, 0)")) return;

  const root = document.documentElement;
  const world = document.getElementById("world");
  const scene = document.querySelector(".scene");
  const track = document.querySelector(".track");
  const signs = [...world.querySelectorAll(".sign")];
  const hud = {
    exit: document.querySelector(".hud__exit"),
    name: document.querySelector(".hud__name"),
    kmh: document.querySelector(".hud__kmh"),
    list: document.querySelector(".hud__list"),
    exits: document.querySelector(".hud__exits"),
  };

  // Words that line the road. Decorative, so they live here and not in the HTML.
  const WORDS = [
    "Android", "iOS", "Agents", "Releases", "Graz", "Kotlin", "C++", "Flutter",
    "React Native", ".NET", "Cordova", "OCR", "SDK", "Hiring", "1-on-1s", "Retros",
    "Context", "Review", "Docs", "CI", "TU Graz", "Dublin", "Droidcon", "Kinect",
    "AR", "Z-Wave", "Raspberry Pi", "Merge request", "Coffee", "Writing", "Map",
    "Intern", "Changelog", "Typeright", "iTranslate", "Anyline", "Shipping",
  ];
  const TREE_COLORS = ["#ff3d7f", "#ff7a1a", "#ffd27a", "#c13cff"];

  root.classList.add("drive");

  const narrow = window.matchMedia("(max-width: 700px)");
  const isStep = (el) => el.matches(".sign--warn, .sign--mile");

  // ---- Road layout: z position of each stop ----
  let stops = [];
  function layoutRoad() {
    const gapLong = narrow.matches ? 1500 : 2400;
    const gapShort = narrow.matches ? 1000 : 1500;
    let z = 0;
    stops = signs.map((sign, i) => {
      if (i > 0) z += isStep(sign) && (isStep(signs[i - 1]) || signs[i - 1].matches("#limitations, #changelog")) ? gapShort : gapLong;
      sign.style.setProperty("--z", `${-z}px`);
      return z;
    });
    world.style.setProperty("--persp", narrow.matches ? "620px" : "900px");
  }

  // ---- Trees ----
  let trees = [];
  function plantTrees() {
    trees.forEach((t) => t.el.remove());
    trees = [];
    const end = stops[stops.length - 1] + 2000;
    const spacing = narrow.matches ? 420 : 260;
    const road = narrow.matches ? 260 : 620;
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let z = 600, i = 0; z < end; z += spacing * (0.6 + rand() * 0.8), i++) {
      const el = document.createElement("span");
      el.className = "tree";
      el.setAttribute("aria-hidden", "true");
      el.textContent = WORDS[i % WORDS.length];
      const side = i % 2 ? 1 : -1;
      const x = side * (road + rand() * (narrow.matches ? 220 : 900));
      el.style.setProperty("--x", `${x}px`);
      el.style.setProperty("--y", `${narrow.matches ? 200 : 260}px`);
      el.style.setProperty("--z", `${-z}px`);
      el.style.setProperty("--size", `${Math.round((narrow.matches ? 26 : 34) + rand() * (narrow.matches ? 30 : 60))}px`);
      el.style.setProperty("--tree", TREE_COLORS[Math.floor(rand() * TREE_COLORS.length)]);
      world.prepend(el);
      trees.push({ el, z });
    }
  }

  // ---- Scroll plan: park at each sign, then drive to the next ----
  let plan = [];
  let total = 0;
  function buildPlan() {
    const vh = window.innerHeight;
    const park = vh * 0.55;
    const perZ = (vh * 0.75) / 2000; // scroll px per z px while driving
    let y = 0;
    plan = stops.map((z, i) => {
      const next = stops[i + 1];
      const seg = { start: y, parkEnd: y + park, from: z, to: next ?? z };
      seg.end = next === undefined ? seg.parkEnd : seg.parkEnd + (next - z) * perZ;
      y = seg.end;
      return seg;
    });
    total = y;
    track.style.height = `${total + vh}px`;
    track.replaceChildren(...plan.map((seg) => {
      const s = document.createElement("div");
      s.className = "snap";
      s.style.top = `${seg.start}px`;
      return s;
    }));
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function camAt(y) {
    for (const seg of plan) {
      if (y < seg.parkEnd) return seg.from;
      if (y < seg.end) return seg.from + (seg.to - seg.from) * ease((y - seg.parkEnd) / (seg.end - seg.parkEnd));
    }
    return stops[stops.length - 1];
  }

  // ---- Exits menu ----
  const exitNames = [];
  function buildExits() {
    signs.forEach((sign, i) => {
      const name = sign.dataset.exit;
      if (!exitNames.some((e) => e.name === name)) exitNames.push({ name, index: i });
    });
    hud.list.replaceChildren(...exitNames.map((exit, n) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = `<span>${String(n + 1).padStart(2, "0")}</span>`;
      btn.append(exit.name);
      btn.addEventListener("click", () => {
        hud.exits.open = false;
        window.scrollTo({ top: plan[exit.index].start, behavior: "smooth" });
      });
      li.append(btn);
      return li;
    }));
  }

  // ---- Render ----
  let lastCam = 0;
  let speed = 0;
  let current = -1;
  let ticking = false;

  function render() {
    ticking = false;
    const cam = camAt(window.scrollY);
    world.style.setProperty("--cam", `${cam}px`);
    scene.style.setProperty("--road", (cam * 0.35).toFixed(1));

    const fog = narrow.matches ? 2600 : 3800;
    signs.forEach((sign, i) => {
      const ahead = stops[i] - cam;
      let o;
      if (ahead < -350 || ahead > fog) o = 0;
      else if (ahead < 0) o = 1 + ahead / 350;
      else o = Math.min(1, 1.15 - ahead / fog);
      sign.style.opacity = o.toFixed(3);
      sign.style.visibility = o > 0.01 ? "visible" : "hidden";
      sign.style.pointerEvents = Math.abs(ahead) < 120 ? "auto" : "none";
      sign.style.zIndex = Math.max(0, Math.round(6000 - ahead / 2));
    });
    trees.forEach((t) => {
      const ahead = t.z - cam;
      const o = ahead < 80 || ahead > fog ? 0 : Math.min(1, (fog - ahead) / (fog * 0.5), (ahead - 80) / 300);
      t.el.style.opacity = o.toFixed(3);
      t.el.style.visibility = o > 0.01 ? "visible" : "hidden";
      t.el.style.zIndex = Math.max(0, Math.round(6000 - ahead / 2));
    });

    // HUD: nearest stop at or before the camera
    let idx = 0;
    for (let i = 0; i < stops.length; i++) if (stops[i] <= cam + 300) idx = i;
    if (idx !== current) {
      current = idx;
      const sign = signs[idx];
      const exitNo = exitNames.findIndex((e) => e.name === sign.dataset.exit) + 1;
      hud.exit.textContent = `Exit ${String(exitNo).padStart(2, "0")} / ${String(exitNames.length).padStart(2, "0")}`;
      hud.name.textContent = sign.dataset.year ? `${sign.dataset.exit} · ${sign.dataset.year}` : sign.dataset.step ? `${sign.dataset.exit} · ${sign.dataset.step}` : sign.dataset.exit;
    }

    // Speedometer: smoothed camera speed, settles to 0 when parked
    const target = Math.min(299, Math.abs(cam - lastCam) * 1.6);
    speed += (target - speed) * 0.25;
    lastCam = cam;
    hud.kmh.textContent = Math.round(speed);
    if (speed > 0.5) schedule();
  }

  function schedule() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  // Keyboard users: tabbing to a link in a far-away sign drives there.
  world.addEventListener("focusin", (e) => {
    const sign = e.target.closest(".sign");
    if (!sign) return;
    const i = signs.indexOf(sign);
    if (Math.abs(stops[i] - camAt(window.scrollY)) > 50) window.scrollTo({ top: plan[i].start });
  });

  // Back to the flat document if the user turns on reduced motion mid-visit.
  reduce.addEventListener("change", () => window.location.reload());

  function setup() {
    layoutRoad();
    plantTrees();
    buildPlan();
    render();
  }

  buildExits();
  setup();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", () => { setup(); });
})();
