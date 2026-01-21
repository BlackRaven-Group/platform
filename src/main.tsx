import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Débloquer l'autoplay audio dès le chargement de la page
// en créant une interaction programmatique
const unlockAudio = () => {
  // Créer un contexte audio vide pour débloquer l'autoplay
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Créer un bouton invisible qui se déclenche automatiquement
  const button = document.createElement('button');
  button.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;';
  document.body.appendChild(button);
  
  // Simuler plusieurs clics pour débloquer
  setTimeout(() => {
    button.click();
    button.click();
    button.click();
    if (document.body.contains(button)) {
      document.body.removeChild(button);
    }
  }, 100);
  
  // Fermer le contexte audio après utilisation
  setTimeout(() => {
    if (audioContext.state !== 'closed') {
      audioContext.close();
    }
  }, 500);
};

// Débloquer l'audio dès que possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', unlockAudio);
} else {
  unlockAudio();
}

// Aussi débloquer sur le premier événement utilisateur
['click', 'touchstart', 'mousedown', 'keydown'].forEach(event => {
  document.addEventListener(event, unlockAudio, { once: true, passive: true });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
