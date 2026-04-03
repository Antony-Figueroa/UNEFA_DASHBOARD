import { createRequire as B } from "node:module";
import x from "@rollup/plugin-inject";
import j from "node-stdlib-browser";
import { handleCircularDependancyWarning as O } from "node-stdlib-browser/helpers/rollup/plugin";
import T from "node-stdlib-browser/helpers/esbuild/plugin";
const v = (s, l) => d(s) === d(l), e = (s, l) => s ? s === !0 ? !0 : s === l : !1, w = (s) => s.startsWith("node:"), $ = (s) => {
  const l = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${l}$`);
}, d = (s) => s.replace(/^node:/, ""), g = {
  buffer: [
    "import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'",
    "globalThis.Buffer = globalThis.Buffer || __buffer_polyfill"
  ],
  global: [
    "import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'",
    "globalThis.global = globalThis.global || __global_polyfill"
  ],
  process: [
    "import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'",
    "globalThis.process = globalThis.process || __process_polyfill"
  ]
}, D = (s = {}) => {
  const l = {
    include: [],
    exclude: [],
    overrides: {},
    protocolImports: !0,
    ...s,
    globals: {
      Buffer: !0,
      global: !0,
      process: !0,
      ...s.globals
    }
  }, h = (o) => l.include.length > 0 ? !l.include.some((r) => v(o, r)) : l.exclude.some((r) => v(o, r)), y = (o) => {
    if (e(l.globals.Buffer, "dev") && /^buffer$/.test(o))
      return "vite-plugin-node-polyfills/shims/buffer";
    if (e(l.globals.global, "dev") && /^global$/.test(o))
      return "vite-plugin-node-polyfills/shims/global";
    if (e(l.globals.process, "dev") && /^process$/.test(o))
      return "vite-plugin-node-polyfills/shims/process";
    if (o in l.overrides)
      return l.overrides[o];
  }, p = Object.entries(j).reduce((o, [r, i]) => (!l.protocolImports && w(r) || h(r) || (o[r] = y(d(r)) || i), o), {}), f = B(import.meta.url), u = [
    ...e(l.globals.Buffer, "dev") ? [f.resolve("vite-plugin-node-polyfills/shims/buffer")] : [],
    ...e(l.globals.global, "dev") ? [f.resolve("vite-plugin-node-polyfills/shims/global")] : [],
    ...e(l.globals.process, "dev") ? [f.resolve("vite-plugin-node-polyfills/shims/process")] : []
  ], a = [
    ...e(l.globals.Buffer, "dev") ? g.buffer : [],
    ...e(l.globals.global, "dev") ? g.global : [],
    ...e(l.globals.process, "dev") ? g.process : [],
    ""
  ].join(`
`);
  return {
    name: "vite-plugin-node-polyfills",
    config(o, r) {
      const i = r.command === "serve", c = !!this?.meta?.rolldownVersion, m = {
        ...i && e(l.globals.Buffer, "dev") ? { Buffer: "Buffer" } : {},
        ...i && e(l.globals.global, "dev") ? { global: "global" } : {},
        ...i && e(l.globals.process, "dev") ? { process: "process" } : {}
      }, b = {
        // https://github.com/niksy/node-stdlib-browser/blob/3e7cd7f3d115ac5c4593b550e7d8c4a82a0d4ac4/README.md#vite
        ...e(l.globals.Buffer, "build") ? { Buffer: "vite-plugin-node-polyfills/shims/buffer" } : {},
        ...e(l.globals.global, "build") ? { global: "vite-plugin-node-polyfills/shims/global" } : {},
        ...e(l.globals.process, "build") ? { process: "vite-plugin-node-polyfills/shims/process" } : {}
      };
      return {
        build: {
          rollupOptions: {
            onwarn: (t, n) => {
              O(t, () => {
                if (o.build?.rollupOptions?.onwarn)
                  return o.build.rollupOptions.onwarn(t, n);
                n(t);
              });
            },
            ...Object.keys(b).length > 0 ? c ? { transform: { inject: b } } : { plugins: [x(b)] } : {}
          }
        },
        esbuild: {
          // In dev, the global polyfills need to be injected as a banner in order for isolated scripts (such as Vue SFCs) to have access to them.
          banner: i ? a : void 0
        },
        optimizeDeps: {
          exclude: [
            ...u
          ],
          ...c ? {
            rolldownOptions: {
              resolve: {
                // https://github.com/niksy/node-stdlib-browser/blob/3e7cd7f3d115ac5c4593b550e7d8c4a82a0d4ac4/README.md?plain=1#L150
                alias: {
                  ...p
                }
              },
              transform: {
                define: m
              },
              plugins: [
                {
                  name: "vite-plugin-node-polyfills:optimizer",
                  banner: i ? a : void 0
                }
              ]
            }
          } : {
            esbuildOptions: {
              banner: i ? { js: a } : void 0,
              define: m,
              inject: [
                ...u
              ],
              plugins: [
                T(p),
                // Supress the 'injected path "..." cannot be marked as external' error in Vite 4 (emitted by esbuild).
                // https://github.com/evanw/esbuild/blob/edede3c49ad6adddc6ea5b3c78c6ea7507e03020/internal/bundler/bundler.go#L1469
                {
                  name: "vite-plugin-node-polyfills-shims-resolver",
                  setup(t) {
                    for (const n of u) {
                      const _ = $(n);
                      t.onResolve({ filter: _ }, () => ({
                        // https://github.com/evanw/esbuild/blob/edede3c49ad6adddc6ea5b3c78c6ea7507e03020/internal/bundler/bundler.go#L1468
                        external: !1,
                        path: n
                      }));
                    }
                  }
                }
              ]
            }
          }
        },
        resolve: {
          // https://github.com/niksy/node-stdlib-browser/blob/3e7cd7f3d115ac5c4593b550e7d8c4a82a0d4ac4/README.md?plain=1#L150
          alias: {
            ...p
          }
        }
      };
    }
  };
};
export {
  D as nodePolyfills
};
//# sourceMappingURL=index.js.map
