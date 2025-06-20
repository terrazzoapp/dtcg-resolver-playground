import { createRoot } from "react-dom/client";
import CodeEditor from "./components/code-editor";
import "./styles/global.css";

function App() {
  return <CodeEditor />;
}

const root = createRoot(document.getElementById("app")!);
root.render(<App />);
