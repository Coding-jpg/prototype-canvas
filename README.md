# Prototype Canvas

A static infinite canvas for arranging interactive HTML prototypes, annotations, text, and arrows.

## Add a project or component

Projects and their components are defined by the repository directory structure. Create a project metadata file and place components below it:

```text
components/<project-id>/project.json
components/<project-id>/board.json
components/<project-id>/<component-id>/index.html
components/<project-id>/<component-id>/meta.json
```

Example project metadata:

```json
{
  "id": "reelflock",
  "name": "ReelFlock",
  "description": "ReelFlock product prototypes."
}
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
The web interface reads projects, their single shareable board, and their components from the repository. Projects cannot be created in the browser. Open a project with `?project=<project-id>`.

The component must be a complete native HTML document. See [AGENTS.md](./AGENTS.md) for the authoring contract.

## Preview locally

```bash
node scripts/generate-components.mjs
python3 -m http.server 8765
```

Open `http://127.0.0.1:8765`.

## Deploy

Push to `main`. GitHub Actions validates the project and component metadata, generates `component-library.json`, and deploys the site to GitHub Pages.

## Publish a project board

Each repository project owns one shareable board. Browser edits are saved locally for that project until the exported board is written back to the repository.

1. Arrange the board and remove frames that should not be shown.
2. Click **Share** and download the board JSON.
3. Save the export into the matching project directory:

```bash
node scripts/save-project-board.mjs reelflock ./reelflock-board.json
```

4. Run `node scripts/generate-components.mjs`, then commit and push. The project link is:

```text
https://coding-jpg.github.io/prototype-canvas/?project=reelflock
```

The project selector and component library are generated from repository directories. Add another project directory to make it available in the selector. Legacy `?board=` and `#board=` links remain readable.
