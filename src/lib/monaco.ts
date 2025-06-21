import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

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

loader.config({ monaco });
loader.init();

export const DEFAULT_MONACO_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions =
  {
    detectIndentation: true,
    fontFamily: 'Fragment Mono',
    fontSize: 11,
    formatOnType: true,
    minimap: { enabled: false },
    automaticLayout: true,
    tabSize: 2,
    trimAutoWhitespace: true,
  };
