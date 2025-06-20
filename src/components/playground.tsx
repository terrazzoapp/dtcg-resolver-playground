import { type ReactNode, useMemo, useState } from 'react';
import { createResolver } from '../lib/create-resolver.js';
import figmaSds from '../lib/examples/figma-sds.js';
import type { Modifier, Resolver } from '../lib/types.js';
import { prettyJSON } from '../lib/utils.js';
import CodeEditor from './code-editor.js';
import s from './playground.module.css';
import { Select } from './select.js';

export default function Playground() {
  const [files] = useState<Record<string, string>>({ ...figmaSds });
  const [errors, setErrors] = useState<Record<string, ReactNode | undefined>>(
    {},
  );
  const [currentTab, setCurrentTab] = useState(Object.keys(files)[0]);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      JSON.parse(files['resolver.json'] ?? '{}').modifiers?.map(
        (mod: Modifier) => [mod.name, mod.values?.[0]?.name],
      ) ?? [],
    ),
  );
  const [parsedTokens, setParsedTokens] = useState<
    Record<string, Record<string, any>>
  >(() =>
    Object.fromEntries(
      Object.entries(files)
        .map(([filename, contents]) => {
          if (filename === 'resolver.json') {
            return;
          }
          return [filename, JSON.parse(contents)];
        })
        .filter(Boolean) as [string, any],
    ),
  );
  const [parsedResolver, setParsedResolver] = useState<Resolver>(
    JSON.parse(files['resolver.json']),
  );
  const r = useMemo(
    () => createResolver(parsedTokens, parsedResolver),
    [parsedTokens, parsedResolver],
  );

  return (
    <>
      <div className={s.example}>
        <Select
          options={[
            { label: <>Figma Simple Design System</>, value: 'figma-sds.json' },
          ]}
        >
          Preset
        </Select>
      </div>

      <ul role="tablist" className={s.tablist}>
        {Object.keys(files).map((filename) => (
          <li key={filename} role="none" className={s.tabitem}>
            <button
              className={s.tab}
              role="tab"
              type="button"
              onClick={() => setCurrentTab(filename)}
              aria-selected={currentTab === filename}
            >
              {filename}
            </button>
          </li>
        ))}
      </ul>

      <div className={s.editor}>
        {errors[currentTab] ? (
          <div className={s.editorError}>{errors[currentTab]}</div>
        ) : null}
        <CodeEditor
          path={currentTab}
          defaultValue={files[currentTab]}
          onChange={(contents = '') => {
            try {
              setErrors((value) => ({ ...value, [currentTab]: undefined }));
              JSON.parse(contents);
              if (currentTab === 'resolver.json') {
                const r = createResolver(parsedTokens, JSON.parse(contents));
                r.apply(values);
                setParsedResolver(JSON.parse(contents));
              } else {
                const r = createResolver(
                  { ...parsedTokens, [currentTab]: JSON.parse(contents) },
                  parsedResolver,
                );
                r.apply(values);
                setParsedTokens((tokens) => ({
                  ...tokens,
                  [currentTab]: JSON.parse(contents),
                }));
              }
            } catch (err) {
              setErrors((value) => ({ ...value, [currentTab]: String(err) }));
            }
          }}
        />
      </div>

      <div role="toolbar" className={s.modifiers}>
        {parsedResolver.modifiers.map((modifier) => (
          <Select
            key={modifier.name}
            options={modifier.values.map((value) => ({
              label: value.name,
              value: value.name,
            }))}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                [modifier.name!]: (e.target as HTMLSelectElement).value,
              }))
            }
          >
            {modifier.name}
          </Select>
        ))}
      </div>

      <section className={s.final}>
        <CodeEditor value={prettyJSON(r.apply(values))} />
      </section>
    </>
  );
}
