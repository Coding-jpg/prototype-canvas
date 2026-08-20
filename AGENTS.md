# Prototype Component Contract

When creating or updating a prototype component, follow these rules:

1. Create or use a project directory at `components/<project-id>/` with `project.json` and `board.json` files.
2. Create one component directory at `components/<project-id>/<component-id>/`.
3. Put the complete interactive prototype in `components/<project-id>/<component-id>/index.html`.
4. Put its metadata in `components/<project-id>/<component-id>/meta.json`.
5. Use native HTML, CSS, and JavaScript. Do not add a framework or build step.
6. Keep all component assets inside the same component directory.
7. Do not modify unrelated components.
8. Run `node scripts/generate-components.mjs` before previewing locally.
9. Serve the repository over HTTP. Do not validate the component through `file://`.

Required `project.json` fields:

```json
{
  "id": "reelflock",
  "name": "ReelFlock",
  "description": "ReelFlock product prototypes."
}
```

The project `id` must match its directory name. Projects are repository-defined and cannot be created from the web interface.
Each project owns exactly one shareable canvas in `components/<project-id>/board.json`. Its `projectId` must match the project directory.

Required `meta.json` fields:

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

Set `published` to `true` only after the component has been deliberately placed on the shared board. Components without `published: true` remain in the repository but do not appear in the public component library.

Allowed `device` values: `desktop`, `tablet`, `mobile`.

Before committing:

- Verify the component has no console errors.
- Verify its primary interaction.
- Verify `node scripts/generate-components.mjs` succeeds.
