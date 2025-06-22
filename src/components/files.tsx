import { Editor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { DEFAULT_MONACO_OPTIONS } from '../lib/monaco.js';
import type { Preset } from '../lib/types.js';
import s from './files.module.css';

self.MonacoEnvironment = {
  getWorker(_, label) {
    switch (label) {
      case 'json': {
        return new jsonWorker();
      }
      default: {
        return new editorWorker();
      }
    }
  },
};

export interface FilesProps {
  preset: Preset;
  errors: Record<string, string | undefined>;
  files: Record<string, string>;
  setErrors: Dispatch<SetStateAction<Record<string, string | undefined>>>;
  onChange?: (filename: string, contents: string) => void;
}

export default function Files({
  errors,
  files,
  onChange,
  preset,
  setErrors,
}: FilesProps) {
  const [currentTab, setCurrentTab] = useState(Object.keys(files)[0]);

  // show missing resolver.json error on init
  useEffect(() => {
    if (!('resolver.json' in files)) {
      setErrors(
        Object.fromEntries(
          Object.keys(files).map((filename) => [
            filename,
            'Design system error: resolver.json not found',
          ]),
        ),
      );
    }
  }, [files, errors, preset]);

  // on DS reset, reset current tab back to resolver.json
  useEffect(() => {
    setCurrentTab('resolver.json');
  }, [preset]);

  // init
  useEffect(() => {
    loader.config({ monaco });
    loader.init();
  }, []);

  return (
    <div className={s.container}>
      {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: bug */}
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
        <Editor
          theme="vs-dark"
          options={DEFAULT_MONACO_OPTIONS}
          defaultLanguage="json"
          path={
            `${preset}/${currentTab}` // prefixing with preset prevents conflicts between files like resolver.json
          }
          defaultValue={files[currentTab]}
          onChange={(contents = '') => {
            onChange?.(currentTab, contents);
          }}
        />
      </div>
    </div>
  );
}
