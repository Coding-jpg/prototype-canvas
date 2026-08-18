# Named boards

Each `<slug>.json` file stores one curated canvas. Create or replace a board with:

```bash
node scripts/save-board.mjs <slug> <exported-json> '<display title>'
```

Slugs use lowercase letters, numbers, and hyphens. After deployment, open `?board=<slug>`.
