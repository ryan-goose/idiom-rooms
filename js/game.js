/**
 * Idiom Rooms — shared engine (pure audio-visual)
 * Room API: { id, title, setup(ctx), onInteract(id, ctx), isSolved() }
 */
import { tipOfTheIceberg } from "./rooms/tip-of-the-iceberg.js";

const ROOMS = [tipOfTheIceberg];

const stage = document.getElementById("stage");
const player = document.getElementById("player");
const endScreen = document.getElementById("end-screen");
const replayBtn = document.getElementById("replay-btn");
const clickPulse = document.getElementById("click-pulse");

const SPAWN = { x: 22, y: 78 };

let current = null;
let ctx = null;
let pendingInteract = null;
let audioCtx = null;

/* —— Web Audio (no external files) —— */
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone({ freq = 220, type = "sine", dur = 0.12, gain = 0.08, delay = 0, slide = 0, filterFreq = 0 }) {
  const ac = ensureAudio();
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node = osc;
  if (filterFreq > 0) {
    const f = ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filterFreq;
    osc.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const sfx = {
  /** Soft target ack — click registered */
  tap() {
    tone({ freq: 520, type: "sine", dur: 0.06, gain: 0.04 });
  },
  /** Dig thud/crunch; muffles + lowers as layer deepens (0–3) */
  dig(layer = 0) {
    const muff = Math.max(180, 1400 - layer * 280);
    const g = 0.1 - layer * 0.015;
    tone({ freq: 90 - layer * 8, type: "triangle", dur: 0.1, gain: g, filterFreq: muff });
    tone({ freq: 180 - layer * 20, type: "square", dur: 0.05, gain: g * 0.35, delay: 0.02, filterFreq: muff });
    tone({ freq: 60, type: "sine", dur: 0.14, gain: g * 0.5, slide: -25, filterFreq: muff * 0.7 });
  },
  /** Tiny unlock click */
  unlock() {
    tone({ freq: 880, type: "sine", dur: 0.04, gain: 0.05 });
    tone({ freq: 1320, type: "sine", dur: 0.06, gain: 0.035, delay: 0.03 });
  },
  /** Soft door open */
  doorOpen() {
    tone({ freq: 220, type: "sine", dur: 0.18, gain: 0.05, slide: 80 });
    tone({ freq: 330, type: "triangle", dur: 0.12, gain: 0.03, delay: 0.05 });
  },
  /** Locked knock */
  knock() {
    tone({ freq: 140, type: "triangle", dur: 0.07, gain: 0.07, filterFreq: 600 });
    tone({ freq: 110, type: "sine", dur: 0.09, gain: 0.05, delay: 0.08, filterFreq: 500 });
  },
};

function clampWalk(xPct, yPct) {
  return {
    x: Math.max(8, Math.min(92, xPct)),
    y: Math.max(58, Math.min(92, yPct)),
  };
}

function movePlayerTo(xPct, yPct) {
  const p = clampWalk(xPct, yPct);
  player.style.left = `${p.x}%`;
  player.style.top = `${p.y}%`;
  return p;
}

function resetPlayerToSpawn() {
  player.style.transition = "none";
  player.style.left = `${SPAWN.x}%`;
  player.style.top = `${SPAWN.y}%`;
  // force reflow so next moves animate
  void player.offsetWidth;
  player.style.transition = "";
}

function near(a, b, dist = 16) {
  return Math.hypot(a.x - b.x, a.y - b.y) < dist;
}

function playerPos() {
  return {
    x: parseFloat(player.style.left) || SPAWN.x,
    y: parseFloat(player.style.top) || SPAWN.y,
  };
}

function showClickPulse(xPct, yPct) {
  clickPulse.classList.remove("flash");
  void clickPulse.offsetWidth;
  clickPulse.style.left = `${xPct}%`;
  clickPulse.style.top = `${yPct}%`;
  clickPulse.classList.add("flash");
}

function makeCtx(room) {
  return {
    stage,
    sfx,

    el(id) {
      return document.getElementById(id);
    },

    addEntity({ id, x, y, className }) {
      const el = document.createElement("div");
      el.id = `ent-${id}`;
      el.className = `entity ${className}`;
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.dataset.id = id;
      el.dataset.x = String(x);
      el.dataset.y = String(y);
      stage.appendChild(el);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        ensureAudio();

        const target = { x: +el.dataset.x, y: +el.dataset.y };
        // IMMEDIATE visual + soft audio feedback — click never feels dead
        showClickPulse(target.x, target.y);
        el.classList.remove("ack");
        void el.offsetWidth;
        el.classList.add("ack");
        sfx.tap();

        const pos = playerPos();
        const go = () => {
          pendingInteract = null;
          room.onInteract(id, ctx);
        };

        if (!near(pos, target)) {
          if (pendingInteract) clearTimeout(pendingInteract);
          movePlayerTo(target.x, Math.max(target.y + 10, 62));
          pendingInteract = setTimeout(go, 380);
        } else {
          go();
        }
      });

      return el;
    },

    addOverlay(id, html, className = id) {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement("div");
        el.id = id;
        el.className = className;
        stage.appendChild(el);
      }
      el.innerHTML = html;
      return el;
    },

    setDepth(n) {
      for (let i = 1; i <= 4; i++) stage.classList.remove(`depth-${i}`);
      if (n > 0) stage.classList.add(`depth-${Math.min(4, n)}`);
    },

    spawnFrost(atEl) {
      if (!atEl) return;
      const r = atEl.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      for (let i = 0; i < 3; i++) {
        const bit = document.createElement("div");
        bit.className = "frost-bit";
        const lx = ((r.left + r.width / 2 - sr.left) / sr.width) * 100 + (Math.random() - 0.5) * 4;
        const ly = ((r.top + r.height / 2 - sr.top) / sr.height) * 100 + Math.random() * 2;
        bit.style.left = `${lx}%`;
        bit.style.top = `${ly}%`;
        bit.style.setProperty("--dx", `${(Math.random() - 0.5) * 24}px`);
        bit.style.setProperty("--dy", `${12 + Math.random() * 20}px`);
        stage.appendChild(bit);
        setTimeout(() => bit.remove(), 1100);
      }
    },

    complete() {
      sfx.doorOpen();
      endScreen.classList.remove("hidden");
    },
  };
}

