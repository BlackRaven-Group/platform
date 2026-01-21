import { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  gifUrl?: string;
}

export default function SplashScreen({ onComplete, gifUrl = 'https://i.gifer.com/OtJl.gif' }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [show, setShow] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Détecter quand le GIF se termine (approximation: après 3-4 secondes pour la plupart des GIFs)
    // Ou utiliser l'événement onLoad pour détecter la fin
    const checkGifComplete = () => {
      // Pour un GIF, on ne peut pas vraiment détecter la fin de manière fiable
      // On utilise un délai approximatif basé sur la durée typique d'un GIF
      // Vous pouvez ajuster cette valeur selon la durée réelle du GIF
      const gifDuration = 4000; // 4 secondes en millisecondes
      
      timeoutRef.current = setTimeout(() => {
        // Commencer le fade out
        setFadeOut(true);
        
        // Après l'animation de fade, masquer complètement
        setTimeout(() => {
          setShow(false);
          onComplete();
        }, 500); // Durée du fade (doit correspondre à la transition CSS)
      }, gifDuration);
    };

    // Attendre que l'image soit chargée
    if (imgRef.current?.complete) {
      checkGifComplete();
    } else {
      imgRef.current?.addEventListener('load', checkGifComplete);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      imgRef.current?.removeEventListener('load', checkGifComplete);
    };
  }, [onComplete]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ pointerEvents: fadeOut ? 'none' : 'auto' }}
    >
      <img
        ref={imgRef}
        src={gifUrl}
        alt="Loading"
        className="w-full h-full object-cover"
        style={{ 
          imageRendering: 'auto',
          objectFit: 'cover'
        }}
      />
    </div>
  );
}
