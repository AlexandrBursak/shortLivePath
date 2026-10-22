// RexSoft backend — the layer flow from docs/architecture.md, enforced.
//
//   Controller  →  Service  →  Lucid Model
//
// Spread this into the project's eslint.config.mjs:
//
//   import layers from "./eslint.layers.mjs";
//   export default [ ...yourBaseConfig, ...layers ];
//
// The rules this encodes live in docs/architecture.md — change them together.
import importPlugin from "eslint-plugin-import";

const SEE = 'see docs/architecture.md, "Layer flow — the invariant"';

export default [
  {
    files: ["app/**/*.{ts,js}"],
    plugins: { import: importPlugin },
    settings: {
      // Without a TypeScript-aware resolver the rule cannot resolve a relative import to a
      // file and silently passes — a lint that is always green.
      "import/resolver": { typescript: true, node: true },
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "app/controllers",
              from: ["app/models"],
              message: `A controller must not reach a Lucid model directly — go through a service (${SEE}).`,
            },
            {
              target: "app/models",
              from: ["app/services", "app/controllers", "app/middleware"],
              message: `A model defines relationships, scopes and serialization — it must not orchestrate (${SEE}).`,
            },
          ],
        },
      ],
      // Controllers hold no persistence, cache or HTTP-client concerns of their own.
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["app/controllers/**/*.{ts,js}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@adonisjs/lucid", message: `Database access belongs in a service, not a controller (${SEE}).` },
            { name: "@adonisjs/lucid/services/db", message: `Database access belongs in a service, not a controller (${SEE}).` },
            { name: "@adonisjs/redis", message: `Redis access belongs in a service, not a controller (${SEE}).` },
            { name: "@adonisjs/redis/services/main", message: `Redis access belongs in a service, not a controller (${SEE}).` },
            { name: "axios", message: `External calls belong in a service, not a controller (${SEE}).` },
          ],
        },
      ],
    },
  },
];
