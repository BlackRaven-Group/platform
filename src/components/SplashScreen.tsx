import { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  gifUrl?: string;
  soundUrl?: string;
  audioUnlocked?: boolean;
}

export default function SplashScreen({ 
  onComplete, 
  gifUrl = 'https://i.gifer.com/OtJl.gif',
  soundUrl = '/raven-x3-102988.mp3',
  audioUnlocked = false
}: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [show, setShow] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPlayedRef = useRef(false);

  // Préparer et jouer l'audio (déjà débloqué par l'écran d'accès)
  useEffect(() => {
    if (!audioUnlocked) {
      return; // Attendre que l'audio soit débloqué
    }

    console.log('🎵 Initializing audio (unlocked):', soundUrl);
    
    // Créer l'élément audio pour le son du corbeau
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = 1.0; // Volume à 100%
    audioRef.current.preload = 'auto';
    
    // Fonction pour jouer l'audio
    const playAudio = async () => {
      if (!audioRef.current || hasPlayedRef.current) {
        return;
      }
      
      try {
        await audioRef.current.play();
        hasPlayedRef.current = true;
        console.log('✅✅✅ Audio played successfully!');
      } catch (error: any) {
        console.warn('⚠️ Audio play failed:', error.name);
      }
    };

    // Attendre que l'audio soit prêt puis jouer
    const tryPlayWhenReady = () => {
      if (audioRef.current) {
        if (audioRef.current.readyState >= 2) {
          playAudio();
        } else {
          audioRef.current.addEventListener('canplay', playAudio, { once: true });
        }
      }
    };

    // Essayer de jouer immédiatement (l'autoplay est débloqué)
    setTimeout(tryPlayWhenReady, 100);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundUrl, audioUnlocked]);

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
          if (imgRef.current) {
            imgRef.current.style.animationIterationCount = '1';
          }
        }}
      />
    </div>
  );
}
