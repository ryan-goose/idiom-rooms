# Idiom Rooms

A small philosophical-humor puzzle demo. Click to walk, click objects to interact, literalize the idiom, leave through the door.

**Demo:** Room 1 only — *Tip of the Iceberg*.

## Play

- **Live:** https://ryan-goose.github.io/idiom-rooms/
- **Local:**

```bash
cd idiom-rooms
python3 -m http.server 8080
```

Open http://localhost:8080

(Modules need a local server — opening `index.html` as a file may fail.)

## How to play (Room 1)

1. Click the floor to walk.
2. Click the ice tip to **dig** — each dig reveals a colder, half-true caption.
3. After the uncomfortable truth, the door unlocks.
4. Click the door to finish the demo.

## Project layout

```
index.html
css/style.css
js/game.js              # shared engine + Room API
js/rooms/
  tip-of-the-iceberg.js # Room 1
```

### Room API (for future rooms)

Each room exports an object:

| Field | Role |
|--------|------|
| `id` | slug |
| `title` | HUD title |
| `setup(ctx)` | spawn entities / overlays |
| `onInteract(id, ctx)` | handle clicks on entities |
| `isSolved()` | whether the door should open |

`ctx` helpers: `say(text)`, `addEntity(...)`, `addOverlay(id, html)`, `complete()`, `el(id)`.

## GitHub Pages

Pages should serve from the `main` branch **root** (`/`).

If the site is not live yet:

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/ (root)` → Save

Or via CLI (legacy build):

```bash
gh api -X POST repos/ryan-goose/idiom-rooms/pages \
  -f build_type=legacy \
  -f source[branch]=main \
  -f source[path]=/
```

## License

MIT — do what you want; attribution appreciated.
