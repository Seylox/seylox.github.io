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
  const ctx = canvas.getContext("2d", { alpha: false });
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
  const SEA = ["#1b1b45", "#151538"];
  const FOAM = ["#ffc2d4", "#6a3462"];
  const DARK = "#0b0712";

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

  // Swamp: bald cypress with hanging moss, reeds, dead snags, and a pair of eyes in the water.
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

  const eyes = sprite(140, 50, { w: 800, h: 290 }, (g, w, h) => {
    g.strokeStyle = "rgba(122, 215, 255, 0.45)";
    g.lineWidth = 2;
    g.beginPath(); g.ellipse(w / 2, h * 0.72, w * 0.42, h * 0.18, 0, 0, Math.PI * 2); g.stroke();
    for (const x of [w * 0.4, w * 0.6]) {
      const glow = g.createRadialGradient(x, h * 0.5, 0, x, h * 0.5, 14);
      glow.addColorStop(0, "#fff6b0");
      glow.addColorStop(0.3, "#ffd27a");
      glow.addColorStop(1, "rgba(255, 210, 122, 0)");
      g.fillStyle = glow;
      g.fillRect(x - 14, h * 0.5 - 14, 28, 28);
    }
  });

  // City: lamp poles, towers with lit windows, neon signs.
  const pole = sprite(96, 520, { w: 380, h: 3200 }, (g, w, h) => {
    const glow = g.createRadialGradient(w / 2, 40, 2, w / 2, 40, 46);
    glow.addColorStop(0, "#fff3d6");
    glow.addColorStop(0.25, "#ffb454");
    glow.addColorStop(1, "rgba(255, 122, 26, 0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, w, 96);
    g.fillStyle = "#24132f";
    g.fillRect(w / 2 - 5, 52, 10, h - 52);
    g.fillStyle = "#ff3d7f";
    g.fillRect(w / 2 + 3, 52, 2, h - 52);
  });

  const building = (rim) => {
    const cw = Math.round(between(150, 260)), ch = Math.round(between(300, 620));
    return sprite(cw, ch, { w: cw * 18, h: ch * 18 }, (g, w, h) => {
      g.fillStyle = "#0e0818";
      g.fillRect(0, 10, w, h - 10);
      g.fillStyle = rim;
      g.fillRect(0, 10, w, 3);
      g.globalAlpha = 0.6;
      g.fillRect(0, 10, 2, h - 10);
      g.fillRect(w - 2, 10, 2, h - 10);
      g.globalAlpha = 1;
      if (rand() < 0.5) g.fillRect(w * 0.7, 0, 2, 12); // antenna
      const cols = Math.floor((w - 16) / 18), rows = Math.floor((h - 40) / 24);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rand() > 0.32) continue;
          g.fillStyle = pick(["#ffb454", "#ffb454", "#ffd27a", "#7ad7ff", "#ff3d7f"]);
          g.globalAlpha = between(0.45, 0.95);
          g.fillRect(12 + c * 18, 28 + r * 24, 9, 12);
        }
      }
      g.globalAlpha = 1;
    });
  };

  const neon = (text, color) => sprite(320, 260, { w: 2800, h: 2250 }, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#1d1128";
    g.fillRect(w / 2 - 6, 110, 12, h - 110);
    g.fillStyle = DARK;
    g.fillRect(14, 14, w - 28, 92);
    g.shadowColor = color;
    g.shadowBlur = 16;
    g.strokeStyle = color;
    g.lineWidth = 4;
    g.strokeRect(14, 14, w - 28, 92);
    let size = 52;
    g.font = `800 ${size}px Orbitron, "Space Grotesk", sans-serif`;
    size *= Math.min(1, (w - 70) / g.measureText(text).width);
    g.font = `800 ${size}px Orbitron, "Space Grotesk", sans-serif`;
    g.fillStyle = color;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, w / 2, 62);
    g.shadowBlur = 0;
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

  seed = 3;
  const RIM = Object.fromEntries(BIOMES.map((b) => [b.name, b.rim]));
  const SPRITES = {
    tree: tree(RIM.jungle), banana: banana(RIM.jungle), fern: fern(RIM.jungle), jpalm: palm(RIM.jungle),
    cypress: cypress(RIM.swamp), reeds: reeds(RIM.swamp), snag: snag(RIM.swamp), eyes,
    pole, buildings: [1, 2, 3, 4, 5].map(() => building(rand() < 0.7 ? RIM.city : "#7ad7ff")),
    neon: [neon("MOTEL", "#ff3d7f"), neon("OPEN 24H", "#7ad7ff"), neon("ARCADE", "#ffb454")],
    palm: palm(RIM.city), umbrella: umbrella(RIM.beach), tower: tower(RIM.beach),
  };

  for (const s of SPRITES.neon) s.flicker = true;

  // ---- The car: pixel art, drawn small once and scaled up crisp. A generic 80s convertible. ----
  const CAR = {
    red: "#e8283c", dark: "#9c1428", light: "#ff8080", black: "#120a14", grey: "#3a3040", steel: "#6a5a70",
    skin: "#e8b48a", hair: "#3a2418", blonde: "#f0c860", shirt: "#2a6fd0", jeans: "#3a5fa8",
  };

  function pixels(w, h, paint) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    paint((x, y, pw, ph, color) => { g.fillStyle = color; g.fillRect(x, y, pw, ph); });
    return c;
  }

  // From behind, 64 x 32. lean -1, 0 or 1: in curves the body tips over the wheels.
  const rearCar = (lean, brake) => pixels(64, 32, (px) => {
    const C = CAR;
    const shift = (y) => (y < 22 ? Math.round((lean * (22 - y)) / 11) : 0);
    const row = (y, x0, x1, color) => px(x0 + shift(y), y, x1 - x0 + 1, 1, color);
    for (let y = 18; y < 32; y++) {
      px(0, y, 10, 1, C.black); px(54, y, 10, 1, C.black);
      if (y % 2) { px(1, y, 8, 1, C.grey); px(55, y, 8, 1, C.grey); }
    }
    // Two heads over the headrests: dark hair driving, blonde riding along.
    row(0, 19, 22, C.hair);
    for (let y = 1; y < 5; y++) row(y, 18, 23, C.hair);
    row(1, 41, 44, C.blonde);
    for (let y = 2; y < 8; y++) row(y, 40, 45, C.blonde);
    for (let y = 5; y < 9; y++) {
      row(y, 17, 24, y === 5 ? C.grey : C.black);
      row(y, 41, 44, y === 5 ? C.grey : C.black);
    }
    row(7, 8, 55, C.light);
    for (let y = 8; y < 11; y++) row(y, 6, 57, C.red);
    row(11, 6, 57, C.dark);
    row(12, 3, 60, C.light);
    row(13, 3, 60, C.red);
    const lamp = brake ? "#ff3048" : "#a0182a";
    for (let y = 14; y < 19; y++) {
      const lit = y % 2 === 0;
      row(y, 2, 61, C.dark);
      row(y, 4, 21, lit ? lamp : C.black);
      row(y, 42, 59, lit ? lamp : C.black);
      row(y, 22, 41, lit ? C.black : C.grey);
    }
    for (let y = 19; y < 22; y++) { row(y, 2, 61, C.dark); row(y, 26, 37, "#d9d2c5"); }
    for (let x = 28; x < 36; x += 2) row(20, x, x, C.black);
    px(2, 22, 60, 1, C.steel);
    px(2, 23, 60, 1, C.grey);
    px(10, 23, 3, 2, C.steel); px(51, 23, 3, 2, C.steel);
  });

  // From the side, 104 x 36, facing right. In the opening scene the door is still open.
  const sideCar = (open) => pixels(104, 36, (px) => {
    const C = CAR;
    const top = (x) => (x < 8 ? 17 - (x - 6) : x < 72 ? 15 : Math.round(15 + (x - 72) * 0.18));
    for (let y = 6; y < 12; y++) px(48, y, 5, 1, C.blonde);
    for (let y = 5; y < 12; y++) px(54, y, 5, 1, C.hair);
    px(57, 8, 2, 3, C.skin); px(57, 8, 2, 1, C.black);
    px(54, 12, 5, 3, C.shirt);
    for (let x = 6; x <= 100; x++) {
      const t = top(x), bottom = x < 8 || x > 98 ? 25 : 26;
      for (let y = t; y <= bottom; y++) px(x, y, 1, 1, y === t ? C.light : y >= 24 ? C.dark : C.red);
    }
    for (let i = 0; i < 9; i++) px(72 - Math.round(i * 0.75), 14 - i, 1, 1, C.grey); // windscreen frame
    for (const y of [18, 20, 22]) px(34, y, 10, 1, C.black);                           // air intake
    for (const wx of [24, 80]) {
      for (let y = 17; y < 36; y++) {
        for (let x = wx - 9; x <= wx + 9; x++) {
          const d = Math.hypot(x - wx, y - 28);
          if (d <= 7) px(x, y, 1, 1, d <= 1.5 ? C.grey : d <= 4 ? C.steel : C.black);
          else if (d <= 9 && y <= 28) px(x, y, 1, 1, C.black);
        }
      }
    }
    px(97, 19, 3, 2, "#fff3c4");
    px(6, 18, 2, 3, "#a0182a");
    if (open) {
      for (let y = 16; y < 26; y++) px(45, y, 13, 1, C.black);
      for (let y = 17; y < 23; y++) px(47, y, 6, 1, C.grey);
      for (let y = 19; y < 22; y++) px(53, y, 5, 1, C.jeans);
      for (let y = 13; y < 28; y++) px(58, y, 8, 1, y === 13 ? C.light : y >= 25 ? C.dark : C.red);
      px(58, 13, 1, 15, C.black);
    } else {
      px(44, 15, 1, 11, C.black); px(66, 15, 1, 11, C.black);
      px(61, 18, 3, 1, C.steel);
    }
  });

  const CAR_FRAMES = {
    rear: [-1, 0, 1].map((lean) => [rearCar(lean, false), rearCar(lean, true)]),
    open: sideCar(true),
    closed: sideCar(false),
  };

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
        if (rand() < 0.02) put(S.eyes, side() * between(1.3, 2.4));
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
    const crater = g.createRadialGradient(vx, h * 0.13, 1, vx, h * 0.13, vw * 0.32);
    crater.addColorStop(0, "rgba(255, 210, 122, 0.9)");
    crater.addColorStop(0.3, "rgba(255, 122, 26, 0.55)");
    crater.addColorStop(1, "rgba(255, 122, 26, 0)");
    g.fillStyle = crater;
    g.beginPath();
    g.arc(vx, h * 0.13, vw * 0.32, 0, Math.PI * 2);
    g.fill();
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
    const swell = (Math.floor(seg.index / RUMBLE) + Math.floor(clock * 1.5)) % 2; // waves roll in
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
      const x = (((fx * W + Math.sin(clock * 0.4 + i) * 40 * dpr) % W) + W) % W;
      const y = horizon + fy * (carBottom - horizon) * 0.8 + Math.sin(clock * 0.9 + i * 2.1) * 14 * dpr;
      const glow = (0.5 + 0.5 * Math.sin(clock * 2.3 + i * 1.7)) * amount;
      const r = (1.5 + fy * 2.5) * dpr; // the nearer ones sit lower and look bigger
      ctx.fillStyle = `rgba(150, 255, 60, ${0.1 * glow})`;
      ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(220, 255, 110, ${0.9 * glow})`;
      ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
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
    const plant = (img, x, bottom, height) => {
      const h = height, w = (img.world.w / img.world.h) * h;
      ctx.drawImage(img, x - w / 2, bottom - h, w, h);
    };
    if (k === BIOMES.length - 1) {
      // The ocean, from the horizon down to the sand the car is parked on.
      const shore = carBottom - 9 * S;
      ctx.fillStyle = SEA[1];
      ctx.fillRect(0, horizon, W, shore - horizon);
      ctx.fillStyle = SEA[0];
      for (let i = 0; i < 14; i++) {
        const p = ((i + clock * 0.25) % 14) / 14; // swell lines, closer together toward the horizon
        ctx.fillRect(0, horizon + (shore - horizon) * p * p, W, Math.max(1, 3 * p * dpr));
      }
      ctx.fillStyle = "rgba(255, 122, 26, 0.35)"; // the sun on the water
      for (let i = 1; i < 8; i++) {
        const y = horizon + (shore - horizon) * (i / 8) ** 1.5, half = W * 0.06 * (1 - i / 10) * (0.8 + 0.2 * Math.sin(clock * 2 + i));
        ctx.fillRect(W / 2 - half, y, half * 2, Math.max(1, i * 0.6 * dpr));
      }
      const wash = Math.sin(clock * 0.8) * 1.5 * S;
      ctx.fillStyle = FOAM[0];
      ctx.fillRect(0, shore - S + wash, W, 1.5 * S);
      ctx.fillStyle = BIOMES[k].grass[0];
      ctx.fillRect(0, shore + 0.5 * S + wash, W, Hh);
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

  // The car turns on the spot between the views: the rear narrows away, the side grows in.
  function drawCar(turn) {
    const S = carScale, bottom = carBottom, cx = W / 2 + shake;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(cx, bottom - S, (32 + 20 * turn) * S, 3 * S, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = false;
    if (turn < 0.5) {
      const sx = 1 - 2 * turn, w = 64 * S * sx;
      ctx.drawImage(CAR_FRAMES.rear[lean + 1][brake > 0.5 ? 1 : 0], cx - w / 2, bottom - 32 * S, w, 32 * S);
      if (brake > 0.05 && sx > 0.5) {
        ctx.globalCompositeOperation = "lighter";
        for (const lx of [13, 51]) {
          const x = cx - w / 2 + (lx + lean * 0.6) * S * sx, y = bottom - 15.5 * S;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 12 * S);
          glow.addColorStop(0, `rgba(255, 60, 80, ${0.55 * brake})`);
          glow.addColorStop(1, "rgba(255, 60, 80, 0)");
          ctx.fillStyle = glow;
          ctx.fillRect(x - 12 * S, y - 12 * S, 24 * S, 24 * S);
        }
      }
    } else {
      const sx = 2 * turn - 1, w = 104 * S * sx;
      ctx.drawImage(doorOpen ? CAR_FRAMES.open : CAR_FRAMES.closed, cx - w / 2, bottom - 36 * S, w, 36 * S);
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

    drawHeadlights(base, 1 - swing);

    // Sprites back to front, clipped by the hill crest in front of them. Nothing grows on the sand.
    for (let n = DRAW - 1; n > 0; n--) {
      const seg = segments[(base.index + n) % segments.length];
      if (seg.p1.camera.z <= DEPTH || seg.p1.world.z > sandZ) continue;
      const scale = seg.p1.screen.scale;
      for (const sprite of seg.sprites) {
        const sx = seg.p1.screen.x + scale * sprite.offset * ROAD_WIDTH * unitX;
        if (sprite.img.flicker && !reduce) ctx.globalAlpha = flicker(seg.index);
        drawSprite(sprite.img, sprite.offset, scale, sx, seg.p1.screen.y, seg.clip);
        ctx.globalAlpha = 1;
      }
    }

    if (!reduce) drawFireflies((k === 0 ? 1 : k === 1 ? 1 - t : 0) * (1 - Math.min(1, speed / 3000)) * (1 - swing));
    if (swing > 0) drawSideScene(swingBiome, Math.min(1, swing * 1.6));
    drawCar(swing);

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
  let dpr = 1, vw = 0, vh = 0, ceiling = 0, portrait = false;
  let playerZ = 1000;              // how far ahead of the camera the car is
  let carScale = 4, carBottom = 0; // device pixels per car pixel; where the wheels touch the road
  let measured = false;

  function resize() {
    if (agentView.checked) return; // nothing to measure; redone on switching back
    // Keep the car's place between two boards across the resize.
    const at = measured ? indexAt(position) : current;
    const aim = measured ? indexAt(target) : current;
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, vw < 700 ? 1.5 : 2);
    W = canvas.width = Math.round(vw * dpr);
    Hh = canvas.height = Math.round(vh * dpr);
    portrait = Hh > W;
    horizon = Math.round(Hh * (portrait ? 0.58 : 0.56));
    // Same scale on both axes in portrait, so phones get a wide road instead of a tall one.
    unitX = portrait ? W * 0.5 : W / 2;
    unitY = portrait ? unitX : Hh / 2;
    // The car: about a fifth of the width, smaller on short screens, parked just above the HUD.
    const short = vh < 520;
    const hudH = reduce ? 0 : hud.bar.offsetHeight;
    const carW = clamp(Math.min(vw * 0.22, vh * (short ? 0.3 : 0.4)), short ? 100 : 140, 420);
    carScale = (carW / 64) * dpr;
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
  let speed = 0, brake = 0, lean = 0;
  let current = 0;             // the board the HUD shows
  let parkedAt = -1;           // the board the address bar points at
  let intro = null, introSide = 0, doorOpen = false, shake = 0;
  let swing = 0, swingBiome = 0; // how far the camera has swung to the side view, and where
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
  function startIntro() { intro = { t0: performance.now() }; introSide = 1; doorOpen = true; }
  function stepIntro(now) {
    const t = (now - intro.t0) / 1000;
    doorOpen = t < 0.7;
    shake = t > 0.7 && t < 0.9 ? Math.sin(t * 80) * carScale * 0.5 : 0;
    introSide = t < 1.1 ? 1 : 1 - smootherstep(clamp((t - 1.1) / 1.3, 0, 1));
    if (t > 2.4) endIntro();
  }
  function endIntro() { intro = null; introSide = 0; doorOpen = false; shake = 0; }

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
    lean = speed > 1500 && Math.abs(curve) > 1 ? Math.sign(curve) : 0;
    if (speed < 30) speed = 0;
    hud.kmh.textContent = Math.min(KMH_MAX, Math.round(speed * KMH));

    const lastStop = boards[boards.length - 1].stopPos;
    const outro = smoothstep(lastStop - 0.6 * GAP * SEGMENT, lastStop, position);
    swing = Math.max(introSide, outro);
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
    for (const s of SPRITES.neon) s.draw(s.getContext("2d"), s.width, s.height);
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
