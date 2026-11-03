import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/css';
import './styles/app.css';
import './styles/screens.css';
import App from './App';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