function clearStage() {
  if (pendingInteract) {
    clearTimeout(pendingInteract);
    pendingInteract = null;
  }
  stage.querySelectorAll(".entity, .frost-bit").forEach((n) => n.remove());
  for (let i = 1; i <= 4; i++) stage.classList.remove(`depth-${i}`);
  endScreen.classList.add("hidden");
}

function loadRoom(room) {
  clearStage();
  current = room;
  resetPlayerToSpawn();
  ctx = makeCtx(room);
  room.setup(ctx);
}

function dismissEndAndReplay() {
  if (endScreen.classList.contains("hidden")) return;
  loadRoom(current);
}

stage.addEventListener("click", (e) => {
  if (e.target.closest(".entity")) return;
  ensureAudio();
  const r = stage.getBoundingClientRect();
  const xPct = ((e.clientX - r.left) / r.width) * 100;
  const yPct = ((e.clientY - r.top) / r.height) * 100;
  showClickPulse(xPct, yPct);
  movePlayerTo(xPct, yPct);
});

replayBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  dismissEndAndReplay();
});

endScreen.addEventListener("click", (e) => {
  // click outside the glowing control (or anywhere on overlay) dismisses + resets
  if (e.target === replayBtn) return;
  dismissEndAndReplay();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") dismissEndAndReplay();
});

// unlock audio on first gesture
["pointerdown", "keydown"].forEach((ev) => {
  document.addEventListener(ev, () => ensureAudio(), { once: true, passive: true });
});

loadRoom(ROOMS[0]);
