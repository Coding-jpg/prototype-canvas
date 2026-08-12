# Prototype Component Contract

When creating or updating a prototype component, follow these rules:

1. Create one directory at `components/<component-id>/`.
2. Put the complete interactive prototype in `components/<component-id>/index.html`.
3. Put its metadata in `components/<component-id>/meta.json`.
4. Use native HTML, CSS, and JavaScript. Do not add a framework or build step.
5. Keep all component assets inside the same component directory.
6. Do not modify unrelated components.
7. Run `node scripts/generate-components.mjs` before previewing locally.
8. Serve the repository over HTTP. Do not validate the component through `file://`.

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
