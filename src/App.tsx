import { createRoot } from 'react-dom/client';
import s from './App.module.css';
import CodeEditor from './components/playground';
import './styles/global.css';

function App() {
  return (
    <div className={s.app}>
      <CodeEditor />
    </div>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
