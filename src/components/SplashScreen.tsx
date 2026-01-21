import { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  gifUrl?: string;
  soundUrl?: string;
}

export default function SplashScreen({ 
  onComplete, 
  gifUrl = 'https://i.gifer.com/OtJl.gif',
  soundUrl = '/raven-x3-102988.mp3'
}: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [show, setShow] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    // Créer l'élément audio pour le son du corbeau
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = 0.8; // Volume à 80%
    audioRef.current.preload = 'auto';
    
    // Stratégie pour forcer l'autoplay : créer une interaction programmatique
    // en simulant un clic sur un bouton invisible au chargement
    const enableAutoplay = () => {
      // Créer un bouton invisible qui se déclenche automatiquement
      const button = document.createElement('button');
      button.style.position = 'fixed';
      button.style.opacity = '0';
      button.style.pointerEvents = 'none';
      button.style.width = '1px';
      button.style.height = '1px';
      document.body.appendChild(button);
      
      // Simuler un clic pour débloquer l'autoplay
      button.click();
      
      // Nettoyer après un court délai
      setTimeout(() => {
        document.body.removeChild(button);
      }, 100);
    };
    
    // Activer l'autoplay dès le chargement
    enableAutoplay();
    
    // Les navigateurs modernes bloquent l'autoplay audio sans interaction utilisateur
    // On va essayer de jouer le son, et si ça échoue, on le jouera au premier clic/interaction
    const playAudio = async () => {
      if (audioRef.current && !hasPlayedRef.current) {
        try {
          // Essayer de jouer immédiatement
          await audioRef.current.play();
          hasPlayedRef.current = true;
          console.log('Audio played successfully');
        } catch (err: any) {
          console.warn('Autoplay blocked, will play on user interaction:', err);
          // Si l'autoplay est bloqué, on écoute le premier clic/touch
          const playOnInteraction = () => {
            if (audioRef.current && !hasPlayedRef.current) {
              audioRef.current.play().catch(e => console.warn('Audio play failed:', e));
              hasPlayedRef.current = true;
            }
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
            document.removeEventListener('mousemove', playOnInteraction);
          };
          // Écouter plusieurs types d'interactions pour maximiser les chances
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          document.addEventListener('keydown', playOnInteraction, { once: true });
          document.addEventListener('mousemove', playOnInteraction, { once: true });
        }
      }
    };

    // Durée exacte du GIF (environ 2.5 secondes d'après l'observation)
    // Ajustez cette valeur si nécessaire pour correspondre exactement à la durée du GIF
    const gifDuration = 2500; // 2.5 secondes en millisecondes
    
    const startSplash = () => {
      // Essayer de jouer le son du corbeau au début
      playAudio();

      // Démarrer le fade out juste avant la fin du GIF pour une transition fluide
      timeoutRef.current = setTimeout(() => {
        // Commencer le fade out
        setFadeOut(true);
        
        // Arrêter le son si il est encore en cours
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        
        // Après l'animation de fade, masquer complètement
        setTimeout(() => {
          setShow(false);
          onComplete();
        }, 300); // Durée du fade (ajustée pour être plus rapide)
      }, gifDuration);
    };

    // Attendre que l'image soit chargée avant de démarrer
    if (imgRef.current?.complete) {
      startSplash();
    } else {
      const handleLoad = () => {
        startSplash();
      };
      imgRef.current?.addEventListener('load', handleLoad);
      
      return () => {
        imgRef.current?.removeEventListener('load', handleLoad);
      };
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [onComplete, soundUrl]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-300 ${
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
        onLoad={() => {
          // Empêcher le GIF de se rejouer en forçant un seul cycle
          if (imgRef.current) {
            imgRef.current.style.animationIterationCount = '1';
          }
        }}
      />
    </div>
  );
}
