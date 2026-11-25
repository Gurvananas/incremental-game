# Sylve

An incremental game about a forest: grow bare ground into old-growth woodland, balance a living
food web, then let it burn and grow back stronger.

Un jeu incrémental sur une forêt : faire pousser une friche jusqu'à la forêt ancienne, équilibrer
un réseau vivant, puis la laisser brûler pour renaître plus forte.

**Status:** foundation only (v0.0). Time, seasons, rain, saving and offline progress work; gameplay starts with v0.1.

## Develop

Requires Node 22+.

```bash
npm install
npm run dev      # play locally, with the debug panel
npm run check    # types, lint, format, tests, simulation, build
```

- Game design: [`docs/design.md`](docs/design.md)
- Decision log: [`docs/decisions.md`](docs/decisions.md)
- Working rules (for humans and AI assistants): [`CLAUDE.md`](CLAUDE.md)

URL options: `?lang=fr` for French, `?debug` to show the debug panel in production.
