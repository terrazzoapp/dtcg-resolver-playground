import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ZodError } from "zod/v4";
import Nav from "./components/nav.js";
import { createResolver } from "./lib/create-resolver";
import type { Modifier, Preset, Resolver, ResolverImpl } from "./lib/types";
import "./styles/global.css";
import Files from "./components/files";
import ResolverResult from "./components/resolver-result";
import { prettyJSON } from "./lib/utils";
import s from "./main.module.css";

function getModifiers(unparsedJson: string): (Modifier & { name: string })[] {
  return Object.entries(
    (JSON.parse(unparsedJson) as Resolver).modifiers ?? {},
  ).map(([k, v]) => ({ ...v, name: k }));
}

// lazy-loaded design systems
const DESIGN_SYSTEM = {
  "figma-sds": () => import("./lib/examples/figma-sds.js"),
  "github-primer": () => import("./lib/examples/github-primer.js"),
};

/**
 * Note: Monaco should ALWAYS be lazy-loaded in a separate chunk because
 * it’s very heavy, and shouldn’t block first paint. However, since this
 * is a playground app, and Monaco is all there is, we load it in the
 * critical bundle because a loading screen is worse.
 *
 * We do, however, load the design systems themselves all lazily, because
 * thoe will add up quickly as more are added.
 */
function App() {
  const [preset, setPreset] = useState<Preset>("github-primer");
  const [files, setFiles] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [defaultInput, setDefaultInput] = useState<Record<string, string>>({});
  const [input, setInput] = useState<Record<string, string>>({});
  const resolver = useMemo<ResolverImpl<Record<string, any>>>(
    () =>
      // loading hack: fall back to placeholder during initial load
      Object.keys(files).length
        ? resolverFromFiles(files)
        : {
            getSet: () => ({ sources: [] }),
            getModifier: () => ({ contexts: {} }),
            apply: () => ({}),
          },
    [files],
  );
  const modifiers = useMemo(
    () =>
      // loading hack: fall back to placeholder during initial load
      files["resolver.json"] ? getModifiers(files["resolver.json"]) : [],
    [JSON.stringify(files["resolver.json"])],
  );

  useEffect(() => {
    const emptyFiles: Record<string, string> = {};
    setFiles(emptyFiles); // needed to refresh Monaco
    (async () => {
      if (!(preset in DESIGN_SYSTEM)) {
        throw new Error(`Unknown system ${preset}`);
      }
      // reset files
      const mod = await DESIGN_SYSTEM[preset]();
      const formatted: Record<string, string> = {};
      for (const [k, v] of Object.entries(mod.default)) {
        formatted[k] = prettyJSON(JSON.parse(v));
      }
      setFiles(formatted);

      // reset modifier values
      const nextInput: Record<string, string> = {};
      for (const [k, v] of Object.entries(
        JSON.parse(mod.default["resolver.json"]).modifiers,
      )) {
        nextInput[k] = Object.keys((v as Modifier).contexts)[0];
      }
      setDefaultInput(nextInput);
      setInput(nextInput);
    })();
  }, [preset]);

  if (!Object.keys(files).length) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: not the same
      <div role="status" className={s.loading}>
        Loading
      </div>
    );
  }

  return (
    <div className={s.app}>
      <div className={s.nav}>
        <Nav preset={preset} onPresetChange={setPreset} />
      </div>
      <div className={s.files}>
        <Files
          preset={preset}
          files={files}
          errors={errors}
          setErrors={setErrors}
          onChange={(filename, contents) => {
            try {
              setErrors((value) => ({ ...value, [filename]: undefined }));
              const tryResolver = resolverFromFiles({
                ...files,
                [filename]: JSON.parse(contents),
              });
              tryResolver.apply(input); // TODO: improve resolver to be able to throw errors earlier
              setFiles((value) => ({ ...value, [filename]: contents }));
            } catch (err) {
              const message =
                err instanceof ZodError &&
                Array.isArray(JSON.parse(err.message))
                  ? JSON.parse(err.message)
                      .map((e) => e.message)
                      .join("\n")
                  : String(err);
              setErrors((value) => ({ ...value, [filename]: message }));
            }
          }}
        />
      </div>
      <div className={s.resolverResult}>
        <ResolverResult
          resolver={resolver}
          modifiers={modifiers}
          defaultInput={defaultInput}
          input={input}
          setInput={setInput}
        />
      </div>
    </div>
  );
}

function resolverFromFiles<T extends Record<string, any>>(
  files: Record<string, string>,
): ResolverImpl<T> {
  const tokenMap: Record<string, any> = {};
  let resolver = {} as Resolver;
  for (const [k, v] of Object.entries(files)) {
    if (k === "resolver.json") {
      resolver = JSON.parse(v);
    } else {
      tokenMap[k] = JSON.parse(v);
    }
  }
  return createResolver(tokenMap, resolver);
}

const root = createRoot(document.getElementById("app")!);
root.render(<App />);
