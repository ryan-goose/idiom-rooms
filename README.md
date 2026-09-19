# Idiom Rooms

Tiny audio-visual idiom rooms. Click to walk, click things to interact. No on-screen text — meaning comes from image, color, scale, and sound.

**Demo:** Room 1 — Tip of the Iceberg.

## Play

- **Live:** https://ryan-goose.github.io/idiom-rooms/
- **Local:**

```bash
cd idiom-rooms
python3 -m http.server 8080
```

Open http://localhost:8080

(Modules need a local server.)

## Room 1 loop

1. Click the pale void floor to walk.
2. Click the ice tip to dig — each dig grows colder, darker, quieter.
3. After four digs the door takes a soft cold glow.
4. Click the door to finish. Replay via the glowing control, Esc, or click outside.

## Layout

```
index.html
css/style.css
js/game.js              # shared engine + Room API + Web Audio
js/rooms/
  tip-of-the-iceberg.js # Room 1
```

### Room API

| Field | Role |
|--------|------|
| `id` | slug |
| `title` | metadata only (not shown in-game) |
| `setup(ctx)` | spawn entities |
| `onInteract(id, ctx)` | handle entity clicks |
| `isSolved()` | unlock state |

`ctx`: `addEntity`, `addOverlay`, `setDepth`, `spawnFrost`, `sfx`, `complete`, `el`, `stage`.

## GitHub Pages

Serves from `main` branch root (`/`).

## License

MIT
