# BigO-Gym

Predict-then-reveal practice for recognizing time-complexity risk patterns in
realistic frontend code. A code sample appears; before anything is revealed you
predict its time complexity and the pattern responsible. The reveal then shows
the actual complexity, the catalogue pattern name, and a short explanation.
Results are grouped by pattern — not one aggregate score — so the patterns you
are still learning to recognize stay visible.

Companion to the `schalk-complexity-radar` skill, whose catalogue (SKILL.md)
is the single source of truth for the eight pattern names used throughout. The
skill and the code call these "shapes"; the UI presents them as "patterns" —
the same catalogue either way. `src/catalogue.ts` mirrors those names verbatim;
if the catalogue changes, update the app to follow it, never the other way
around.

A one-page **refresher** (`refresher.html`) covers the eight patterns. It opens
with a Big-O primer (each class named and anchored at scale) and a "look for
loops" tip, then shows one card per pattern. Each card pairs the catalogue's
giveaway and fix with an interactive demo: the pattern and its fix side by side,
an input-size slider, a "Run code" button that counts a real unit of work for
each, and a "Highlight problem code" toggle. Cards render straight from
`src/catalogue.ts` and the runnable examples in `src/content/runnable.ts` (via
`src/components/gym-refresher.ts`), so they can never drift from what the gym
grades against. The reveal panel and the stats table deep-link into it
(`refresher.html#<id>`). Those runnable examples are deliberately separate from
the gym's snippet bank — reusing gym snippets there would let visitors recognize
labeled snippets instead of reading fresh code (a test guards this).

## Stack

- [Vite](https://vite.dev) + TypeScript, fully static — no server, no database
- [Lit](https://lit.dev) for the two stateful pieces (`<bigo-gym-card>`,
  `<bigo-gym-stats>`); the page shell is plain HTML/CSS
- [highlight.js](https://highlightjs.org) for syntax highlighting
- `localStorage` for per-visitor attempt history — nothing is shared across
  visitors, by design
- Vitest for unit tests, Playwright for the end-to-end flow
- HTML validation in two layers: `html-validate` over the static source files,
  and `@axe-core/playwright` over the rendered DOM — see `HTML validation`
- pnpm as the package manager; tooling (oxlint, oxfmt, stylelint) is managed
  by [Calavera](https://calavera.schalkneethling.com/) — see `Tooling` below

## Scripts

```sh
pnpm dev          # local dev server
pnpm build        # typecheck + production build into dist/
pnpm preview      # serve the production build
pnpm test         # unit tests (grading, stats, storage, selection, content)
pnpm test:e2e     # Playwright end-to-end flow (builds + previews itself)
pnpm lint         # oxlint + stylelint
pnpm lint:html    # html-validate on the static .html source
pnpm format       # oxfmt --write
pnpm typecheck    # tsc --noEmit
pnpm quality      # typecheck + lint + lint:html + format:check (the full gate)
```

## HTML validation

Two layers, because roughly half the markup is emitted by the Lit components at
runtime and never appears in a source file:

- **Static** — `html-validate` (config in `.htmlvalidate.json`) checks the
  `index.html` / `refresher.html` source via `pnpm lint:html`, folded into
  `quality`. It runs on honest HTML5 defaults, with one rule off: `require-sri`
  — the Google Fonts stylesheet can't carry a stable SRI hash (the served CSS
  varies by user-agent) and the local entry script is hashed by Vite at build.
- **Formatter boundary** — oxfmt is excluded from HTML (`.oxfmtrc.json`
  `ignorePatterns`). oxfmt hardcodes a lowercase doctype and self-closing void
  elements (`<meta … />`) with no option to change either, and the self-closing
  slash on a void element is misleading — HTML has no self-closing syntax, the
  `/` is ignored. Rather than bend the validator to that, html-validate owns
  HTML correctness and the two files keep the honest form (`<!DOCTYPE html>`,
  `<meta …>`). The durable fix is an upstream oxfmt change (tracked separately).
- **Rendered** — `@axe-core/playwright` audits the real component-rendered DOM
  in `e2e/a11y.spec.ts` at the states that matter (predict, reveal, and the
  refresher page), scoped to WCAG 2.0/2.1 A and AA. This is where the native
  controls, label associations, table semantics, and `aria-live` reveal are
  actually verified; it runs as part of `pnpm test:e2e`.

## Tooling

Lint/format config is composed by Calavera from `calavera.config.json` and
written into `.editorconfig`, `oxlint.json`, and `.stylelintrc.json`, which it
owns — re-apply with `pnpm dlx create-project-calavera apply`. Notes:

- The config deliberately omits two integrations the composer's schema offers.
  `typescript` is left out because this project keeps a hand-written
  `tsconfig.json` (Lit needs `experimentalDecorators`), which Calavera would
  otherwise refuse to overwrite; typechecking is handled by the standalone
  `typecheck` script instead. `stylelint-logical-css` is left out because the
  released CLI (v2.2.0) has no catalog entry for it yet (see below).
- `quality` is Calavera-managed but has been extended here with `typecheck` and
  `lint:html` (neither has a Calavera integration). A `calavera apply`/`update`
  regenerates `quality` as `lint && format:check`, dropping both — re-add the
  `typecheck &&` and `lint:html &&` steps after re-applying. (`pnpm build` also
  runs `tsc`, so typechecking is covered in the build path regardless.)
- Intentional modern-CSS deviations (the provided typescale's `@function`,
  `@property`, `:has()`, and highlight.js's token class names) are handled with
  scoped `stylelint-disable` comments at each site rather than by editing
  Calavera's config, so `calavera update` won't clobber them.

## Adding snippets

Append an entry to `src/content/snippets.ts` — no markup or component changes
needed. Keep `shapeId` and `complexity` drawn from `src/catalogue.ts`, and
write the explanation the way the catalogue phrases things: name the shape,
trace the concrete cost, state the fix. `npm test` enforces content integrity
(unique ids, valid shape/complexity values, ≥3 snippets per shape).

Adding a few fresh snippets per shape periodically is real maintenance, not a
nice-to-have: the predict-before-reveal mechanic only works while a repeat
visitor is genuinely reading the snippet rather than recognizing it.

## Deploying

Static output in `dist/`; `netlify.toml` is set up for Netlify
(`pnpm build`, publish `dist`), intended for a subdomain of
schalkneethling.com such as `bigogym.schalkneethling.com`.
