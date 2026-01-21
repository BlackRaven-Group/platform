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
    console.log('🎵 Initializing audio:', soundUrl);
    
    // Créer l'élément audio pour le son du corbeau
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = 1.0; // Volume à 100% pour être sûr
    audioRef.current.preload = 'auto';
    
    // Vérifier que le fichier audio peut être chargé
    audioRef.current.addEventListener('canplaythrough', () => {
      console.log('✅ Audio file loaded and ready to play');
    });
    
    audioRef.current.addEventListener('error', (e) => {
      console.error('❌ Audio loading error:', e);
    });
    
    // Fonction pour jouer l'audio
    const playAudio = async () => {
      if (!audioRef.current) {
        console.warn('⚠️ Audio ref is null');
        return;
      }
      
      if (hasPlayedRef.current) {
        console.log('ℹ️ Audio already played');
        return;
      }
      
      console.log('▶️ Attempting to play audio...');
      console.log('   - Audio readyState:', audioRef.current.readyState);
      console.log('   - Audio src:', audioRef.current.src);
      console.log('   - Audio volume:', audioRef.current.volume);
      
      try {
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          hasPlayedRef.current = true;
          interactionRef.current = true;
          setAudioReady(true);
          console.log('✅✅✅ Audio played successfully!');
        }
      } catch (error: any) {
        console.error('❌ Audio play failed:', error.name, error.message);
        interactionRef.current = false;
      }
    };

    // Attendre que l'audio soit prêt avant d'essayer de jouer
    const tryPlayWhenReady = () => {
      if (audioRef.current) {
        if (audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
          console.log('🎵 Audio is ready, attempting play...');
          playAudio();
        } else {
          console.log('⏳ Waiting for audio to load...');
          audioRef.current.addEventListener('canplay', () => {
            console.log('🎵 Audio can play now');
            playAudio();
          }, { once: true });
        }
      }
    };
    
    // Essayer de jouer après un court délai pour laisser le temps au navigateur
    setTimeout(tryPlayWhenReady, 100);
    
    // Écouter TOUS les types d'interactions pour débloquer l'audio
    const handleInteraction = (eventType: string) => {
      console.log(`👆 User interaction detected: ${eventType}`);
      if (!hasPlayedRef.current && audioRef.current) {
        playAudio();
      }
    };

    // Écouter plusieurs événements pour maximiser les chances de déblocage
    const events = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown', 'mousemove', 'pointerdown', 'pointerup'];
    events.forEach(event => {
      document.addEventListener(event, () => handleInteraction(event), { once: true, passive: true });
    });

    // Créer un bouton visible mais discret qui se déclenche automatiquement
    const createAutoClickButton = () => {
      const button = document.createElement('button');
      button.innerHTML = '🔊';
      button.style.cssText = 'position:fixed;top:10px;right:10px;width:40px;height:40px;opacity:0.01;z-index:99999;cursor:pointer;background:transparent;border:none;';
      button.setAttribute('aria-label', 'Play audio');
      button.setAttribute('title', 'Play audio');
      document.body.appendChild(button);
      
      console.log('🔘 Creating auto-click button...');
      
      // Déclencher plusieurs fois avec des délais différents
      const clickAttempts = [50, 150, 300, 500];
      clickAttempts.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`🖱️ Auto-click attempt ${index + 1}...`);
          button.click();
          // Aussi essayer de jouer directement après le click
          setTimeout(() => {
            if (audioRef.current && !hasPlayedRef.current) {
              playAudio();
            }
          }, 10);
        }, delay);
      });
      
      // Nettoyer après
      setTimeout(() => {
        if (document.body.contains(button)) {
          document.body.removeChild(button);
          console.log('🧹 Auto-click button removed');
        }
      }, 1000);
    };

    // Essayer de créer un auto-click après un court délai
    setTimeout(createAutoClickButton, 200);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, () => handleInteraction(event));
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
