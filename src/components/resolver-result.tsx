import { DiffEditor } from '@monaco-editor/react';
import { type Dispatch, type SetStateAction, useMemo } from 'react';
import { DEFAULT_MONACO_OPTIONS } from '../lib/monaco';
import type { Resolver, ResolverImpl } from '../lib/types';
import { diffTokens, prettyJSON } from '../lib/utils';
import s from './resolver-result.module.css';
import { Select } from './select';

export interface ResolverResultProps {
  resolver: ResolverImpl<Record<string, any>>;
  modifiers: NonNullable<Resolver['modifiers']>;
  values: Record<string, string>;
  setValues: Dispatch<SetStateAction<Record<string, string>>>;
}

export default function ResolverResult({
  resolver,
  modifiers,
  values,
  setValues,
}: ResolverResultProps) {
  const finalTokens = useMemo(() => {
    const { $extensions = {}, ...result } = resolver.apply(values);
    const modified: string[] = $extensions.modified ?? [];
    return diffTokens(prettyJSON(result), new Set(modified));
  }, [resolver, values]);

  return (
    <div className={s.container}>
      <div role="toolbar" className={s.modifiers}>
        {modifiers.map((modifier) => (
          <Select
            key={modifier.name}
            label={modifier.name}
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
          />
        ))}
      </div>

      <section className={s.final}>
        <DiffEditor
          theme="vs-dark"
          options={{
            ...DEFAULT_MONACO_OPTIONS,
            renderGutterMenu: false,
            renderSideBySide: false,
          }}
          keepCurrentOriginalModel={false}
          original={finalTokens.original}
          modified={finalTokens.modified}
        />
      </section>
    </div>
  );
}
