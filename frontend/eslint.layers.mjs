// RexSoft frontend — the layer dependency rules from docs/architecture.md, enforced.
//
// Imports flow from higher layers to lower; a lower layer must not know about a higher one.
// Spread this into the project's eslint.config.mjs:
//
//   import layers from "./eslint.layers.mjs";
//   export default [ ...nextCoreWebVitals, ...nextTypeScript, ...layers ];
//
// The table this encodes lives in docs/architecture.md — change them together.
import importPlugin from "eslint-plugin-import";

const SEE = 'see docs/architecture.md, "Layer dependency rules"';
const only = (layer, allowed) => `${layer}/ may import from ${allowed} only — ${SEE}.`;
const bottom = (layer, why) => `${layer}/ sits at the bottom: ${why} — ${SEE}.`;

export default [
  {
    files: ["src/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    plugins: { import: importPlugin },
    settings: {
      // Without a TypeScript-aware resolver the rule cannot resolve "../view/w" to a file and
      // silently passes — a lint that is always green. eslint-import-resolver-typescript is a
      // required dev dependency; see the README.
      "import/resolver": { typescript: true, node: true },
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "src/shared",
              from: ["src/app", "src/view", "src/providers", "src/data", "src/entities"],
              message: bottom("shared", "it must not import any application layer"),
            },
            {
              target: "src/entities",
              from: ["src/app", "src/view", "src/providers", "src/data", "src/shared"],
              message: bottom("entities", "it stays framework-free — no React, Next.js, API clients or UI"),
            },
            {
              target: "src/data",
              from: ["src/app", "src/view", "src/providers"],
              message: only("data", "entities/ and shared/"),
            },
            {
              target: "src/providers",
              from: ["src/app", "src/view"],
              message: only("providers", "data/ and shared/"),
            },
            {
              target: "src/view",
              from: ["src/app"],
              message: only("view", "data/, entities/ and shared/"),
            },
            // src/app may import every layer — no zone.
          ],
        },
      ],
    },
  },
];
