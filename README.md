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
  "device": "mobile",
  "category": "Refund flow",
  "description": "Confirm a refund and show pending and success states."
}
```

The component must be a complete native HTML document. See [AGENTS.md](./AGENTS.md) for the authoring contract.

## Preview locally

```bash
node scripts/generate-components.mjs
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765`.

## Deploy

Push to `main`. GitHub Actions validates the component metadata, generates `components.json`, and deploys the site to GitHub Pages.

