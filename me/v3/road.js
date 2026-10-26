// BERND.md v3: a pseudo-3D road, OutRun style, with the content on billboards beside it.
// A track of short segments (each with a curve and a height) is projected onto a 2D canvas
// every frame, front to back, with the camera behind a pixel-art car. The billboards are the
// page's real HTML, placed and scaled at their projected roadside point. Scrolling drives;
// letting go parks at the nearest billboard. The road runs through four biomes (jungle,
// swamp, city, beach) and ends at the sea.
// Method after Jake Gordon's "Javascript Racer" write-ups.
// Without this script (or with reduced motion) the page stays a plain document.
(() => {
  "use strict";

  const root = document.documentElement;
  const canvas = document.querySelector(".road-canvas");
  // Read back every frame to apply the palette; small enough that the CPU canvas is faster.
  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  const world = document.getElementById("world");
  const topbar = document.querySelector(".topbar");
  const agentView = document.getElementById("view-agent");
  const signs = [...world.querySelectorAll(".sign")];
  const hud = {
    bar: document.querySelector(".hud"),
    exit: document.querySelector(".hud__exit"),
    name: document.querySelector(".hud__name"),
    kmh: document.querySelector(".hud__kmh"),
    list: document.querySelector(".hud__list"),
    exits: document.querySelector(".hud__exits"),
    prev: document.querySelector(".hud__prev"),
    next: document.querySelector(".hud__next"),
  };
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduce = reduceQuery.matches;

  // ---- Tuning ----
  const SEGMENT = 200;         // world units per segment
  const RUMBLE = 3;            // segments per colour band
  const ROAD_WIDTH = 2000;     // half width, world units
  const LANES = 3;
  const CAM_HEIGHT = 1000;
  const FOV = 100;             // degrees
  const DEPTH = 1 / Math.tan((FOV / 2) * Math.PI / 180);
  const DRAW = 300;            // segments ahead
  const FOG = 5;
  const KMH = 1 / 60;          // world units per second to km/h on the dial
  const HOP = 1.1;             // seconds from one billboard to the next; longer jumps take a bit longer

  // Billboards
  const READ_Z = 22 * SEGMENT; // camera distance at which a board shows at 1:1
  const FIRST_BOARD = 50;      // segment of the first board
  const GAP = 60;              // segments between boards
  const GAP_BIOME = 96;        // ... and where the landscape changes
  const TRANSITION = 30;       // segments over which one biome blends into the next
  const POST = 30;             // post height in board pixels
  const MARGIN = 12;

  // ---- Biomes, in road order. Night throughout; each one tints sky, fog and ground. ----
  const BIOMES = [
    { name: "jungle", sky: ["#04080a", "#0c1f1d", "#2e1a3a", "#8a2350"], fog: "#173326", grass: ["#0d2114", "#09180f"], rim: "#27c992" },
    { name: "swamp",  sky: ["#05090c", "#0e1f25", "#2a2541", "#6e2c52"], fog: "#1b3436", grass: ["#0c2128", "#08181d"], rim: "#62bfe0" },
    { name: "city",   sky: ["#07050c", "#1a0b2e", "#4a1240", "#a02a5a"], fog: "#3a1238", grass: ["#2a1d36", "#221730"], rim: "#ff3d7f" },
    { name: "beach",  sky: ["#07050c", "#1b0d34", "#43164e", "#c0365c"], fog: "#3c1840", grass: ["#3a2630", "#31202a"], rim: "#ff7a1a" },
  ];
  const ROAD = [
    { road: "#1d1328", rumble: "#ff7a1a", lane: "#f1e9e4" },
    { road: "#1a1124", rumble: "#ff2d6f", lane: null },
  ];
  const DARK = "#0b0712";

  // ---- Palette: every frame is reduced to these colours with ordered dithering, like a
  // 16-bit console. Three groups cycle instead of being redrawn: waves, lava, neon signs.
  // Their colours are reserved: only pixels drawn in exactly that colour take part. ----
  const CYCLES = {
    sea: { colors: ["#1b1b45", "#232458", "#151538", "#2c2d6a"], rate: 1.2 },
    lava: { colors: ["#ffd47c", "#ff7c1c", "#ff2f71", "#ff7c1c"], rate: 5 },
    neon: { colors: ["#ff3e81", "#a8285a", "#ffd0e2", "#ff3e81"], rate: 6 },
  };
  const SEA = CYCLES.sea.colors;
  const hexMix = (a, b, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");
  const dimRim = (rim) => hexMix(rim, DARK, 0.55); // inner detail lines of the scenery
  const FOAM = ["#ffc2d4", "#6a3462"];
  const PALETTE = [
    // skies and fog
    "#04080a", "#0c1f1d", "#2e1a3a", "#8a2350", "#05090c", "#0e1f25", "#2a2541", "#6e2c52",
    "#07050c", "#1a0b2e", "#4a1240", "#a02a5a", "#1b0d34", "#43164e", "#c0365c",
    "#173326", "#1b3436", "#3a1238", "#3c1840",
    // ground, road, sand
    "#0d2114", "#09180f", "#0c2128", "#08181d", "#2a1d36", "#221730", "#3a2630", "#31202a",
    "#1d1328", "#1a1124", "#f1e9e4", ...FOAM,
    // sun, lamps, neon, windows
    "#ffd27a", "#ffb454", "#ff7a1a", "#ff2d6f", "#ff3d7f", "#7ad7ff", "#27c992", "#62bfe0",
    "#fff3d6", "#ffffff", "#b9b4c4",
    // darks for scenery
    "#0b0712", "#0e0818", "#1d1128", "#24132f", "#14201f", "#06110b", "#132428", "#071417",
    "#1c0d2c", "#0d0617", "#1e0e2c", "#1a0e1c", "#3a3040", "#6a5a70",
    // the car
    "#2a1840", "#3e2364", "#583086", "#181022", "#261a38", "#18141e", "#847aa2",
    "#e8b48a", "#3a2418", "#f0c860", "#2a6fd0", "#c83c70", "#a0182c", "#ff3048", "#fff3c4",
    // traffic, wave crests
    "#103538", "#1c5a60", "#28909a", "#4a4f9a", "#8a90d0", "#2a2a5e", "#16163a", "#202048",
    ...BIOMES.map((b) => dimRim(b.rim)),
  ];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v / 16 - 0.47) * 12);
  const packRGB = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; };
  const paletteColors = [...PALETTE, ...Object.values(CYCLES).flatMap((c) => c.colors)];
  const paletteOut = new Uint32Array(paletteColors.map(packRGB));
  const reserved = new Map(); // exact colour -> palette index, for the cycling groups
  {
    let i = PALETTE.length;
    for (const cycle of Object.values(CYCLES)) {
      cycle.start = i;
      for (const c of cycle.colors) reserved.set(packRGB(c) & 0xffffff, i++);
    }
  }
  // Nearest palette colour for every 15-bit RGB value, worked out once.
  const LUT = (() => {
    const base = PALETTE.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
    const lut = new Uint8Array(32768);
    for (let r = 0; r < 32; r++) for (let g = 0; g < 32; g++) for (let b = 0; b < 32; b++) {
      const R = r * 8 + 4, G = g * 8 + 4, B = b * 8 + 4;
      let best = 0, bestD = Infinity;
      base.forEach(([pr, pg, pb], i) => {
        const d = (R - pr) ** 2 * 3 + (G - pg) ** 2 * 4 + (B - pb) ** 2 * 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      lut[(r << 10) | (g << 5) | b] = best;
    }
    return lut;
  })();

  function applyPalette() {
    for (const cycle of Object.values(CYCLES)) {
      const n = cycle.colors.length, shift = Math.floor(clock * cycle.rate);
      for (let k = 0; k < n; k++) paletteOut[cycle.start + k] = packRGB(cycle.colors[(k + shift) % n]);
    }
    const img = ctx.getImageData(0, 0, W, Hh);
    const px = new Uint32Array(img.data.buffer);
    const q = (v) => (v < 0 ? 0 : v > 255 ? 31 : v >> 3);
    for (let y = 0, i = 0; y < Hh; y++) {
      const row = (y & 3) << 2;
      for (let x = 0; x < W; x++, i++) {
        const v = px[i];
        let idx = reserved.get(v & 0xffffff);
        if (idx === undefined) {
          const t = BAYER[row | (x & 3)];
          idx = LUT[(q((v & 255) + t) << 10) | (q(((v >> 8) & 255) + t) << 5) | q(((v >> 16) & 255) + t)];
        }
        px[i] = paletteOut[idx];
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // ---- Small helpers ----
  let seed = 7; // seeded random, so the scenery is the same on every visit
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const between = (a, b) => a + (b - a) * rand();
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const side = () => (rand() < 0.5 ? -1 : 1);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const smootherstep = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    if (t <= 0) return a;
    const A = rgb(a), B = rgb(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
  };

  // ---- Billboards: one per .sign. data-biome marks the first sign of each biome. ----
  const boards = [];
  const bounds = [0]; // segment where each biome starts

  function placeBoards() {
    let seg = FIRST_BOARD;
    signs.forEach((el, i) => {
      const fresh = i > 0 && el.dataset.biome;
      if (i > 0) seg += fresh ? GAP_BIOME : GAP;
      if (fresh) bounds.push(seg - GAP_BIOME / 2);
      boards.push({ el, seg, side: i % 2 ? -1 : 1, w: 0, h: 0, gap: 0, sRead: 1, floor: 0, stopPos: 0, shown: false });
    });
  }

  function dressBoards() {
    for (const b of boards) {
      const post = document.createElement("span");
      post.className = "post";
      post.setAttribute("aria-hidden", "true");
      b.el.append(post);
      b.el.classList.add(b.side > 0 ? "sign--right" : "sign--left");
    }
  }

  // Which biome a segment is in, and how far it has blended into the next one.
  function biomeAt(n) {
    for (let k = 0; k < BIOMES.length - 1; k++) {
      const edge = bounds[k + 1];
      if (n < edge + TRANSITION / 2) return [k, smoothstep(edge - TRANSITION / 2, edge + TRANSITION / 2, n)];
    }
    return [BIOMES.length - 1, 0];
  }

  // ---- Sprites, drawn once into offscreen canvases. world = size in world units. ----
  function sprite(w, h, size, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.world = size;
    c.draw = draw;
    draw(c.getContext("2d"), w, h);
    return c;
  }

  // A dark silhouette with a neon rim: stroke wide in the rim colour, then cover the inside.
  // The rim is drawn at partial strength: up close, sprites get big and neon gets loud.
  const RIM_ALPHA = 0.7;
  function rimFill(g, rim, lw, path) {
    g.lineJoin = "round";
    g.lineWidth = lw;
    g.strokeStyle = rim;
    g.globalAlpha = RIM_ALPHA;
    path(); g.stroke();
    g.globalAlpha = 1;
    g.fillStyle = DARK;
    path(); g.fill();
  }
  function rimLine(g, rim, lw, path) {
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = rim; g.lineWidth = lw + 4; g.globalAlpha = RIM_ALPHA; path(); g.stroke();
    g.globalAlpha = 1;
    g.strokeStyle = DARK; g.lineWidth = lw; path(); g.stroke();
  }
  function strands(g, color, alpha, list) {
    g.strokeStyle = color;
    g.globalAlpha = alpha;
    g.lineWidth = 2;
    for (const [x, y, x2, y2] of list) {
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (x2 - x) * 0.2 + 4, (y + y2) / 2, x2, y2);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  const palm = (rim) => sprite(360, 480, { w: 2900, h: 3900 }, (g, w, h) => {
    const top = { x: w * 0.5, y: h * 0.2 };
    rimLine(g, rim, 15, () => {
      g.beginPath();
      g.moveTo(w * 0.42, h);
      g.quadraticCurveTo(w * 0.38, h * 0.55, top.x, top.y);
    });
    rimLine(g, rim, 9, () => {
      g.beginPath();
      for (const [dx, dy, cx, cy] of [
        [-150, 60, -80, -40], [-110, 110, -60, 10], [150, 70, 80, -40],
        [120, 120, 70, 10], [-40, -70, -30, -60], [60, -60, 40, -60], [10, 140, 0, 60],
      ]) {
        g.moveTo(top.x, top.y);
        g.quadraticCurveTo(top.x + cx, top.y + cy, top.x + dx, top.y + dy);
      }
    });
  });

  // Jungle: broadleaf trees, banana plants, ferns.
  const tree = (rim) => sprite(380, 440, { w: 3800, h: 4400 }, (g, w, h) => {
    const blobs = [];
    for (let i = 0; i < 7; i++) blobs.push([w * between(0.25, 0.75), h * between(0.16, 0.42), w * between(0.13, 0.2)]);
    rimFill(g, rim, 6, () => {
      g.beginPath();
      g.moveTo(w * 0.43, h); g.lineTo(w * 0.47, h * 0.4); g.lineTo(w * 0.53, h * 0.4); g.lineTo(w * 0.58, h);
      g.closePath();
    });
    rimFill(g, rim, 8, () => {
      g.beginPath();
      for (const [x, y, r] of blobs) { g.moveTo(x + r, y); g.arc(x, y, r, 0, Math.PI * 2); }
    });
    const vines = [];
    for (let i = 0; i < 6; i++) {
      const x = w * between(0.22, 0.78);
      vines.push([x, h * 0.45, x + between(-8, 8), h * between(0.55, 0.78)]);
    }
    strands(g, rim, 0.45, vines);
  });

  const banana = (rim) => sprite(300, 300, { w: 2200, h: 2200 }, (g, w, h) => {
    const leaves = [[-1.15, 0.9], [-0.65, 1], [-0.2, 0.85], [0.1, 1.05], [0.55, 0.95], [1.05, 0.85]];
    rimFill(g, rim, 5, () => {
      g.beginPath();
      for (const [a, len] of leaves) {
        const L = h * 0.48 * len;
        const cx = w / 2 + Math.sin(a) * L * 0.55, cy = h - Math.cos(a) * L * 0.55;
        const rot = a - Math.PI / 2;
        g.moveTo(cx + Math.cos(rot) * L * 0.5, cy + Math.sin(rot) * L * 0.5);
        g.ellipse(cx, cy, L * 0.5, L * 0.13, rot, 0, Math.PI * 2);
      }
    });
  });

  const fern = (rim) => sprite(320, 170, { w: 1700, h: 900 }, (g, w, h) => {
    const fronds = [];
    for (let i = 0; i < 9; i++) fronds.push([-1.3 + i * (2.6 / 8), h * between(0.75, 1)]);
    rimLine(g, rim, 6, () => {
      g.beginPath();
      for (const [a, L] of fronds) {
        g.moveTo(w / 2, h);
        g.quadraticCurveTo(w / 2 + Math.sin(a) * L * 0.9, h - Math.cos(a) * L * 1.1, w / 2 + Math.sin(a) * L * 1.4, h - Math.cos(a) * L * 0.55);
      }
    });
  });

  // Swamp: bald cypress with hanging moss, reeds, dead snags.
  const cypress = (rim) => sprite(260, 560, { w: 2600, h: 5600 }, (g, w, h) => {
    rimFill(g, rim, 5, () => {
      g.beginPath();
      g.moveTo(w * 0.28, h);
      g.quadraticCurveTo(w * 0.45, h * 0.86, w * 0.47, h * 0.3);
      g.lineTo(w * 0.53, h * 0.3);
      g.quadraticCurveTo(w * 0.55, h * 0.86, w * 0.72, h);
      g.closePath();
    });
    const tiers = [];
    for (let i = 0; i < 6; i++) tiers.push([w * (0.5 + between(-0.08, 0.08)), h * (0.08 + i * 0.055), w * between(0.2, 0.42)]);
    rimFill(g, rim, 6, () => {
      g.beginPath();
      for (const [x, y, rx] of tiers) { g.moveTo(x + rx, y); g.ellipse(x, y, rx, h * 0.032, 0, 0, Math.PI * 2); }
    });
    const moss = [];
    for (let i = 0; i < 16; i++) {
      const x = w * between(0.12, 0.88), y = h * between(0.1, 0.38);
      moss.push([x, y, x + between(-4, 4), y + h * between(0.05, 0.15)]);
    }
    strands(g, rim, 0.4, moss);
  });

  const reeds = (rim) => sprite(180, 240, { w: 650, h: 870 }, (g, w, h) => {
    const stalks = [];
    for (let i = 0; i < 10; i++) {
      const x = w * between(0.15, 0.85);
      stalks.push([x, x + between(-8, 8), x + between(-20, 20), h * between(0.06, 0.4)]);
    }
    rimLine(g, rim, 3, () => {
      g.beginPath();
      for (const [x, cx, tx, ty] of stalks) { g.moveTo(x, h); g.quadraticCurveTo(cx, h * 0.5, tx, ty); }
    });
    rimFill(g, rim, 4, () => {
      g.beginPath();
      for (const [, , tx, ty] of stalks.slice(0, 4)) { g.moveTo(tx + 6, ty + 14); g.ellipse(tx, ty + 14, 6, 15, 0, 0, Math.PI * 2); }
    });
  });

  const snag = (rim) => sprite(300, 420, { w: 2600, h: 3600 }, (g, w, h) => {
    const lines = [];
    const branch = (x, y, a, len, depth) => {
      if (!depth) return;
      const x2 = x + Math.sin(a) * len, y2 = y - Math.cos(a) * len;
      lines.push([x, y, x2, y2, depth * 2.2]);
      branch(x2, y2, a - between(0.3, 0.7), len * 0.66, depth - 1);
      if (rand() < 0.8) branch(x2, y2, a + between(0.3, 0.7), len * 0.66, depth - 1);
    };
    branch(w / 2, h, between(-0.1, 0.1), h * 0.42, 5);
    for (const [color, extra] of [[rim, 5], [DARK, 0]]) {
      g.strokeStyle = color;
      g.lineCap = "round";
      for (const [x, y, x2, y2, lw] of lines) {
        g.lineWidth = lw + extra;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      }
    }
  });

  // Beach: palms, umbrellas, a lifeguard tower.
  const umbrella = (rim) => sprite(240, 250, { w: 1800, h: 1900 }, (g, w, h) => {
    rimLine(g, rim, 4, () => { g.beginPath(); g.moveTo(w * 0.5, h); g.lineTo(w * 0.47, h * 0.12); });
    const canopy = () => {
      g.beginPath();
      g.moveTo(w * 0.06, h * 0.38);
      g.quadraticCurveTo(w * 0.47, h * -0.08, w * 0.9, h * 0.38);
      g.closePath();
    };
    g.save();
    canopy(); g.clip();
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? "#ff3d7f" : "#1a0b2e";
      g.fillRect(w * (0.06 + i * 0.14), 0, w * 0.14, h * 0.4);
    }
    g.restore();
    g.strokeStyle = rim; g.lineWidth = 3; canopy(); g.stroke();
  });

  const tower = (rim) => sprite(260, 360, { w: 2400, h: 3300 }, (g, w, h) => {
    rimLine(g, rim, 5, () => {
      g.beginPath();
      g.moveTo(w * 0.22, h); g.lineTo(w * 0.32, h * 0.5);
      g.moveTo(w * 0.72, h); g.lineTo(w * 0.64, h * 0.5);
      g.moveTo(w * 0.27, h * 0.75); g.lineTo(w * 0.68, h * 0.75);
      g.moveTo(w * 0.98, h); g.lineTo(w * 0.66, h * 0.52);
    });
    rimFill(g, rim, 5, () => {
      g.beginPath();
      g.rect(w * 0.26, h * 0.24, w * 0.44, h * 0.27);
    });
    g.fillStyle = "rgba(255, 180, 84, 0.55)";
    g.fillRect(w * 0.32, h * 0.3, w * 0.32, h * 0.07);
    rimFill(g, rim, 5, () => {
      g.beginPath();
      g.moveTo(w * 0.18, h * 0.25); g.lineTo(w * 0.48, h * 0.1); g.lineTo(w * 0.78, h * 0.25);
      g.closePath();
    });
  });

  // ---- Pixel art. Each shape above is drawn small, snapped to a few colours and given a
  // one-pixel neon outline; buildings, lamps, signs and critters are drawn pixel by pixel. ----
  function pixelize(src, w, h, colors, outline) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingQuality = "high";
    g.drawImage(src, 0, 0, w, h);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    const pal = colors.map(rgb);
    const solid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (d[i * 4 + 3] < 110) { d[i * 4 + 3] = 0; continue; }
      solid[i] = 1;
      let best = pal[0], bestD = Infinity;
      for (const q of pal) {
        const dd = (d[i * 4] - q[0]) ** 2 + (d[i * 4 + 1] - q[1]) ** 2 + (d[i * 4 + 2] - q[2]) ** 2;
        if (dd < bestD) { bestD = dd; best = q; }
      }
      d.set([best[0], best[1], best[2], 255], i * 4);
    }
    if (outline) {
      const o = rgb(outline);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (solid[i]) continue;
        if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) d.set([o[0], o[1], o[2], 255], i * 4);
      }
    }
    g.putImageData(img, 0, 0);
    c.world = src.world;
    return c;
  }

  // Native pixel sprites: paint(px) gets a fillRect-like helper that takes a colour.
  function pixelArt(w, h, world, paint) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    paint((x, y, pw, ph, color) => { g.fillStyle = color; g.fillRect(x, y, pw, ph); }, g);
    c.world = world;
    return c;
  }

  // A 3 x 5 pixel font, only the letters the signs need.
  const GLYPHS = {
    A: "010101111101101", C: "011100100100011", D: "110101101101110", E: "111100110100111",
    H: "101101111101101", L: "100100100100111", M: "101111111101101", N: "110101101101101",
    O: "010101101101010", P: "110101110100100", R: "110101110101101", T: "111010010010010",
    2: "110001010100111", 4: "101101111001001", " ": "000000000000000",
  };
  function pixelText(px, text, x, y, color) {
    [...text].forEach((ch, k) => {
      const bits = GLYPHS[ch];
      for (let i = 0; i < 15; i++) if (bits[i] === "1") px(x + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1, typeof color === "function" ? color(k) : color);
    });
  }

  const lamp = pixelArt(7, 36, { w: 380, h: 3200 }, (px) => {
    px(1, 0, 5, 3, "#ffb454");
    px(2, 0, 3, 2, "#fff3d6");
    px(0, 1, 1, 1, "#ff7a1a"); px(6, 1, 1, 1, "#ff7a1a");
    px(3, 3, 1, 33, "#24132f");
    px(4, 3, 1, 33, "#ff3d7f");
  });

  const building = (rim) => {
    const w = Math.round(between(24, 40)), h = Math.round(between(48, 96));
    return pixelArt(w, h, { w: w * 117, h: h * 117 }, (px) => {
      px(0, 2, w, h - 2, "#0e0818");
      px(0, 2, w, 1, rim);
      px(0, 3, 1, h - 3, "#1d1128");
      px(w - 1, 3, 1, h - 3, "#1d1128");
      if (rand() < 0.5) px(Math.round(w * 0.7), 0, 1, 2, rim); // antenna
      for (let y = 6; y < h - 3; y += 4) {
        for (let x = 3; x < w - 3; x += 4) {
          if (rand() > 0.34) continue;
          px(x, y, 2, 2, pick(["#ffb454", "#ffb454", "#ffd27a", "#7ad7ff", "#ff3d7f"]));
        }
      }
    });
  };

  // Neon signs. The pink one takes its colours from the cycling group, so its letters chase.
  const sign = (text, color) => {
    const w = text.length * 4 + 7;
    return pixelArt(w, 26, { w: w * 70, h: 26 * 70 }, (px) => {
      px(Math.floor(w / 2) - 1, 11, 2, 15, "#1d1128");
      px(0, 0, w, 11, DARK);
      const edge = color === "cycle" ? (k) => CYCLES.neon.colors[k % 4] : () => color;
      for (let x = 0; x < w; x++) { px(x, 0, 1, 1, edge(x)); px(x, 10, 1, 1, edge(x + 2)); }
      px(0, 0, 1, 11, edge(1)); px(w - 1, 0, 1, 11, edge(3));
      pixelText(px, text, 4, 3, color === "cycle" ? (k) => CYCLES.neon.colors[k % 4] : color);
    });
  };

  // An alligator: mostly two eyes on the water, now and then the whole head.
  const gator = [false, true].map((up) => pixelArt(18, 7, { w: 900, h: 350 }, (px) => {
    px(1, 6, 16, 1, "#62bfe0");
    if (up) {
      px(3, 3, 13, 3, "#14201f");
      px(13, 4, 4, 2, "#14201f");
      for (let x = 7; x < 16; x += 2) px(x, 5, 1, 1, "#f1e9e4");
      px(4, 2, 2, 1, "#14201f"); px(8, 2, 2, 1, "#14201f");
      px(4, 2, 1, 1, "#ffd27a"); px(8, 2, 1, 1, "#ffd27a");
    } else {
      px(4, 4, 3, 2, "#14201f"); px(9, 4, 3, 2, "#14201f");
      px(5, 4, 1, 1, "#ffd27a"); px(10, 4, 1, 1, "#ffd27a");
    }
  }));

  // A parrot crossing the jungle sky, wings up and down.
  const parrot = [0, 1].map((f) => pixelArt(9, 7, null, (px) => {
    px(2, 3, 5, 2, "#ff2d6f");
    px(7, 2, 2, 2, "#ff2d6f");
    px(8, 3, 1, 1, "#ffd27a");
    px(0, 4, 2, 1, "#2a6fd0");
    if (f) { px(3, 0, 2, 3, "#2a6fd0"); px(4, 1, 2, 2, "#ffd27a"); }
    else { px(3, 5, 2, 2, "#2a6fd0"); px(4, 5, 2, 1, "#ffd27a"); }
  }));

  seed = 3;
  const RIM = Object.fromEntries(BIOMES.map((b) => [b.name, b.rim]));
  // Inside a sprite the neon lines are dimmed; only the outline is at full strength.
  const plant = (src, w, h, rim, extra = []) => pixelize(src, Math.round(w * 1.6), Math.round(h * 1.6), [DARK, "#1d1128", dimRim(rim), ...extra], rim);
  const SPRITES = {
    tree: plant(tree(RIM.jungle), 46, 54, RIM.jungle),
    banana: plant(banana(RIM.jungle), 28, 28, RIM.jungle),
    fern: plant(fern(RIM.jungle), 34, 18, RIM.jungle),
    jpalm: plant(palm(RIM.jungle), 42, 56, RIM.jungle),
    cypress: plant(cypress(RIM.swamp), 26, 56, RIM.swamp),
    reeds: plant(reeds(RIM.swamp), 16, 22, RIM.swamp),
    snag: plant(snag(RIM.swamp), 26, 36, RIM.swamp),
    gator,
    pole: lamp,
    buildings: [1, 2, 3, 4, 5].map(() => building(rand() < 0.7 ? RIM.city : "#7ad7ff")),
    neon: [sign("MOTEL", "cycle"), sign("OPEN 24H", "#7ad7ff"), sign("ARCADE", "#ffb454")],
    palm: plant(palm(RIM.city), 42, 56, RIM.city),
    umbrella: plant(umbrella(RIM.beach), 24, 25, RIM.beach, ["#ff3d7f", "#1a0b2e"]),
    tower: plant(tower(RIM.beach), 26, 36, RIM.beach, ["#ffb454"]),
  };
  SPRITES.neon[1].flicker = SPRITES.neon[2].flicker = true;

  // ---- The car: a low-poly model, rasterised every frame into a small pixel buffer (with a
  // depth buffer, so it is right from every angle) and scaled up crisp: pixel art that can
  // turn. A made-up synthwave concept car: a low wedge with a targa roof, neon trim, a
  // scissor door and an underglow. Two people in it. ----
  const CAR = {
    body: [88, 48, 134], under: [24, 16, 34], trim: [38, 26, 56], tyre: [24, 20, 30], rim: [132, 122, 162],
    seat: [34, 26, 46], skin: [232, 180, 138], hair: [58, 36, 24], blonde: [240, 200, 96],
    shirt: [42, 111, 208], top: [200, 60, 112], glass: [122, 215, 255],
    neon: [255, 61, 127], cyan: [122, 215, 255], head: [255, 243, 196], tail: [160, 24, 44], tailOn: [255, 48, 72],
  };
  const CAR_PX = { w: 220, h: 120, ground: 100, f: 265, pitch: (10 * Math.PI) / 180 };
  const carCanvas = document.createElement("canvas");
  carCanvas.width = CAR_PX.w;
  carCanvas.height = CAR_PX.h;
  const cg = carCanvas.getContext("2d");
  const carImage = cg.createImageData(CAR_PX.w, CAR_PX.h);
  const carPixels = new Uint32Array(carImage.data.buffer);
  const carDepth = new Float32Array(CAR_PX.w * CAR_PX.h);

  // Units are metres. x: to the car's right, y: up, z: forward. The origin is on the ground,
  // under the middle of the car.
  const CAR_MODEL = (() => {
    const prims = [];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    // Faces get an outward normal (pointing away from ref) for shading and back-face culling.
    const add = (pts, color, extra = {}) => {
      const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
      let n = [0, 0, 0];
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length];
        n = [n[0] + (p[1] - q[1]) * (p[2] + q[2]), n[1] + (p[2] - q[2]) * (p[0] + q[0]), n[2] + (p[0] - q[0]) * (p[1] + q[1])];
      });
      const len = Math.hypot(...n) || 1;
      n = n.map((v) => v / len);
      const ref = extra.ref || [0, 0.4, c[2] * 0.9];
      if (dot(n, sub(c, ref)) < 0) n = n.map((v) => -v);
      prims.push({ pts, color, n, cull: true, ...extra });
    };
    const line = (pts, color, normal, extra = {}) => prims.push({ pts, color, line: true, normal, ...extra });
    const box = ([x0, x1], [y0, y1], [z0, z1], color) => {
      const ref = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
      [
        [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]],
        [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]],
        [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]],
        [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]],
        [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]],
        [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]],
      ].forEach((f, i) => add(f, typeof color === "function" ? color(i) : color, { ref }));
    };

    // The hull: cross-sections from the tail to the nose. Each one is a six-sided profile:
    // sill, shoulder and roof edge on both sides. A low wedge.
    const rings = [
      [-2.2, 0.94, 0.24, 0.56, 0.68],
      [-1.7, 1.0, 0.2, 0.58, 0.74],
      [-0.6, 1.0, 0.2, 0.56, 0.72],
      [0.6, 0.98, 0.2, 0.52, 0.6],
      [1.5, 0.94, 0.2, 0.44, 0.5],
      [2.2, 0.84, 0.22, 0.29, 0.34],
    ].map(([z, hw, yb, ym, yt]) => [[-hw, yb, z], [-hw, ym, z], [-hw * 0.78, yt, z], [hw * 0.78, yt, z], [hw, ym, z], [hw, yb, z]]);
    for (let i = 0; i < rings.length - 1; i++) {
      for (let j = 0; j < 6; j++) {
        const k = (j + 1) % 6;
        add([rings[i][j], rings[i][k], rings[i + 1][k], rings[i + 1][j]], j === 5 ? CAR.under : CAR.body);
      }
    }
    add(rings[0], CAR.body);
    add(rings[rings.length - 1], CAR.body);
    const shoulder = (z) => (z > 1.5 ? 0.44 : z > 0.6 ? 0.52 : 0.56);

    // Trim on the hull: wheel arches, intakes, the tail-light bar, headlights.
    for (const s of [-1, 1]) {
      for (const z of [-1.4, 1.4]) {
        const pts = [[s * 1.004, 0.2, z + 0.4]];
        for (let k = 0; k <= 6; k++) {
          const t = (k / 6) * Math.PI;
          pts.push([s * 1.004, Math.min(shoulder(z) - 0.03, 0.3 + 0.4 * Math.sin(t)), z + 0.4 * Math.cos(t)]);
        }
        pts.push([s * 1.004, 0.2, z - 0.4]);
        add(pts, CAR.under, { ref: [0, 0.4, z] });
      }
      add([[s * 1.004, 0.3, -0.95], [s * 1.004, 0.48, -0.95], [s * 1.004, 0.5, -0.7], [s * 1.004, 0.3, -0.7]], CAR.trim, { ref: [0, 0.4, -0.8] });
    }
    add([[-0.8, 0.44, -2.205], [0.8, 0.44, -2.205], [0.8, 0.52, -2.205], [-0.8, 0.52, -2.205]], "tail", { ref: [0, 0.5, 0], glow: true });
    for (const s of [-1, 1]) add([[s * 0.3, 0.25, 2.205], [s * 0.7, 0.25, 2.205], [s * 0.7, 0.29, 2.205], [s * 0.3, 0.29, 2.205]], CAR.head, { ref: [0, 0.3, 0], glow: true });

    // A rear wing on two struts, and a diffuser with twin exhausts under the tail.
    box([-0.95, 0.95], [0.86, 0.9], [-2.2, -1.88], CAR.trim);
    for (const s of [-1, 1]) {
      box([s * 0.62 - 0.04, s * 0.62 + 0.04], [0.66, 0.86], [-2.1, -1.98], CAR.trim);
      add([[s * 0.95, 0.8, -2.2], [s * 0.95, 0.96, -2.2], [s * 0.95, 0.96, -1.86], [s * 0.95, 0.8, -1.86]], CAR.trim, { cull: false });
      box([s * 0.42 - 0.09, s * 0.42 + 0.09], [0.26, 0.36], [-2.26, -2.2], CAR.rim);
    }
    add([[-0.9, 0.2, -2.21], [0.9, 0.2, -2.21], [0.9, 0.36, -2.21], [-0.9, 0.36, -2.21]], CAR.under, { ref: [0, 0.3, 0] });
    line([[-0.95, 0.9, -2.2], [0.95, 0.9, -2.2]], CAR.neon, null);

    // Neon: magenta along the shoulders, cyan along the sills, the tail and the nose.
    line(rings.map((r) => r[1]), CAR.neon, [-1, 0, 0]);
    line(rings.map((r) => r[4]), CAR.neon, [1, 0, 0]);
    line(rings.map((r) => r[0]), CAR.cyan, [-1, 0, 0]);
    line(rings.map((r) => r[5]), CAR.cyan, [1, 0, 0]);
    line([rings[0][2], rings[0][3]], CAR.cyan, [0, 0, -1]);
    line(rings[rings.length - 1].slice(1, 5), CAR.cyan, [0, 0, 1]);

    // Wheels: octagonal drums that stand a little proud of the body; the front pair steers.
    const wheel = (x, z, tag) => {
      const r = 0.3, cy = 0.3, out = Math.sign(x), xo = x + out * 0.14, xi = x - out * 0.14;
      const ring = (xx, rr) => Array.from({ length: 8 }, (_, k) => {
        const t = (k * Math.PI) / 4 + Math.PI / 8;
        return [xx, cy + rr * Math.sin(t), z + rr * Math.cos(t)];
      });
      const o = ring(xo, r), i = ring(xi, r);
      const extra = { tag, center: [x, cy, z], ref: [x, cy, z] };
      add(o, CAR.tyre, extra);
      add(i, CAR.tyre, extra);
      for (let k = 0; k < 8; k++) add([o[k], o[(k + 1) % 8], i[(k + 1) % 8], i[k]], CAR.tyre, extra);
      add(ring(xo + out * 0.004, 0.17), CAR.rim, extra);
    };
    for (const x of [-0.92, 0.92]) { wheel(x, -1.4, "rear"); wheel(x, 1.4, "steer"); }

    // The scissor door on the right, hinged at its front top corner; the opening behind it.
    const doorPts = (x) => [[x, 0.24, -0.45], [x, 0.24, 0.55], [x, 0.52, 0.55], [x, 0.56, -0.45]];
    add(doorPts(1.006), CAR.under, { tag: "aperture", ref: [0, 0.4, 0] });
    add(doorPts(1.012), CAR.body, { tag: "door", ref: [0, 0.4, 0], cull: false });
    line([[1.014, 0.56, -0.45], [1.014, 0.52, 0.55]], CAR.neon, null, { tag: "door" });

    // The cabin: tub, seats, two people, the windscreen and the targa hoop.
    add([[-0.78, 0.69, -0.62], [0.78, 0.69, -0.62], [0.78, 0.62, 0.55], [-0.78, 0.62, 0.55]], CAR.seat, { cull: false });
    for (const s of [-1, 1]) {
      const xs = s > 0 ? [0.22, 0.62] : [-0.62, -0.22];
      box(xs, [0.69, 0.92], [-0.56, -0.42], CAR.seat);
      box([xs[0] + 0.02, xs[1] - 0.02], [0.69, 0.88], [-0.42, -0.16], s > 0 ? CAR.top : CAR.shirt);
    }
    box([-0.52, -0.32], [0.88, 1.07], [-0.34, -0.14], (i) => (i === 5 ? CAR.skin : CAR.hair));
    box([0.32, 0.52], [0.88, 1.06], [-0.34, -0.14], (i) => (i === 5 ? CAR.skin : CAR.blonde));
    box([0.3, 0.54], [0.8, 1.03], [-0.42, -0.32], CAR.blonde);
    add([[-0.78, 0.6, 0.62], [0.78, 0.6, 0.62], [0.64, 0.92, 0.14], [-0.64, 0.92, 0.14]], CAR.glass, { cull: false, alpha: 0.25 });
    box([-0.8, -0.72], [0.69, 1.1], [-0.64, -0.56], CAR.trim);
    box([0.72, 0.8], [0.69, 1.1], [-0.64, -0.56], CAR.trim);
    box([-0.8, 0.8], [1.04, 1.1], [-0.64, -0.56], CAR.trim);
    line([[-0.64, 0.92, 0.14], [0.64, 0.92, 0.14]], CAR.cyan, null);
    line([[-0.8, 1.1, -0.6], [0.8, 1.1, -0.6]], CAR.neon, null);
    return prims;
  })();

  const LIGHT = (() => { const v = [-0.4, 0.8, -0.45], l = Math.hypot(...v); return v.map((x) => x / l); })();
  const pack = (c, k = 1) => ((255 << 24) | (Math.min(255, c[2] * k) << 16) | (Math.min(255, c[1] * k) << 8) | Math.min(255, c[0] * k)) >>> 0;

  // One triangle into the pixel buffer: screen x, y and 1/z per corner; nearer wins.
  function carTriangle(a, b, c, color, alpha) {
    const { w, h } = CAR_PX;
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(area) < 1e-6) return;
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = y0; y <= y1; y++) {
      const py = y + 0.5;
      for (let x = x0; x <= x1; x++) {
        const px = x + 0.5;
        const wa = ((c[0] - b[0]) * (py - b[1]) - (c[1] - b[1]) * (px - b[0])) / area;
        const wb = ((a[0] - c[0]) * (py - c[1]) - (a[1] - c[1]) * (px - c[0])) / area;
        const wc = 1 - wa - wb;
        if (wa < 0 || wb < 0 || wc < 0) continue;
        const iz = wa * a[2] + wb * b[2] + wc * c[2];
        const i = y * w + x;
        if (iz <= carDepth[i]) continue;
        if (alpha) {
          const o = carPixels[i];
          if (!o) { carPixels[i] = (Math.round(alpha * 255) << 24 | (color & 0xffffff)) >>> 0; continue; }
          const mixc = (s) => Math.round(((o >> s) & 255) * (1 - alpha) + ((color >> s) & 255) * alpha);
          carPixels[i] = ((255 << 24) | (mixc(16) << 16) | (mixc(8) << 8) | mixc(0)) >>> 0;
        } else {
          carPixels[i] = color;
          carDepth[i] = iz;
        }
      }
    }
  }

  // A neon line, nudged toward the camera so it wins against the surface it lies on.
  function carLine(a, b, color) {
    const { w, h } = CAR_PX;
    const steps = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))) || 1;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = Math.floor(a[0] + (b[0] - a[0]) * t), y = Math.floor(a[1] + (b[1] - a[1]) * t);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const iz = (a[2] + (b[2] - a[2]) * t) * 1.012;
      const i = y * w + x;
      if (iz <= carDepth[i]) continue;
      carPixels[i] = color;
      carDepth[i] = iz;
    }
  }

  // Draws the car into the pixel buffer. yaw 0 shows the tail, pi/2 the right side (nose to
  // the right). Returns the screen points the glows need.
  function renderCar({ yaw, roll, steer, door, dist, brake, body = CAR.body }) {
    const { w, ground, f, pitch } = CAR_PX;
    const ca = Math.cos(yaw), sa = Math.sin(yaw), cr = Math.cos(roll), sr = Math.sin(roll);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cw = Math.cos(steer), sw = Math.sin(steer), cd = Math.cos(door), sd = Math.sin(door);
    const turn = ([x, y, z]) => {
      const xr = x * cr - y * sr, yr = x * sr + y * cr;   // lean
      const x1 = xr * ca + z * sa, z1 = -xr * sa + z * ca; // heading
      return [x1, yr * cp + z1 * sp, -yr * sp + z1 * cp];  // looking down a little
    };
    const view = (p) => { const v = turn(p); v[2] += dist; return v; };
    const local = ([x, y, z], prim) => {
      if (prim.tag === "steer") {
        const dx = x - prim.center[0], dz = z - prim.center[2];
        return [prim.center[0] + dx * cw + dz * sw, y, prim.center[2] - dx * sw + dz * cw];
      }
      if (prim.tag === "door" && door > 0) {
        const dy = y - 0.54, dz = z - 0.55;
        return [x, 0.54 + dy * cd - dz * sd, 0.55 + dy * sd + dz * cd];
      }
      return [x, y, z];
    };
    const screen = ([x, y, z]) => [w / 2 + (x * f) / z, ground - (y * f) / z, 1 / z];
    const facing = (n, c) => n[0] * c[0] + n[1] * c[1] + n[2] * c[2] < 0;

    carPixels.fill(0);
    carDepth.fill(0);
    const glass = [];
    for (const prim of CAR_MODEL) {
      if (prim.tag === "aperture" && door <= 0.02) continue;
      const pts = prim.pts.map((p) => view(local(p, prim)));
      const c = pts.reduce((s, p) => [s[0] + p[0] / pts.length, s[1] + p[1] / pts.length, s[2] + p[2] / pts.length], [0, 0, 0]);
      if (prim.line) {
        if (prim.normal && !facing(turn(prim.normal), c)) continue;
        const s = pts.map(screen), color = pack(prim.color);
        for (let i = 1; i < s.length; i++) carLine(s[i - 1], s[i], color);
        continue;
      }
      const n = turn(prim.n);
      if (prim.cull && !facing(n, c)) continue;
      let color;
      if (prim.color === "tail") color = pack(brake > 0.5 ? CAR.tailOn : CAR.tail);
      else if (prim.glow) color = pack(prim.color);
      else color = pack(prim.color === CAR.body ? body : prim.color, 0.38 + 0.62 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]));
      const s = pts.map(screen);
      if (prim.alpha) { glass.push([s, color, prim.alpha]); continue; }
      for (let i = 1; i < s.length - 1; i++) carTriangle(s[0], s[i], s[i + 1], color, 0);
    }
    for (const [s, color, alpha] of glass) for (let i = 1; i < s.length - 1; i++) carTriangle(s[0], s[i], s[i + 1], color, alpha);
    cg.putImageData(carImage, 0, 0);

    const tailFacing = facing(turn([0, 0, -1]), view([0, 0.5, -2.2]));
    return {
      // Where the tyres touch the road: the lowest one goes on the car's ground line.
      contact: Math.max(...[[-0.92, 0, -1.4], [0.92, 0, -1.4], [-0.92, 0, 1.4], [0.92, 0, 1.4]].map((p) => screen(view(p))[1])),
      footprint: [[-1, 0, -2.1], [1, 0, -2.1], [1, 0, 2.1], [-1, 0, 2.1]].map((p) => screen(view(p))),
      tail: tailFacing ? [[-0.55, 0.48, -2.21], [0.55, 0.48, -2.21]].map((p) => screen(view(p))) : [],
    };
  }

  // ---- Track: each biome gets its own kind of road ----
  const segments = [];
  const easeIn = (a, b, p) => a + (b - a) * p * p;
  const easeInOut = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
  const lastY = () => (segments.length ? segments[segments.length - 1].p2.world.y : 0);
  const toSeaLevel = () => -lastY() / SEGMENT;

  function addSegment(curve, y) {
    const n = segments.length;
    segments.push({
      index: n,
      p1: { world: { y: lastY(), z: n * SEGMENT }, camera: {}, screen: {} },
      p2: { world: { y, z: (n + 1) * SEGMENT }, camera: {}, screen: {} },
      curve,
      sprites: [],
    });
  }

  // Enter a curve/hill, hold it, leave it. Height is in segment lengths.
  function addRoad(enter, hold, leave, curve, height) {
    const startY = lastY();
    const endY = startY + height * SEGMENT;
    const total = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
    for (let n = 0; n < hold; n++) addSegment(curve, easeInOut(startY, endY, (enter + n) / total));
    for (let n = 0; n < leave; n++) addSegment(easeInOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
  }

  const L = { short: 25, medium: 50, long: 100 };
  const C = { easy: 2, medium: 4, hard: 6 };
  const H = { low: 20, medium: 40, high: 60 };

  const ROADS = {
    // Winding and hilly.
    jungle() {
      const len = pick([L.short, L.medium]);
      let height = between(-1, 1) * H.low;
      if (Math.abs(lastY() / SEGMENT + height) > H.medium) height = -height;
      addRoad(len, len, len, side() * between(C.easy, C.hard), height);
    },
    // Flat as water, long lazy bends.
    swamp() { addRoad(L.medium, L.long, L.medium, side() * between(C.easy, C.medium), toSeaLevel()); },
    // Grid streets: straights, a few bends, the odd overpass.
    city() {
      const height = lastY() ? toSeaLevel() : (rand() < 0.5 ? between(H.low / 2, H.low) : 0);
      addRoad(L.short, L.medium, L.short, rand() < 0.4 ? 0 : side() * between(C.easy, C.medium), height);
    },
    // Along the shore.
    beach() { addRoad(L.medium, L.long, L.medium, side() * C.easy, toSeaLevel()); },
  };

  function buildTrack() {
    seed = 7;
    addRoad(0, 40, 0, 0, 0); // the start: a straight into the sun
    const last = boards[boards.length - 1].seg;
    const ends = [...bounds.slice(1), Math.max(bounds[bounds.length - 1] + 20, last - 60)];
    BIOMES.forEach((biome, k) => {
      while (segments.length < ends[k]) ROADS[biome.name]();
    });
    // The last stretch: straight and flat, down to the beach and into the sea.
    addRoad(30, last + DRAW + 100 - segments.length, 0, 0, toSeaLevel());

    for (const seg of segments) {
      const [k, t] = biomeAt(seg.index);
      const band = Math.floor(seg.index / RUMBLE) % 2;
      const next = BIOMES[Math.min(k + 1, BIOMES.length - 1)];
      const beach = k === BIOMES.length - 1 ? 1 : k === BIOMES.length - 2 ? t : 0;
      seg.biome = k;
      seg.blend = t;
      seg.color = { ...ROAD[band], grass: mix(BIOMES[k].grass[band], next.grass[band], t), sea: SEA[band], foam: FOAM[band] };
      seg.shore = beach > 0.02 ? 1.55 + (1 - beach) * 12 : 0; // the sea slides in from the right
    }
    decorate();
  }

  // Roadside scenery. In a transition the biome is picked at random, weighted by the blend,
  // so one landscape thins out as the next one moves in. Kept clear of the billboards.
  function decorate() {
    seed = 19;
    const clear = new Set();
    for (const b of boards) for (let n = b.seg - 5; n <= b.seg + 3; n++) clear.add(n * b.side);
    for (let n = 6; n < segments.length; n++) {
      const seg = segments[n];
      const name = BIOMES[rand() < seg.blend ? seg.biome + 1 : seg.biome].name;
      const put = (img, offset) => {
        if (Math.abs(offset) < 3.4 && clear.has(n * Math.sign(offset))) return;
        seg.sprites.push({ img, offset });
      };
      const S = SPRITES;
      if (name === "jungle") {
        for (const s of [-1, 1]) {
          if (rand() < 0.5) put(rand() < 0.5 ? S.fern : S.banana, s * between(1.15, 1.7));
          if (rand() < 0.42) put(rand() < 0.6 ? S.tree : S.jpalm, s * between(1.8, 4.6));
        }
      } else if (name === "swamp") {
        for (const s of [-1, 1]) {
          if (rand() < 0.22) put(S.reeds, s * between(1.1, 1.6));
          if (rand() < 0.3) put(rand() < 0.82 ? S.cypress : S.snag, s * between(1.7, 5));
        }
        if (rand() < 0.02) put(S.gator, side() * between(1.3, 2.4));
      } else if (name === "city") {
        if (n % 4 === 0) for (const s of [-1, 1]) put(pick(S.buildings), s * between(1.45, 1.8));
        if (n % 6 === 3) { put(S.pole, -1.15); put(S.pole, 1.15); }
        if (rand() < 0.05) put(pick(S.neon), side() * 1.22);
        if (rand() < 0.08) put(S.palm, side() * 1.2);
      } else {
        if (rand() < 0.3) put(S.palm, -between(1.3, 3.6));
        if (rand() < 0.06) put(S.umbrella, -between(1.2, 2.2));
        if (n % 70 === 35) put(S.tower, -between(1.5, 2.2));
        if (n % 8 === 0) put(S.pole, -1.15);
        if (rand() < 0.07) put(S.palm, between(1.15, 1.3));
      }
    }
  }

  // ---- Background layers: rendered on resize, one set per biome, scrolled sideways in curves ----
  let W = 0, Hh = 0, horizon = 0, unitX = 0, unitY = 0;
  let stars;
  const skies = [], layers = [];
  const offsets = { stars: 0, sun: 0, far: 0, near: 0 };

  function layer(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    draw(c.getContext("2d"), c.width, c.height);
    return c;
  }

  function silhouette(g, w, h, base, amp, step, color, rim) {
    g.beginPath();
    g.moveTo(0, h);
    let y = base;
    for (let x = 0; x <= w + step; x += step) {
      y = Math.min(h - 2, Math.max(base - amp, y + between(-amp, amp) * 0.5));
      g.lineTo(x, y);
    }
    g.lineTo(w, h);
    g.closePath();
    g.fillStyle = color;
    g.fill();
    if (rim) { g.strokeStyle = rim; g.lineWidth = 1.5; g.stroke(); }
  }

  function volcano(g, w, h) {
    const vx = w * 0.37, vw = w * 0.11;
    // The crater glows in the lava colours, which cycle.
    [[0.34, 2], [0.24, 1], [0.13, 0]].forEach(([r, c]) => {
      g.fillStyle = CYCLES.lava.colors[c];
      g.beginPath();
      g.arc(vx, h * 0.13, vw * r, 0, Math.PI * 2);
      g.fill();
    });
    const rim = g.createLinearGradient(0, h * 0.12, 0, h);
    rim.addColorStop(0, "#ff7a1a");
    rim.addColorStop(0.06, "#3a0d24");
    rim.addColorStop(1, "#140818");
    g.fillStyle = rim;
    g.beginPath();
    g.moveTo(vx - vw * 2.2, h);
    g.lineTo(vx - vw * 0.9, h * 0.45);
    g.lineTo(vx - vw * 0.28, h * 0.13);
    g.lineTo(vx + vw * 0.3, h * 0.13);
    g.lineTo(vx + vw * 1.0, h * 0.5);
    g.lineTo(vx + vw * 2.4, h);
    g.closePath();
    g.fill();
  }

  // A canopy edge: a row of overlapping crowns on short trunks.
  function crowns(g, w, h, base, rMin, rMax, color, rim, flat) {
    const path = () => {
      g.beginPath();
      for (let x = 0; x < w + rMax; x += rMin * 1.1) {
        const r = between(rMin, rMax);
        const y = base - between(0, h * 0.3);
        g.moveTo(x + r, y);
        if (flat) g.ellipse(x, y, r, r * 0.3, 0, 0, Math.PI * 2);
        else g.arc(x, y, r, 0, Math.PI * 2);
        g.rect(x - r * 0.15, y, r * 0.3, h - y);
      }
    };
    const start = seed;
    if (rim) { g.strokeStyle = rim; g.lineWidth = 3; path(); g.stroke(); }
    seed = start; // same shapes again, filled over the inner half of the rim
    g.fillStyle = color; path(); g.fill();
  }

  function skyline(g, w, h, minH, color, rim, windows) {
    let x = 0;
    while (x < w) {
      const bw = between(w / 90, w / 35), bh = h * between(minH, 1);
      g.fillStyle = color;
      g.fillRect(x, h - bh, bw, bh);
      if (rim) { g.fillStyle = rim; g.fillRect(x, h - bh, bw, 1.5); }
      if (windows) {
        for (let wy = h - bh + 6; wy < h - 4; wy += 7) {
          for (let wx = x + 3; wx < x + bw - 3; wx += 6) {
            if (rand() < 0.18) {
              g.fillStyle = rand() < 0.8 ? "rgba(255, 180, 84, 0.7)" : "rgba(122, 215, 255, 0.7)";
              g.fillRect(wx, wy, 2, 3);
            }
          }
        }
      }
      x += bw + between(0, w / 300);
    }
  }

  function buildBackground() {
    seed = 11;
    const lw = W * 2; // layers are two screens wide and wrap
    const fh = Math.max(60, horizon * 0.32), nh = Math.max(40, horizon * 0.18);
    const u = W / 800;

    BIOMES.forEach((b, k) => {
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      [0, 0.5, 0.82, 1].forEach((at, i) => sky.addColorStop(at, b.sky[i]));
      skies[k] = sky;
    });

    stars = layer(lw, horizon, (g, w, h) => {
      for (let i = 0; i < 160; i++) {
        g.fillStyle = `rgba(255, 255, 255, ${between(0.2, 0.7)})`;
        const r = between(0.5, 1.4) * u;
        g.fillRect(between(0, w), between(0, h * 0.75), r, r);
      }
    });

    // Jungle: the volcano behind a canopy.
    layers[0] = {
      far: layer(lw, fh, (g, w, h) => { silhouette(g, w, h, h * 0.7, h * 0.12, w / 90, "#14201f", null); volcano(g, w, h); }),
      near: layer(lw, nh, (g, w, h) => crowns(g, w, h, h * 0.55, 9 * u, 16 * u, "#06110b", "rgba(45, 226, 166, 0.5)", false)),
    };
    // Swamp: a flat-topped treeline, mist on the water.
    layers[1] = {
      far: layer(lw, fh, (g, w, h) => crowns(g, w, h, h * 0.75, 7 * u, 14 * u, "#132428", null, true)),
      near: layer(lw, nh, (g, w, h) => {
        const mist = g.createLinearGradient(0, 0, 0, h);
        mist.addColorStop(0, "rgba(122, 215, 255, 0)");
        mist.addColorStop(0.7, "rgba(122, 215, 255, 0.14)");
        mist.addColorStop(1, "rgba(122, 215, 255, 0.05)");
        g.fillStyle = mist;
        g.fillRect(0, 0, w, h);
        silhouette(g, w, h, h * 0.85, h * 0.06, w / 160, "#071417", "rgba(122, 215, 255, 0.35)");
      }),
    };
    // City: two rows of skyline.
    layers[2] = {
      far: layer(lw, horizon * 0.42, (g, w, h) => skyline(g, w, h, 0.25, "#1c0d2c", null, true)),
      near: layer(lw, horizon * 0.22, (g, w, h) => skyline(g, w, h, 0.2, "#0d0617", "rgba(255, 61, 127, 0.7)", false)),
    };
    // Beach: far islands, low dunes.
    layers[3] = {
      far: layer(lw, fh * 0.6, (g, w, h) => {
        g.fillStyle = "#1e0e2c";
        for (let i = 0; i < 4; i++) {
          const x = between(0, w), iw = between(w / 30, w / 10), ih = between(h * 0.15, h * 0.45);
          g.beginPath();
          g.ellipse(x, h, iw, ih, 0, Math.PI, 0);
          g.fill();
        }
        // The lighthouse, on an island of its own.
        const lx = Math.round(w * LIGHTHOUSE), ly = Math.round(h);
        g.beginPath();
        g.ellipse(lx, ly, w / 40, h * 0.18, 0, Math.PI, 0);
        g.fill();
        for (let i = 0; i < 4; i++) {
          g.fillStyle = i % 2 ? "#f1e9e4" : "#ff2d6f";
          g.fillRect(lx - 1, ly - 6 - i * 2, 2, 2);
        }
        g.fillStyle = "#fff3d6";
        g.fillRect(lx - 1, ly - 13, 2, 2);
      }),
      near: layer(lw, nh * 0.6, (g, w, h) => silhouette(g, w, h, h * 0.75, h * 0.08, w / 40, "#1a0e1c", "rgba(255, 122, 26, 0.4)")),
    };
  }

  function drawWrapped(img, offset, y) {
    const w = img.width;
    const x = -((offset % 1 + 1) % 1) * w;
    ctx.drawImage(img, x, y);
    if (x + w < W) ctx.drawImage(img, x + w, y);
  }

  // The sun drifts sideways in curves; on the last stretch it settles over the middle of the sea.
  function drawSun(center) {
    const r = Math.min(W, Hh) * 0.2;
    const range = W * 1.6;
    const drift = W / 2 - ((((offsets.sun + 0.5) % 1) + 1) % 1 - 0.5) * range;
    const cx = drift + (W / 2 - drift) * center;
    const cy = horizon - r * 0.55;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, horizon);
    ctx.clip();
    const halo = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 2.2);
    halo.addColorStop(0, "rgba(255, 60, 110, 0.35)");
    halo.addColorStop(1, "rgba(255, 60, 110, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
    const body = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    body.addColorStop(0, "#ffd27a");
    body.addColorStop(0.45, "#ff7a1a");
    body.addColorStop(0.85, "#ff2d6f");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // The stripes: gaps that widen toward the horizon.
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 6; i++) {
      const y = cy - r * 0.2 + i * r * 0.17;
      ctx.fillRect(cx - r, y, r * 2, r * (0.03 + i * 0.025));
    }
    ctx.restore();
  }

  // Biomes cross-fade: the next one's sky and horizon are drawn over at the blend's opacity.
  function drawSky(k, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = skies[k];
    ctx.fillRect(0, 0, W, horizon);
    ctx.globalAlpha = 1;
  }
  function drawLayer(k, which, alpha, offset) {
    if (alpha <= 0) return;
    const img = layers[k][which];
    ctx.globalAlpha = alpha;
    drawWrapped(img, offset, horizon - img.height + 1);
    ctx.globalAlpha = 1;
  }

  // ---- Projection ----
  function project(p, camX, camY, camZ) {
    p.camera.x = (p.world.x || 0) - camX;
    p.camera.y = (p.world.y || 0) - camY;
    p.camera.z = (p.world.z || 0) - camZ;
    p.screen.scale = DEPTH / p.camera.z;
    p.screen.x = Math.round(W / 2 + p.screen.scale * p.camera.x * unitX);
    p.screen.y = Math.round(horizon - p.screen.scale * p.camera.y * unitY);
    p.screen.w = Math.round(p.screen.scale * ROAD_WIDTH * unitX);
  }

  function quad(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  let fogColor = BIOMES[0].fog;
  let clock = 0;                            // seconds; for what moves while parked
  let sandZ = Infinity, shoreZ = Infinity;  // where the road runs out, and where the sea starts

  function drawSegment(seg, fog) {
    const { x: x1, y: y1, w: w1 } = seg.p1.screen;
    const { x: x2, y: y2, w: w2 } = seg.p2.screen;
    const color = seg.color;
    const z = seg.p1.world.z;
    const swell = Math.floor(seg.index / RUMBLE) % SEA.length; // the palette cycle rolls the waves in
    if (z >= shoreZ) {
      // The end of the road: nothing but sea, with foam where it starts.
      ctx.fillStyle = z < shoreZ + 2 * SEGMENT ? FOAM[0] : SEA[swell];
      ctx.fillRect(0, y2, W, y1 - y2);
    } else {
      ctx.fillStyle = color.grass;
      ctx.fillRect(0, y2, W, y1 - y2);
      // Beach: the sea on the right, past a strip of sand and a line of foam that washes in and out.
      if (seg.shore) {
        const shore = seg.shore + 0.05 * Math.sin(clock * 1.6 + seg.index * 0.35);
        const s1 = x1 + w1 * shore, s2 = x2 + w2 * shore;
        if (s1 < W || s2 < W) {
          quad(s1, y1, Math.max(W, s1), y1, Math.max(W, s2), y2, s2, y2, SEA[swell]);
          quad(s1 - w1 * 0.05, y1, s1, y1, s2, y2, s2 - w2 * 0.05, y2, color.foam);
        }
      }
      // Into the sand: the road narrows and runs out before the water.
      const taper = z >= sandZ ? 1 - (z - sandZ) / (shoreZ - sandZ) : 1;
      if (taper > 0) {
        const n1 = w1 * taper, n2 = w2 * taper;
        if (taper === 1) {
          const r1 = w1 / 6, r2 = w2 / 6;
          quad(x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
          quad(x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
        }
        quad(x1 - n1, y1, x1 + n1, y1, x2 + n2, y2, x2 - n2, y2, color.road);
        if (color.lane && taper === 1) {
          const l1 = w1 / 32, l2 = w2 / 32;
          const lw1 = (w1 * 2) / LANES, lw2 = (w2 * 2) / LANES;
          let lx1 = x1 - w1 + lw1, lx2 = x2 - w2 + lw2;
          for (let lane = 1; lane < LANES; lane++, lx1 += lw1, lx2 += lw2) {
            quad(lx1 - l1 / 2, y1, lx1 + l1 / 2, y1, lx2 + l2 / 2, y2, lx2 - l2 / 2, y2, color.lane);
          }
        }
      }
    }
    if (fog < 1) {
      ctx.globalAlpha = 1 - fog;
      ctx.fillStyle = fogColor;
      ctx.fillRect(0, y2, W, y1 - y2);
      ctx.globalAlpha = 1;
    }
  }

  function drawSprite(img, offset, scale, x, y, clipY) {
    const dw = img.world.w * scale * unitX;
    const dh = img.world.h * scale * unitX;
    if (dw < 1.5) return;
    const dx = x + dw * (offset < 0 ? -1 : 0);
    const dy = y - dh;
    const clipH = clipY ? Math.max(0, dy + dh - clipY) : 0;
    if (clipH >= dh) return;
    const sh = img.height * (1 - clipH / dh);
    ctx.drawImage(img, 0, 0, img.width, sh, dx, dy, dw, dh - clipH);
  }

  // Neon signs misbehave now and then.
  const flicker = (n) => (Math.sin(clock * 9 + n * 1.7) > 0.94 || Math.sin(clock * 23 + n) > 0.97 ? 0.35 : 1);

  // Headlights: a pool of light on the road ahead of the car.
  function drawHeadlights(base, fade) {
    if (fade <= 0) return;
    const far = segments[(base.index + Math.round(playerZ / SEGMENT) + 16) % segments.length];
    const nearY = carBottom - 24 * carScale, half = 26 * carScale;
    if (far.p1.camera.z <= DEPTH || far.p1.screen.y >= nearY) return;
    const fy = Math.max(far.p1.screen.y, horizon), fw = far.p1.screen.w * 0.55;
    const glow = ctx.createLinearGradient(0, nearY, 0, fy);
    glow.addColorStop(0, `rgba(255, 236, 190, ${0.16 * fade})`);
    glow.addColorStop(1, "rgba(255, 236, 190, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(W / 2 - half, nearY); ctx.lineTo(W / 2 + half, nearY);
    ctx.lineTo(far.p1.screen.x + fw, fy); ctx.lineTo(far.p1.screen.x - fw, fy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Fireflies over the jungle and the swamp, while parked.
  function drawFireflies(amount) {
    if (amount <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 24; i++) {
      const a = Math.sin(i * 12.9898) * 43758.5453, b = Math.sin(i * 78.233) * 12543.1;
      const fx = a - Math.floor(a), fy = b - Math.floor(b);
      const x = Math.round((((fx * W + Math.sin(clock * 0.4 + i) * 10) % W) + W) % W);
      const y = Math.round(horizon + fy * (carBottom - horizon) * 0.8 + Math.sin(clock * 0.9 + i * 2.1) * 4);
      const glow = (0.5 + 0.5 * Math.sin(clock * 2.3 + i * 1.7)) * amount;
      // One bright pixel; the nearer ones (lower down) get a dim cross around it.
      if (fy > 0.5) {
        ctx.fillStyle = `rgba(150, 255, 60, ${0.35 * glow})`;
        ctx.fillRect(x - 1, y, 3, 1);
        ctx.fillRect(x, y - 1, 1, 3);
      }
      ctx.fillStyle = `rgba(230, 255, 120, ${glow})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }

  // A parrot crosses the jungle sky now and then.
  function drawParrot(amount) {
    const p = (clock / 13) % 1;
    if (amount <= 0.01 || p > 0.6) return;
    ctx.globalAlpha = amount;
    ctx.drawImage(parrot[Math.floor(clock * 8) % 2], Math.round((p / 0.6) * 1.3 * W - 0.15 * W), Math.round(horizon * 0.42 + Math.sin(clock * 2.5) * 2));
    ctx.globalAlpha = 1;
  }

  // The lighthouse on the far island at the beach sweeps its beam across the horizon.
  const LIGHTHOUSE = 0.72; // across the far layer
  function drawBeam(alpha) {
    if (alpha <= 0.01) return;
    const img = layers[BIOMES.length - 1].far, lw = img.width;
    const x0 = -(((offsets.far % 1) + 1) % 1) * lw, y = horizon - img.height + 1 + (img.height - 12);
    const c = Math.cos(clock * 1.3), len = W * 0.45 * c;
    if (Math.abs(c) < 0.08) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 243, 214, ${0.22 * Math.abs(c) * alpha})`;
    for (const bx of [x0 + LIGHTHOUSE * lw, x0 + (1 + LIGHTHOUSE) * lw]) {
      if (bx + Math.min(0, len) > W || bx + Math.max(0, len) < 0) continue;
      ctx.beginPath();
      ctx.moveTo(bx, y);
      ctx.lineTo(bx + len, y - 2 - Math.abs(c) * 3);
      ctx.lineTo(bx + len, y + 2 + Math.abs(c) * 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // City traffic: a few cars in the left lane at a steady pace, minding their own business.
  const busy = [];
  function placeTraffic() {
    for (const seg of busy) seg.dyn = null;
    busy.length = 0;
    const a = bounds[2] * SEGMENT, len = (bounds[3] - bounds[2]) * SEGMENT;
    for (let i = 0; i < 4; i++) {
      const seg = segments[Math.floor((a + ((i / 4 + (clock * 1600) / len) % 1) * len) / SEGMENT)];
      if (!seg.dyn) { seg.dyn = []; busy.push(seg); }
      seg.dyn.push({ img: SPRITES.traffic, offset: -0.62, center: true });
    }
  }

  // The side view, for the opening (jungle, door still open) and the ending (the beach).
  function drawSideScene(k, alpha) {
    const S = carScale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = skies[k];
    ctx.fillRect(0, 0, W, horizon);
    drawWrapped(stars, offsets.stars, 0);
    drawSun(1);
    const far = layers[k].far;
    drawWrapped(far, offsets.far, horizon - far.height + 1);
    if (k === BIOMES.length - 1) drawBeam(1);
    else drawParrot(1);
    const plant = (img, x, bottom, height) => {
      const h = height, w = (img.world.w / img.world.h) * h;
      ctx.drawImage(img, x - w / 2, bottom - h, w, h);
    };
    if (k === BIOMES.length - 1) {
      // The ocean, from the horizon down to the sand the car is parked on: calm, a smooth
      // gradient (not the cycling sea colours), with a few still lines for texture.
      const shore = carBottom - 9 * S, sea = shore - horizon;
      const water = ctx.createLinearGradient(0, horizon, 0, shore);
      water.addColorStop(0, "#2a2a5e");
      water.addColorStop(1, "#16163a");
      ctx.fillStyle = water;
      ctx.fillRect(0, horizon, W, sea);
      ctx.fillStyle = "#232458";
      for (const p of [0.08, 0.2, 0.36, 0.56]) ctx.fillRect(0, Math.round(horizon + sea * p), W, 1);
      ctx.fillStyle = "rgba(255, 122, 26, 0.3)"; // the sun on the water, barely moving
      for (let i = 1; i < 8; i++) {
        const y = horizon + sea * (i / 8) ** 1.5, half = W * 0.06 * (1 - i / 10) * (0.92 + 0.08 * Math.sin(clock * 0.6 + i));
        ctx.fillRect(Math.round(W / 2 - half), Math.round(y), Math.round(half * 2), 1);
      }
      // Now and then a wave: one long, soft line that rolls slowly toward the shore, gets
      // lighter as it comes, and breaks gently just before the sand.
      for (let i = 0; i < 3; i++) {
        const t = clock / 14 + i / 3, p = t % 1, round = Math.floor(t);
        if (p > 0.9) continue;
        const h = Math.abs(Math.sin(round * 12.9898 + i * 78.233) * 43758.5453) % 1;
        const y = Math.round(horizon + sea * (0.3 + 0.7 * p ** 1.3));
        const len = Math.round(W * (0.12 + 0.22 * p)), x = Math.round(W * (0.1 + 0.8 * h) - len / 2);
        const fade = Math.min(1, p / 0.15, (0.9 - p) / 0.1);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p > 0.8 ? FOAM[0] : p > 0.45 ? "#8a90d0" : "#4a4f9a";
        ctx.fillRect(x, y, len, 1);
        if (p > 0.45) ctx.fillRect(x + 3, y - 1, len - 6, 1);
        ctx.globalAlpha = 1;
      }
      // The shore: foam runs up the sand now and then and drains back, leaving it wet.
      ctx.fillStyle = BIOMES[k].grass[0];
      ctx.fillRect(0, shore, W, Hh);
      ctx.fillStyle = BIOMES[k].grass[1];
      ctx.fillRect(0, shore, W, 4 * S);
      const run = Math.max(0, Math.sin(clock * 0.45)) * 3 * S;
      ctx.fillStyle = FOAM[0];
      ctx.fillRect(0, shore - 1, W, 1);
      for (let x = 0; x < W; x += 4) {
        const reach = Math.round(run + Math.sin(x * 0.12 + clock * 0.5) * S);
        if (reach > 0) ctx.fillRect(x, shore, 4, reach);
      }
      plant(SPRITES.palm, W * 0.08, carBottom + 4 * S, 90 * S);
      plant(SPRITES.palm, W * 0.93, carBottom + 2 * S, 75 * S);
    } else {
      // The road seen from the side: a dark band with rumble strips, jungle behind it.
      const roadTop = carBottom - 6 * S, roadBottom = carBottom + 6 * S;
      ctx.fillStyle = BIOMES[k].grass[1];
      ctx.fillRect(0, horizon, W, Hh - horizon);
      const near = layers[k].near;
      drawWrapped(near, offsets.near, horizon - near.height + 1);
      const row = [SPRITES.tree, SPRITES.jpalm, SPRITES.banana, SPRITES.tree, SPRITES.fern, SPRITES.jpalm, SPRITES.tree];
      row.forEach((img, i) => plant(img, (W * (i + 0.5)) / row.length, roadTop - S, (img === SPRITES.fern ? 18 : img === SPRITES.banana ? 34 : 78) * S));
      ctx.fillStyle = ROAD[0].road;
      ctx.fillRect(0, roadTop, W, roadBottom - roadTop);
      const block = 10 * S;
      for (let x = 0, i = 0; x < W; x += block, i++) {
        ctx.fillStyle = i % 2 ? ROAD[1].rumble : ROAD[0].rumble;
        ctx.fillRect(x, roadTop - S, block, S);
        ctx.fillRect(x, roadBottom, block, S);
      }
    }
    ctx.restore();
  }

  // Traffic: the same model in teal, seen from behind, cut out once.
  SPRITES.traffic = (() => {
    renderCar({ yaw: 0, roll: 0, steer: 0, door: 0, dist: 11, brake: 0, body: [40, 140, 150] });
    let x0 = CAR_PX.w, y0 = CAR_PX.h, x1 = 0, y1 = 0;
    for (let y = 0; y < CAR_PX.h; y++) for (let x = 0; x < CAR_PX.w; x++) {
      if (!carPixels[y * CAR_PX.w + x]) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    const c = document.createElement("canvas");
    c.width = x1 - x0 + 1; c.height = y1 - y0 + 1;
    c.getContext("2d").drawImage(carCanvas, x0, y0, c.width, c.height, 0, 0, c.width, c.height);
    c.world = { w: 1150, h: (1150 * c.height) / c.width };
    return c;
  })();

  // The car on the main canvas, with its shadow, underglow and brake lights. The camera
  // orbits it in the opening; at the end the car itself steers right and turns to park
  // along the shore, and the camera backs off to take it side-on.
  function drawCar() {
    const deg = Math.PI / 180;
    const turn = smoothstep(0.1, 0.8, outro);
    let yaw, dist, offX = 0, steerAngle = steer * 20 * deg, roll = steer * 2.5 * deg;
    if (introSide > 0) {
      yaw = 90 * deg * introSide;
      dist = 11 + 3 * introSide;
    } else {
      const arc = Math.sin(Math.PI * smoothstep(0.05, 0.85, outro));
      yaw = 90 * deg * turn + steer * 6 * deg * (1 - turn);
      dist = 11 + 3 * smoothstep(0.3, 1, outro);
      offX = arc * 0.1 * W;
      steerAngle += Math.sin(Math.PI * smoothstep(0.02, 0.75, outro)) * 28 * deg;
      roll += Math.sin(Math.PI * smoothstep(0.1, 0.7, outro)) * 3 * deg;
    }
    const info = renderCar({ yaw, roll, steer: steerAngle, door: doorAngle, dist, brake });

    const S = carScale, cx = W / 2 + shake + offX, top = carBottom - info.contact * S;
    const toMain = ([x, y]) => [cx + (x - CAR_PX.w / 2) * S, top + y * S];
    const fp = info.footprint.map(toMain);
    const xs = fp.map((p) => p[0]), ys = fp.map((p) => p[1]);
    const gx = (Math.min(...xs) + Math.max(...xs)) / 2, gy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const rx = ((Math.max(...xs) - Math.min(...xs)) / 2) * 1.08, ry = Math.max((Math.max(...ys) - Math.min(...ys)) / 2, 3 * S);
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.beginPath();
    ctx.ellipse(gx, gy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // Underglow: magenta light spilling onto the road.
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, rx * 1.3);
    const pulse = reduce ? 1 : 0.85 + 0.15 * Math.sin(clock * 2.2);
    glow.addColorStop(0, `rgba(255, 61, 127, ${0.32 * pulse})`);
    glow.addColorStop(1, "rgba(255, 61, 127, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(gx, gy, rx * 1.3, ry * 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(carCanvas, cx - (CAR_PX.w / 2) * S, top, CAR_PX.w * S, CAR_PX.h * S);
    if (brake > 0.05 && info.tail.length) {
      ctx.globalCompositeOperation = "lighter";
      for (const [x, y] of info.tail.map(toMain)) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14 * S);
        g.addColorStop(0, `rgba(255, 60, 80, ${0.5 * brake})`);
        g.addColorStop(1, "rgba(255, 60, 80, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 14 * S, y - 14 * S, 28 * S, 28 * S);
      }
    }
    ctx.restore();
  }

  // ---- Frame ----
  const trackLength = () => segments.length * SEGMENT;
  const findSegment = (z) => segments[((Math.floor(z / SEGMENT) % segments.length) + segments.length) % segments.length];

  function render() {
    const base = findSegment(position);
    const basePercent = (position % SEGMENT) / SEGMENT;
    const camZ = position;
    // Third person: the camera rides behind the car, at the height of the road under the car.
    const carZ = position + playerZ;
    const under = findSegment(carZ);
    const camY = CAM_HEIGHT + easeInOut(under.p1.world.y, under.p2.world.y, (carZ % SEGMENT) / SEGMENT);
    const k = base.biome, t = base.blend, k2 = Math.min(k + 1, BIOMES.length - 1);
    fogColor = mix(BIOMES[k].fog, BIOMES[k2].fog, t);
    const ending = reduce ? 0 : smoothstep(boards[boards.length - 1].stopPos - 1.5 * GAP * SEGMENT, boards[boards.length - 1].stopPos, position);

    drawSky(k, 1);
    if (t > 0) drawSky(k2, t);
    drawWrapped(stars, offsets.stars, 0);
    drawSun(ending);
    drawLayer(k, "far", 1 - t, offsets.far);
    drawLayer(k2, "far", t, offsets.far);
    drawBeam(k === BIOMES.length - 1 ? 1 : k2 === BIOMES.length - 1 ? t : 0);
    drawParrot(k === 0 ? 1 - t : 0);
    drawLayer(k, "near", (1 - t) * (1 - ending), offsets.near);
    drawLayer(k2, "near", t * (1 - ending), offsets.near);
    ctx.fillStyle = fogColor;
    ctx.fillRect(0, horizon, W, Hh - horizon);

    let maxY = Hh;
    let x = 0;
    let dx = -(base.curve * basePercent);
    for (let n = 0; n < DRAW; n++) {
      const seg = segments[(base.index + n) % segments.length];
      const looped = seg.index < base.index;
      const fog = 1 / Math.exp((n / DRAW) ** 2 * FOG);
      seg.clip = maxY;
      const z = camZ - (looped ? trackLength() : 0);
      project(seg.p1, -x, camY, z);
      project(seg.p2, -x - dx, camY, z);
      x += dx;
      dx += seg.curve;
      if (seg.p1.camera.z <= DEPTH || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxY) continue;
      drawSegment(seg, fog);
      maxY = seg.p1.screen.y;
    }

    drawHeadlights(base, 1 - Math.max(swing, smoothstep(0.1, 0.6, outro)));

    placeTraffic();

    // Sprites back to front, clipped by the hill crest in front of them. Nothing grows on the sand.
    for (let n = DRAW - 1; n > 0; n--) {
      const seg = segments[(base.index + n) % segments.length];
      if (seg.p1.camera.z <= DEPTH || seg.p1.world.z > sandZ) continue;
      const scale = seg.p1.screen.scale;
      for (const sprite of seg.dyn ? seg.sprites.concat(seg.dyn) : seg.sprites) {
        // Animated sprites have frames; the alligator surfaces now and then.
        const img = Array.isArray(sprite.img) ? sprite.img[Math.sin(clock * 0.6 + seg.index) > 0.55 ? 1 : 0] : sprite.img;
        let sx = seg.p1.screen.x + scale * sprite.offset * ROAD_WIDTH * unitX;
        if (sprite.center) sx -= (img.world.w * scale * unitX) / 2;
        if (img.flicker && !reduce) ctx.globalAlpha = flicker(seg.index);
        drawSprite(img, sprite.center ? 1 : sprite.offset, scale, sx, seg.p1.screen.y, seg.clip);
        ctx.globalAlpha = 1;
      }
    }

    if (!reduce) drawFireflies((k === 0 ? 1 : k === 1 ? 1 - t : 0) * (1 - Math.min(1, speed / 3000)) * (1 - swing));
    if (swing > 0) drawSideScene(swingBiome, swing);
    drawCar();
    applyPalette();

    if (!reduce) placeBillboards(base);
  }

  // Each board stands on its segment: bottom on the posts, inner edge toward the road.
  // Until it has reached reading size it is kept fully on screen (between the top bar and the
  // car), so curves and hills can't push it out of view or behind a crest; after that it is
  // let go, flies past and fades.
  function placeBillboards(base) {
    const show = 1 - clamp(introSide * 1.5, 0, 1); // boards wait for the opening scene
    for (const b of boards) {
      const n = b.seg - base.index;
      const p = segments[b.seg].p1;
      if (show <= 0 || n <= 0 || n >= DRAW || p.camera.z <= DEPTH) { hide(b); continue; }
      const s = READ_Z / p.camera.z;
      const cx = p.screen.x / dpr;
      const roadY = p.screen.y / dpr;
      let left = b.side > 0 ? cx + s * b.gap : cx - s * (b.gap + b.w);
      let top = roadY - s * (POST + b.h);
      const roadTop = top;

      const free = smoothstep(b.sRead * 1.02, b.sRead * 1.6, s);
      // Phones: centred. Wider screens: as close to its roadside spot as the edges allow.
      const pinnedLeft = portrait ? (vw - s * b.w) / 2 : clamp(left, MARGIN, Math.max(MARGIN, vw - MARGIN - s * b.w));
      const pinnedTop = Math.max(Math.min(top, b.floor - s * b.h), ceiling);
      left = pinnedLeft + (left - pinnedLeft) * free;
      top = pinnedTop + (top - pinnedTop) * free;
      const fade = 1 - smoothstep(b.sRead * 1.5, b.sRead * 2.6, s);
      if (fade <= 0 || left > vw || left + s * b.w < 0 || top > vh) { hide(b); continue; }

      // Hill crests in front hide the lower part of a distant board, never one being read.
      const clipY = segments[b.seg].clip / dpr;
      const pinShift = Math.abs(top - roadTop);
      const reading = smoothstep(b.sRead * 0.7, b.sRead * 0.95, s);
      const hidden = Math.max(0, b.h + POST + 80 - (clipY - roadTop) / s) * Math.max(0, 1 - pinShift / 40) * (1 - reading);
      if (hidden >= b.h + POST + 80) { hide(b); continue; }
      const st = b.el.style;
      st.clipPath = hidden > 0 ? `inset(-80px -80px ${(hidden - POST - 80).toFixed(1)}px -80px)` : "";
      st.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px) scale(${s.toFixed(4)})`;
      st.opacity = (Math.min(1, (DRAW - n) / (DRAW * 0.3)) * fade * show).toFixed(3);
      st.zIndex = String(DRAW - n);
      st.pointerEvents = show > 0.5 && s > b.sRead * 0.8 && s < b.sRead * 1.3 ? "auto" : "none";
      if (!b.shown) { st.visibility = "visible"; b.shown = true; }
    }
    // In the side view at the end the last board floats; its posts would stand in the sea.
    boards[boards.length - 1].el.classList.toggle("sign--afloat", swing > 0.5);
  }

  function hide(b) {
    if (!b.shown) return;
    b.el.style.visibility = "hidden";
    b.shown = false;
  }

  // ---- Sizing ----
  // dpr: canvas pixels per CSS pixel. The world is drawn at one canvas pixel per art pixel
  // (PIX CSS pixels) and scaled up crisp, so everything shares the car's pixel grid.
  let dpr = 1, PIX = 4, vw = 0, vh = 0, ceiling = 0, portrait = false;
  let playerZ = 1000;              // how far ahead of the camera the car is
  let carScale = 1, carBottom = 0; // canvas pixels per car pixel; where the wheels touch the road
  let measured = false;

  function resize() {
    if (agentView.checked) return; // nothing to measure; redone on switching back
    // Keep the car's place between two boards across the resize.
    const at = measured ? indexAt(position) : current;
    const aim = measured ? indexAt(target) : current;
    vw = window.innerWidth;
    vh = window.innerHeight;
    // The car: about a fifth of the width, smaller on short screens, parked just above the HUD.
    // It is about 64 art pixels wide, which sets the pixel size; phones get chunkier pixels.
    const short = vh < 520;
    const carW = clamp(Math.min(vw * 0.22, vh * (short ? 0.3 : 0.4)), short ? 100 : 140, 420);
    PIX = Math.max(vw < 500 ? 3 : 2, Math.round(carW / 64));
    dpr = 1 / PIX;
    W = canvas.width = Math.ceil(vw * dpr);
    Hh = canvas.height = Math.ceil(vh * dpr);
    canvas.style.width = `${W * PIX}px`;
    canvas.style.height = `${Hh * PIX}px`;
    root.style.setProperty("--pix", `${PIX}px`);
    ctx.imageSmoothingEnabled = false;
    CAR_PX.f = (265 * carW) / PIX / 62;
    portrait = Hh > W;
    horizon = Math.round(Hh * (portrait ? 0.58 : 0.56));
    // Same scale on both axes in portrait, so phones get a wide road instead of a tall one.
    unitX = portrait ? W * 0.5 : W / 2;
    unitY = portrait ? unitX : Hh / 2;
    const hudH = reduce ? 0 : hud.bar.offsetHeight;
    carBottom = Math.round((vh - hudH - 6) * dpr);
    playerZ = (DEPTH * CAM_HEIGHT * unitY) / Math.max(1, carBottom - horizon);
    buildBackground();
    if (!reduce) {
      measureBoards((carBottom - 36 * carScale) / dpr - 8, vh - hudH - 4);
      measured = true;
      if (drive) { position = target = boards[drive.i].stopPos; drive = null; }
      else { position = posAtIndex(at); target = posAtIndex(aim); }
      const end = boards[boards.length - 1].stopPos + playerZ;
      shoreZ = end + 5 * SEGMENT;
      sandZ = shoreZ - 16 * SEGMENT;
      buildMap();
    }
    render();
  }

  // Reading size per board: as close to 1:1 as fits between the top bar and the car; bigger
  // screens read a little larger. That is where the car parks for it. A board that would get
  // too small above the car may cover it instead: the text matters more than the car.
  function measureBoards(aboveCar, aboveHud) {
    ceiling = topbar.offsetHeight + 8;
    const room = (aboveCar - ceiling) * 0.97;
    const roomAll = (aboveHud - ceiling) * 0.97;
    const fitX = (w) => (vw - 2 * MARGIN) / w;
    const big = clamp(Math.min(vw / 1280, vh / 820), 1, 1.5);
    // Above the car if it reads at 0.8 or more there; otherwise it may cover the car.
    const reading = (w, h) => {
      const sCar = Math.min(big, fitX(w), room / h);
      return { sCar, s: Math.max(sCar, Math.min(big, fitX(w), roomAll / h, 0.8)) };
    };
    for (const b of boards) {
      const el = b.el, st = el.style;
      st.transform = "none";
      st.setProperty("--post", `${POST + 4}px`);
      // Wide, short screens: a board that is too tall for its width gets wider, and a long list
      // goes into two columns, whichever reads largest.
      const layouts = [[0, false]];
      el.classList.remove("sign--cols");
      st.width = "";
      const base = el.offsetWidth;
      // Good enough is good enough: the narrowest layout that reads at 0.85 wins, so boards
      // don't grow across the whole road just to reach 1:1.
      const enough = Math.min(big, 0.85);
      if (!portrait && reading(base, el.offsetHeight).s < enough) {
        const widest = Math.min(1400, fitX(1) / 0.6);
        const columns = el.querySelector(".limits, .log, .strengths") ? [false, true] : [false];
        for (const cols of columns) for (let w = base + 80; w <= widest; w += 80) layouts.push([w, cols]);
      }
      let best = null;
      for (const [w, cols] of layouts) {
        el.classList.toggle("sign--cols", cols);
        st.width = w ? `${w}px` : "";
        const r = reading(el.offsetWidth, el.offsetHeight);
        if (!best || Math.min(r.s, enough) > Math.min(best.s, enough) + 0.01) best = { w, cols, ...r };
      }
      el.classList.toggle("sign--cols", best.cols);
      st.width = best.w ? `${best.w}px` : "";
      b.w = el.offsetWidth;
      b.h = el.offsetHeight;
      // Inner edge distance from the road centre at s = 1. Phones: centred over the road.
      b.gap = portrait ? -0.5 * b.w : Math.max(24, vw * 0.035);
      b.sRead = best.s;
      b.floor = best.s > best.sCar ? aboveHud : aboveCar;
      b.stopPos = Math.max(0, b.seg * SEGMENT - READ_Z / b.sRead);
    }
  }

  // Position <-> fractional board index (2.5 = halfway between the third and the fourth stop).
  function indexAt(pos) {
    const last = boards.length - 1;
    if (pos <= boards[0].stopPos) return 0;
    for (let i = 0; i < last; i++) {
      const a = boards[i].stopPos, b = boards[i + 1].stopPos;
      if (pos <= b) return i + (pos - a) / Math.max(1, b - a);
    }
    return last;
  }
  function posAtIndex(f) {
    const last = boards.length - 1;
    const i = clamp(Math.floor(f), 0, last), j = Math.min(i + 1, last);
    return boards[i].stopPos + (boards[j].stopPos - boards[i].stopPos) * (f - i);
  }

  // ---- Driving: scroll is the gas pedal; let go and the car parks at the nearest board ----
  const EASE = 4;              // how fast the car catches up with the pedal (1/s)
  const WHEEL = SEGMENT / 10;  // world units per pixel scrolled
  const TOUCH = SEGMENT / 4;   // ... per pixel swiped
  const SLOW = 1.5;            // near a board the pedal gets heavier: the car eases off to read
  const PAUSE = 140;           // ms without input before the car parks
  const KMH_MAX = 299;

  let position = 0, target = 0;
  let drive = null;            // a timed hop to board i: keys, buttons, Exits, links
  let snapping = false;        // input has happened; park once it pauses
  let dir = 1, lastInput = 0;
  let touch = null;
  let speed = 0, brake = 0, steer = 0; // steer: -1 (left) to 1 (right), follows the road
  let current = 0;             // the board the HUD shows
  let parkedAt = -1;           // the board the address bar points at
  let intro = null, introSide = 0, doorAngle = 0, shake = 0;
  let outro = 0;                  // 0 to 1 over the last stretch: the turn onto the beach
  let swing = 0, swingBiome = 0;  // how far the scenery has faded to the side view, and where
  let running = false, last = 0, frame = 0;

  function pedal(delta) {
    let bump = 0;
    for (const b of boards) {
      const d = (target - b.stopPos) / (GAP * SEGMENT * 0.22);
      if (d > -3 && d < 3) bump += Math.exp(-d * d);
    }
    target = clamp(target + delta / (1 + SLOW * bump), boards[0].stopPos, boards[boards.length - 1].stopPos);
  }

  // Any input takes over from the opening scene and from a hop in progress.
  function interrupt() {
    if (intro) endIntro();
    if (drive) { target = position; drive = null; }
  }

  function input(delta) {
    interrupt();
    if (delta) dir = Math.sign(delta);
    pedal(delta);
    lastInput = performance.now();
    snapping = true;
    wake();
  }

  // Park at the nearest board in the direction of travel; a small nudge forward still counts.
  function park() {
    snapping = false;
    const f = indexAt(target);
    const base = dir > 0 ? Math.floor(f + 1e-6) : Math.ceil(f - 1e-6);
    const i = clamp(Math.abs(f - base) > 0.12 ? base + dir : base, 0, boards.length - 1);
    target = boards[i].stopPos;
  }

  function go(i) {
    if (intro) endIntro();
    i = clamp(i, 0, boards.length - 1);
    const to = boards[i].stopPos;
    snapping = false;
    if (Math.abs(to - position) < 1) { drive = null; target = position = to; return; }
    const hops = Math.abs(to - position) / (GAP * SEGMENT);
    drive = { from: position, to, i, t0: performance.now(), dur: HOP * 1000 * (0.55 + 0.45 * Math.sqrt(hops)) };
    target = to;
    current = i;
    updateHud();
    wake();
  }

  // The opening: the door shuts, then the camera swings round behind the car.
  // The opening: the scissor door swings down and shuts, then the camera orbits round behind.
  const DOOR_OPEN = (70 * Math.PI) / 180;
  function startIntro() { intro = { t0: performance.now() }; introSide = 1; doorAngle = DOOR_OPEN; }
  function stepIntro(now) {
    const t = (now - intro.t0) / 1000;
    doorAngle = DOOR_OPEN * (1 - smoothstep(0.45, 0.75, t) ** 2);
    shake = t > 0.75 && t < 0.92 ? Math.round(Math.sin(t * 80)) : 0;
    introSide = t < 1.0 ? 1 : 1 - smootherstep(clamp((t - 1.0) / 1.7, 0, 1));
    if (t > 2.8) endIntro();
  }
  function endIntro() { intro = null; introSide = 0; doorAngle = 0; shake = 0; }

  function tick(now) {
    if (agentView.checked) { running = false; return; }
    // rAF time can be slightly earlier than the performance.now() taken elsewhere.
    const dt = clamp((now - last) / 1000, 0.001, 0.05);
    last = now;
    clock += dt;
    const before = position;

    if (intro) stepIntro(now);
    if (drive) {
      const p = clamp((now - drive.t0) / drive.dur, 0, 1);
      position = drive.from + (drive.to - drive.from) * smootherstep(p);
      if (p >= 1) { position = target = drive.to; drive = null; }
    } else {
      if (snapping && !touch && now - lastInput > PAUSE) park();
      position += (target - position) * (1 - Math.exp(-dt * EASE));
      if (Math.abs(target - position) < 0.5) position = target;
    }
    const moved = position - before;

    const seg = findSegment(position);
    const turn = seg.curve * (moved / SEGMENT);
    offsets.stars += turn * 0.0002;
    offsets.sun += turn * 0.0003;
    offsets.far += turn * 0.0008;
    offsets.near += turn * 0.0016;

    const was = speed;
    speed += (Math.abs(moved) / dt - speed) * (1 - Math.exp(-dt * 8));
    const braking = speed > 400 && was - speed > 12000 * dt;
    brake += ((braking ? 1 : 0) - brake) * (1 - Math.exp(-dt * 12));
    const curve = findSegment(position + playerZ).curve;
    const steerTo = clamp(curve / 5, -1, 1) * Math.min(1, speed / 6000);
    steer += (steerTo - steer) * (1 - Math.exp(-dt * 5));
    if (speed < 30) speed = 0;
    hud.kmh.textContent = Math.min(KMH_MAX, Math.round(speed * KMH));

    const lastStop = boards[boards.length - 1].stopPos;
    outro = smoothstep(lastStop - 0.7 * GAP * SEGMENT, lastStop, position);
    // The scenery switches once the car is about halfway round.
    swing = introSide > 0 ? smoothstep(0.2, 0.75, introSide) : smoothstep(0.45, 0.95, outro);
    swingBiome = introSide > 0 ? 0 : BIOMES.length - 1;

    const i = drive ? drive.i : Math.round(indexAt(position));
    if (i !== current) { current = i; updateHud(); }

    // Parked: keep the world alive (fireflies, neon, waves) at half the frame rate.
    const idle = !drive && !snapping && !touch && !intro && position === target && speed === 0;
    if (idle) settle();
    if (!idle || ++frame % 2 === 0) {
      render();
      updateMap();
    }
    requestAnimationFrame(tick);
  }

  function wake() {
    if (running || reduce) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }

  // ---- Input ----
  function onWheel(e) {
    if (agentView.checked || hud.exits.contains(e.target)) return;
    e.preventDefault();
    input(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh : 1) * WHEEL);
  }

  // Swipe: the drag drives, a flick carries on a little, letting go parks.
  function onTouchStart(e) {
    if (agentView.checked || e.touches.length !== 1) { touch = null; return; }
    if (intro) endIntro();
    if (drive) { target = position; drive = null; }
    touch = { y: e.touches[0].clientY, moved: 0, samples: [[performance.now(), e.touches[0].clientY]] };
  }
  function onTouchMove(e) {
    if (!touch || e.touches.length !== 1) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const dy = touch.y - y;
    touch.y = y;
    touch.moved += dy;
    touch.samples.push([performance.now(), y]);
    if (touch.samples.length > 6) touch.samples.shift();
    if (dy) { dir = Math.sign(dy); pedal(dy * TOUCH); wake(); }
  }
  function onTouchEnd() {
    if (!touch) return;
    const [t0, y0] = touch.samples[0];
    const [t1, y1] = touch.samples[touch.samples.length - 1];
    const v = t1 > t0 ? (y0 - y1) / (t1 - t0) : 0; // px per ms, forward is positive
    const moved = touch.moved;
    touch = null;
    if (Math.abs(moved) < 8) return; // a tap, not a swipe
    pedal(v * 160 * TOUCH);
    park();
    wake();
  }

  const KEYS = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, j: 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1, k: -1 };
  function onKey(e) {
    if (agentView.checked || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest("input, textarea, select, button, summary")) return;
    let to = null;
    if (e.key in KEYS) to = current + KEYS[e.key];
    else if (e.key === " ") to = current + (e.shiftKey ? -1 : 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = boards.length - 1;
    if (to === null) return;
    e.preventDefault();
    go(to);
  }

  // ---- Address bar: #section follows the drive, so links and the back button land right ----
  const sectionOf = (i) => {
    for (let j = i; j >= 0; j--) if (boards[j].el.id) return boards[j].el.id;
    return null;
  };
  function settle() {
    const i = Math.round(indexAt(position));
    if (i === parkedAt) return;
    const id = sectionOf(i);
    if (id && window.location.hash !== `#${id}`) {
      if (parkedAt < 0) history.replaceState(null, "", `#${id}`);
      else history.pushState(null, "", `#${id}`);
    }
    parkedAt = i;
  }
  const boardFromHash = () => boards.findIndex((b) => b.el.id && `#${b.el.id}` === window.location.hash);

  // ---- HUD: current section, the Exits menu, and the strip of biomes ----
  const exitNames = [];
  const map = document.querySelector(".hud__map");
  const dot = document.querySelector(".hud__dot");
  const mapAt = (pos) => {
    const a = boards[0].stopPos, z = boards[boards.length - 1].stopPos;
    return clamp((pos - a) / Math.max(1, z - a), 0, 1) * 100;
  };

  function buildMap() {
    // A biome starts on the strip where the car (not the camera) crosses into it.
    const edges = bounds.map((seg, k) => (k ? mapAt(seg * SEGMENT - playerZ) : 0));
    const stops = BIOMES.map((b, k) => `${b.rim} ${edges[k].toFixed(1)}% ${(k + 1 < BIOMES.length ? edges[k + 1] : 100).toFixed(1)}%`);
    map.style.background = `linear-gradient(90deg, ${stops.join(", ")})`;
    map.querySelectorAll(".hud__tick").forEach((tick) => tick.remove());
    for (const b of boards) {
      const tick = document.createElement("span");
      tick.className = "hud__tick";
      tick.style.left = `${mapAt(b.stopPos).toFixed(2)}%`;
      map.append(tick);
    }
  }
  function updateMap() { dot.style.left = `${mapAt(position).toFixed(2)}%`; }

  function buildExits() {
    boards.forEach((b, i) => {
      const name = b.el.dataset.exit;
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
        go(exit.index);
      });
      li.append(btn);
      return li;
    }));
  }

  function updateHud() {
    const sign = boards[current].el;
    const exitNo = exitNames.findIndex((e) => e.name === sign.dataset.exit) + 1;
    hud.exit.textContent = `Exit ${String(exitNo).padStart(2, "0")} / ${String(exitNames.length).padStart(2, "0")}`;
    const detail = sign.dataset.year || sign.dataset.step;
    hud.name.textContent = detail ? `${sign.dataset.exit} · ${detail}` : sign.dataset.exit;
    hud.prev.disabled = current === 0;
    hud.next.disabled = current === boards.length - 1;
  }

  // ---- Start ----
  reduceQuery.addEventListener("change", () => window.location.reload());
  placeBoards();
  buildTrack();

  if (reduce) {
    // A parked frame behind the plain document.
    root.classList.add("parked");
    resize();
    window.addEventListener("resize", resize);
    return;
  }

  root.classList.add("road");
  dressBoards();
  buildExits();
  const fromHash = boardFromHash();
  current = Math.max(0, fromHash);
  resize();
  updateHud();
  if (fromHash < 0) startIntro(); // arriving by link skips the opening scene
  wake();

  // Fonts and the photo change board sizes: measure again once they are in.
  document.fonts.ready.then(() => {
    resize();
  });
  for (const img of world.querySelectorAll("img")) if (!img.complete) img.addEventListener("load", resize);

  // Resizing: once per frame at most, keeping the car where it was.
  let resizing = false;
  const onResize = () => {
    if (resizing) return;
    resizing = true;
    requestAnimationFrame(() => { resizing = false; resize(); wake(); });
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("touchcancel", onTouchEnd);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  window.addEventListener("popstate", () => {
    const i = boardFromHash();
    parkedAt = Math.max(0, i);
    go(parkedAt);
  });
  hud.prev.addEventListener("click", () => go(current - 1));
  hud.next.addEventListener("click", () => go(current + 1));
  topbar.querySelector(".topbar__file").addEventListener("click", (e) => {
    if (agentView.checked) return;
    e.preventDefault();
    go(0);
  });

  // Keyboard users: tabbing to a link on a board drives there.
  world.addEventListener("focusin", (e) => {
    const i = boards.findIndex((b) => b.el.contains(e.target));
    if (i >= 0 && i !== current) go(i);
  });
  for (const radio of document.querySelectorAll(".view-radio")) radio.addEventListener("change", () => { resize(); wake(); });
})();
