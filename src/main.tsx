import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@fontsource/anuphan/thai-400.css';
import '@fontsource/anuphan/thai-500.css';
import '@fontsource/anuphan/thai-600.css';
import '@fontsource/anuphan/thai-700.css';
import '@fontsource/anuphan/latin-400.css';
import '@fontsource/anuphan/latin-500.css';
import '@fontsource/anuphan/latin-600.css';
import '@fontsource/anuphan/latin-700.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import './styles.css';
import { setupPwa } from './pwa';

setupPwa();

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
