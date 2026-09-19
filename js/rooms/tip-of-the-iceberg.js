/**
 * Room 1 — Tip of the Iceberg
 * Pure audio-visual: dig → colder/darker/quieter ice; door unlocks with soft cold glow + tiny click.
 */
export const tipOfTheIceberg = {
  id: "tip-of-the-iceberg",
  title: "Tip of the Iceberg",

  /** Four digs to unlock — depth reads only as ice + vignette + muffled audio */
  maxLayers: 4,

  setup(ctx) {
    this._layer = 0;
    this._solved = false;
    this._ctx = ctx;

    ctx.setDepth(0);

    const ice = ctx.addEntity({
      id: "ice",
      x: 42,
      y: 60,
      className: "iceberg",
    });

    const mass = document.createElement("div");
    mass.className = "ice-mass";
    ice.appendChild(mass);

    const door = ctx.addEntity({
      id: "door",
      x: 78,
      y: 48,
      className: "door locked",
    });

    this._ice = ice;
    this._mass = mass;
    this._door = door;
  },

  onInteract(id, ctx) {
    if (id === "ice") {
      this._dig(ctx);
      return;
    }
    if (id === "door") {
      if (this._solved) {
        ctx.complete();
      } else {
        ctx.sfx.knock();
        this._door.classList.remove("ack");
        void this._door.offsetWidth;
        this._door.classList.add("ack");
      }
    }
  },

  isSolved() {
    return this._solved;
  },

  _dig(ctx) {
    const ice = this._ice;
    ice.classList.remove("digging");
    void ice.offsetWidth;
    ice.classList.add("digging");
    setTimeout(() => ice.classList.remove("digging"), 350);

    if (this._layer >= this.maxLayers) {
      // already fully dug — soft muffled tap only
      ctx.sfx.dig(this.maxLayers - 1);
      return;
    }

    const layerIndex = this._layer; // 0..3 for this dig
    this._layer += 1;

    ctx.sfx.dig(layerIndex);
    ctx.spawnFrost(ice);
    ctx.setDepth(this._layer);

    // Ice grows colder / larger / submerged mass expands
    const scale = 1 + this._layer * 0.22;
    ice.style.width = `${36 * scale}px`;
    ice.style.height = `${20 * scale}px`;
    const light = 78 - this._layer * 12;
    const mid = 68 - this._layer * 11;
    ice.style.background = `linear-gradient(180deg, hsl(200, 35%, ${light}%), hsl(205, 40%, ${mid}%))`;
    ice.style.boxShadow = `0 3px 10px rgba(60,75,95,0.12), 0 0 ${6 + this._layer * 4}px rgba(80,120,160,${0.1 + this._layer * 0.08})`;

    this._mass.style.height = `${12 + this._layer * 14}px`;
    this._mass.style.opacity = String(0.35 + this._layer * 0.15);

    if (this._layer >= this.maxLayers) {
      this._solved = true;
      this._door.classList.remove("locked");
      this._door.classList.add("unlocked");
      // tiny unlock click + soft cold glow (CSS), no green / no label
      setTimeout(() => ctx.sfx.unlock(), 280);
    }
  },
};
