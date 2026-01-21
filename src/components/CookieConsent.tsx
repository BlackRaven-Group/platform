import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';

interface CookieConsentProps {
  showAfterSplash?: boolean;
}

export default function CookieConsent({ showAfterSplash = false }: CookieConsentProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Ne pas afficher si on attend encore le splash screen
    if (!showAfterSplash) {
      return;
    }

    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('cookie_consent');
    console.log('🍪 Cookie consent check:', consent);
    
    if (!consent) {
      // Afficher après un délai pour laisser le temps au splash screen de se terminer
      const timer = setTimeout(() => {
        console.log('🍪 Showing cookie consent banner');
        setShow(true);
      }, 3000); // 3 secondes après la fin du splash
      return () => clearTimeout(timer);
    } else {
      console.log('🍪 Cookie consent already given:', consent);
    }
  }, [showAfterSplash]);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShow(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setShow(false);
  };

  const handleClose = () => {
    // Fermer sans enregistrer de choix (l'utilisateur pourra revoir le message plus tard)
    setShow(false);
    // Réafficher après 24h
    setTimeout(() => {
      const consent = localStorage.getItem('cookie_consent');
      if (!consent) {
        setShow(true);
      }
    }, 24 * 60 * 60 * 1000);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10000] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-black/95 border-2 border-zinc-800 rounded-sm shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-6">
          <div className="flex-shrink-0">
            <Cookie className="w-8 h-8 text-amber-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-2 tracking-wider">
              [GESTION DES COOKIES]
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed mb-4 font-mono">
              Ce site utilise des cookies pour améliorer votre expérience et assurer le bon fonctionnement des services.
              En continuant, vous acceptez l'utilisation de cookies conformément à notre{' '}
              <a 
                href="#legal" 
                className="text-amber-600 hover:text-amber-500 underline"
                onClick={(e) => {
                  e.preventDefault();
                  // Déclencher l'ouverture de la page légale si nécessaire
                  const event = new CustomEvent('openLegalPage');
                  window.dispatchEvent(event);
                }}
              >
                politique de confidentialité
              </a>.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-green-900/30 border-2 border-green-700 text-white font-bold text-xs tracking-widest hover:bg-green-900/50 hover:border-green-600 transition-all duration-300"
              >
                [ ACCEPTER ]
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-zinc-900/50 border-2 border-zinc-700 text-zinc-300 font-bold text-xs tracking-widest hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-300"
              >
                [ REFUSER ]
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-transparent border-2 border-zinc-800 text-zinc-500 font-bold text-xs tracking-widest hover:border-zinc-700 hover:text-zinc-400 transition-all duration-300"
              >
                [ PLUS TARD ]
              </button>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-zinc-500 hover:text-white transition-colors p-1"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
