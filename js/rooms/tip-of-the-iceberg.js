/**
 * Room 1 — Tip of the Iceberg
 * Dig through half-true layers until an uncomfortable-but-funny truth unlocks the door.
 */
export const tipOfTheIceberg = {
  id: "tip-of-the-iceberg",
  title: "Tip of the Iceberg",

  layers: [
    {
      depth: "Surface",
      caption: "Everything is fine. Look how shiny and small this problem is.",
      narrator: "Ah yes. The reassuring bit that fits on a postcard.",
    },
    {
      depth: "Slightly colder",
      caption: "Okay, there might be a little more under here. Still manageable. Probably.",
      narrator: "You are digging. I am narrating. Neither of us is qualified.",
    },
    {
      depth: "Noticeably wet",
      caption: "The tip was marketing. The rest is logistics, feelings, and that email you haven't answered.",
      narrator: "Fascinating. The ice appears to contain unresolved threads.",
    },
    {
      depth: "Uncomfortable truth",
      caption: "Most of what you call 'the tip' is you standing on a submerged warehouse of things you hoped were optional.",
      narrator: "There it is. Awkward. Accurate. Door-shaped, somehow.",
    },
  ],

  setup(ctx) {
    this._layer = 0;
    this._solved = false;

    ctx.say(
      "A tiny tip of ice. A locked door. Metaphorically speaking, you are already wet."
    );

    const ice = ctx.addEntity({
      id: "ice",
      x: 38,
      y: 62,
      className: "iceberg",
      label: "ice tip",
      title: "Tip of the iceberg — click to dig",
    });

    const door = ctx.addEntity({
      id: "door",
      x: 78,
      y: 48,
      className: "door locked",
      label: "door",
      title: "Locked. Obviously.",
    });

    ctx.addOverlay("layer-panel", `
      <div class="depth"></div>
      <div class="caption"></div>
    `);

    ctx.addOverlay("depth-meter", `<div class="fill"></div>`);

    this._ice = ice;
    this._door = door;
  },

  onInteract(id, ctx) {
    if (id === "ice") {
      this._dig(ctx);
      return;
    }
    if (id === "door") {
      if (this._solved) {
        ctx.say("The door yields. You may leave. Or stay. Leaving is the point.");
        ctx.complete();
      } else {
        const quips = [
          "Locked. The ice knows something you don't. Dig.",
          "Doors open for truths, not vibes.",
          "It remains shut. Rude, but thematic.",
        ];
        ctx.say(quips[Math.min(this._layer, quips.length - 1)]);
      }
    }
  },

  isSolved() {
    return this._solved;
  },

  _dig(ctx) {
    const ice = this._ice;
    ice.classList.add("digging");
    setTimeout(() => ice.classList.remove("digging"), 400);

    if (this._layer >= this.layers.length) {
      ctx.say("You've excavated the metaphor. The door is waiting. Try not to look proud.");
      return;
    }

    const layer = this.layers[this._layer];
    this._layer += 1;

    const panel = ctx.el("layer-panel");
    panel.querySelector(".depth").textContent = layer.depth;
    panel.querySelector(".caption").textContent = layer.caption;
    panel.classList.add("visible");

    const fill = ctx.el("depth-meter").querySelector(".fill");
    fill.style.height = `${(this._layer / this.layers.length) * 100}%`;

    // Ice grows colder / larger as you dig
    const scale = 1 + this._layer * 0.15;
    ice.style.width = `${48 * scale}px`;
    ice.style.height = `${28 * scale}px`;
    ice.style.background = `linear-gradient(180deg, #eef6fb, hsl(200, 45%, ${72 - this._layer * 10}%))`;

    ctx.say(layer.narrator);

    if (this._layer >= this.layers.length) {
      this._solved = true;
      this._door.classList.remove("locked");
      this._door.classList.add("unlocked");
      this._door.title = "Unlocked — walk over and click";
      this._door.querySelector(".label").textContent = "door (open)";
      setTimeout(() => {
        ctx.say("The door softens. You've found enough of the iceberg. Go on.");
      }, 900);
    }
  },
};
