import * as monaco from "monaco-editor";
import { useLayoutEffect, useState } from "react";
import figmaSds from "../lib/examples/figma-sds.js";
import s from "./code-editor.module.css";

const MONACO_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  language: "json",
  theme: "vs-dark",
  fontFamily: "Fragment Mono",
  fontSize: 11,
  formatOnType: true,
  minimap: { enabled: false },
  automaticLayout: true,
  tabSize: 2,
};

const editor: Record<string, monaco.editor.IStandaloneCodeEditor> = {};
const files = Object.keys(figmaSds); // preserve some order

export default function CodeEditor() {
  const [currentTab, setCurrentTab] = useState(files[0]);

  useLayoutEffect(() => {
    self.MonacoEnvironment = {
      getWorker(_workerId: string, label: string): Worker {
        switch (label) {
          case "json": {
            return new Worker(
              new URL(
                "monaco-editor/esm/vs/language/json/json.worker.js",
                import.meta.url
              ),
              {
                type: "module",
              }
            );
          }
          default: {
            return new Worker(
              new URL(
                "monaco-editor/esm/vs/editor/editor.worker.js",
                import.meta.url
              ),
              {
                type: "module",
              }
            );
          }
        }
      },
    };

    for (const filename of files) {
      editor[filename] = monaco.editor.create(
        document.getElementById(`editor-${filename}`)!,
        {
          value: figmaSds[filename as keyof typeof figmaSds],
          ...MONACO_OPTIONS,
        }
      );
    }
  }, []);

  return (
    <div className={s.codeEditor}>
      <ul role="tablist" className={s.tablist}>
        {files.map((filename) => (
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

      {files.map((filename) => (
        <div
          className={s.tabpanel}
          key={filename}
          role="tabpanel"
          hidden={currentTab !== filename || undefined}
        >
          <div id={`editor-${filename}`} />
        </div>
      ))}
    </div>
  );
}
