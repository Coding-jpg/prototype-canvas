# Prototype Canvas

A static infinite canvas for arranging interactive HTML prototypes, annotations, text, and arrows.

## Add a component

Create these two files:

```text
components/<component-id>/index.html
components/<component-id>/meta.json
```

Example metadata:

```json
{
  "id": "refund-confirm",
  "name": "Refund confirmation",
  "published": false,
  "device": "mobile",
  "category": "Refund flow",
  "description": "Confirm a refund and show pending and success states."
}
```

Components are private to the repository by default. Set `published` to `true` only when the component should appear in the shared component library and be available for placement on the public board.

The component must be a complete native HTML document. See [AGENTS.md](./AGENTS.md) for the authoring contract.

## Preview locally

```bash
node scripts/generate-components.mjs
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765`.

## Deploy

Push to `main`. GitHub Actions validates the component metadata, generates `components.json`, and deploys the site to GitHub Pages.

## Named boards

The base page keeps each visitor's working board in browser storage. Use a named board when a curated subset needs a stable public link.

1. Arrange the board and remove frames that should not be shown.
2. Click **Share** and download the project JSON.
3. Send the JSON to Codex and ask it to publish the board. Codex saves it into the repository with:

```bash
node scripts/save-board.mjs task-review ./task-review.json 'Task review'
```

4. Commit and push. The stable link is:

```text
https://coding-jpg.github.io/prototype-canvas/?board=task-review
```

After deployment, the **Share** dialog exposes the stable link for copying. Named-board edits in the browser are temporary; download a new JSON through the same workflow when the shared layout changes. Legacy `#board=` links remain readable.
