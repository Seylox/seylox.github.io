// BERND.md v4: the third view. Human and Agent work without this script; it adds the Arcade:
// loads arcade.css and arcade.js the first time the Arcade is chosen, drives the footer car
// off into it (with an old-TV switch-off), and keeps #arcade links and the back button working.
(() => {
  "use strict";

  const radios = {
    human: document.getElementById("view-human"),
    agent: document.getElementById("view-agent"),
    arcade: document.getElementById("view-arcade"),
  };
  const car = document.querySelector(".footer-car");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inArcade = () => radios.arcade.checked;
  const arcadeHash = () => window.location.hash.startsWith("#arcade");

  // ---- Loading the Arcade on first use ----
  let loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "arcade.css";
    document.head.append(css);
    // The script waits for the stylesheet, so its first measurements see the boards styled.
    css.addEventListener("load", () => {
      const js = document.createElement("script");
      js.src = "arcade.js";
      document.body.append(js);
    });
  }

  // Choose a view the way a click on its label would, so every listener hears about it.
  function show(view) {
    if (radios[view].checked) return;
    radios[view].checked = true;
    radios[view].dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ---- The address bar: #arcade (or #arcade-<board>) means the Arcade ----
  for (const [view, radio] of Object.entries(radios)) {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      if (view === "arcade") {
        load();
        if (!arcadeHash()) history.pushState(null, "", "#arcade");
      } else if (arcadeHash()) {
        history.pushState(null, "", window.location.pathname);
      }
    });
  }
  window.addEventListener("popstate", () => {
    if (arcadeHash() && !inArcade()) show("arcade");
    else if (!arcadeHash() && inArcade()) show("human");
  });
  if (arcadeHash()) {
    radios.arcade.checked = true;
    load();
  }

  // Esc leaves the Arcade.
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && inArcade() && !e.target.closest?.("details[open]")) show("human");
  });

  // ---- The old-TV switch: off to a line and a dot, then on again in the other view ----
  function crt(then) {
    if (reduce) { then(); return; }
    const screen = document.createElement("div");
    screen.className = "crt crt--off";
    screen.innerHTML = '<div class="crt__screen"></div>';
    document.body.append(screen);
    setTimeout(() => {
      then();
      window.scrollTo(0, 0);
      screen.className = "crt crt--on";
      setTimeout(() => screen.remove(), 600);
    }, 560);
  }

  // ---- The footer car: a rev, two puffs of smoke, off to the right, into the Arcade ----
  if (car) {
    car.addEventListener("click", () => {
      if (car.classList.contains("is-leaving")) return;
      load();
      if (reduce) { show("arcade"); return; }
      car.classList.add("is-leaving");
      setTimeout(() => crt(() => {
        show("arcade");
        car.classList.remove("is-leaving");
      }), 1300);
    });
  }
})();
