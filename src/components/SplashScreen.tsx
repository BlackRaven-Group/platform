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
  const [audioReady, setAudioReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedRef = useRef(false);
  const interactionRef = useRef(false);

  // Préparer l'audio et débloquer l'autoplay avec une interaction réelle
  useEffect(() => {
    // Créer l'élément audio pour le son du corbeau
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = 0.9; // Volume à 90%
    audioRef.current.preload = 'auto';
    
    // Fonction pour débloquer l'autoplay avec une vraie interaction utilisateur
    const unlockAudio = () => {
      if (audioRef.current && !interactionRef.current) {
        // Créer un contexte audio et le débloquer avec une interaction
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Autoplay réussi
              hasPlayedRef.current = true;
              interactionRef.current = true;
              setAudioReady(true);
              console.log('Audio autoplay successful');
            })
            .catch((error) => {
              // Autoplay bloqué - on attendra une vraie interaction
              console.warn('Autoplay blocked, waiting for user interaction:', error);
              interactionRef.current = false;
            });
        }
      }
    };

    // Essayer de débloquer immédiatement
    unlockAudio();
    
    // Écouter TOUS les types d'interactions pour débloquer l'audio
    const handleInteraction = () => {
      if (!interactionRef.current && audioRef.current && !hasPlayedRef.current) {
        audioRef.current.play()
          .then(() => {
            hasPlayedRef.current = true;
            interactionRef.current = true;
            setAudioReady(true);
            console.log('Audio played on user interaction');
          })
          .catch(e => console.warn('Audio play failed:', e));
      }
    };

    // Écouter plusieurs événements pour maximiser les chances
    const events = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown', 'mousemove', 'pointerdown'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl]);

  // Gérer le timing du splash screen
  useEffect(() => {
    // Durée exacte du GIF (environ 2.5 secondes d'après l'observation)
    // Ajustez cette valeur si nécessaire pour correspondre exactement à la durée du GIF
    const gifDuration = 2500; // 2.5 secondes en millisecondes
    
    const startSplash = () => {
      // Démarrer le fade out juste avant la fin du GIF pour une transition fluide
      timeoutRef.current = setTimeout(() => {
        // Commencer le fade out
        setFadeOut(true);
        
        // Laisser le son continuer pendant le fade, puis l'arrêter
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }, 200);
        
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
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onComplete]);

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
