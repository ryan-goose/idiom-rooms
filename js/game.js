/**
 * Idiom Rooms — shared engine
 * Room API: { id, title, setup(ctx), onInteract(id, ctx), isSolved() }
 */
import { tipOfTheIceberg } from "./rooms/tip-of-the-iceberg.js";

const ROOMS = [tipOfTheIceberg];

const stage = document.getElementById("stage");
const player = document.getElementById("player");
const narratorText = document.getElementById("narrator-text");
const roomTitle = document.getElementById("room-title");
const endScreen = document.getElementById("end-screen");
const replayBtn = document.getElementById("replay-btn");

let current = null;

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

function near(a, b, dist = 16) {
  return Math.hypot(a.x - b.x, a.y - b.y) < dist;
}

function playerPos() {
  return {
    x: parseFloat(player.style.left) || 50,
    y: parseFloat(player.style.top) || 70,
  };
}

function makeCtx(room) {
  return {
    say(text) {
      narratorText.textContent = text;
    },

    el(id) {
      return document.getElementById(id);
    },

    addEntity({ id, x, y, className, label, title }) {
      const el = document.createElement("div");
      el.id = `ent-${id}`;
      el.className = `entity ${className}`;
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.title = title || label || id;
      el.dataset.id = id;
      el.dataset.x = String(x);
      el.dataset.y = String(y);

      const lab = document.createElement("span");
      lab.className = "label";
      lab.textContent = label || id;
      el.appendChild(lab);

      stage.appendChild(el);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const target = { x: +el.dataset.x, y: +el.dataset.y };
        const pos = playerPos();
        const go = () => room.onInteract(id, ctx);

        if (!near(pos, target)) {
          movePlayerTo(target.x, Math.max(target.y + 10, 62));
          setTimeout(go, 380);
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

    complete() {
      endScreen.classList.remove("hidden");
    },
  };
}

let ctx = null;

function clearStage() {
  stage.querySelectorAll(".entity, #layer-panel, #depth-meter").forEach((n) => n.remove());
  endScreen.classList.add("hidden");
}

function loadRoom(room) {
  clearStage();
  current = room;
  roomTitle.textContent = room.title;
  player.style.left = "22%";
  player.style.top = "78%";
  ctx = makeCtx(room);
  room.setup(ctx);
}

stage.addEventListener("click", (e) => {
  if (e.target.closest(".entity")) return;
  const r = stage.getBoundingClientRect();
  const xPct = ((e.clientX - r.left) / r.width) * 100;
  const yPct = ((e.clientY - r.top) / r.height) * 100;
  movePlayerTo(xPct, yPct);
});

replayBtn.addEventListener("click", () => loadRoom(current));

loadRoom(ROOMS[0]);
