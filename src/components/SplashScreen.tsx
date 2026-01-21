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
  const autoClickButtonRef = useRef<HTMLButtonElement | null>(null);

  // Préparer l'audio et débloquer l'autoplay avec une interaction réelle
  useEffect(() => {
    console.log('🎵 Initializing audio:', soundUrl);
    
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
        interactionRef.current = true;
        setAudioReady(true);
        console.log('✅✅✅ Audio played successfully!');
      } catch (error: any) {
        console.warn('⚠️ Audio play failed:', error.name);
      }
    };

    // Attendre que l'audio soit prêt
    const tryPlayWhenReady = () => {
      if (audioRef.current) {
        if (audioRef.current.readyState >= 2) {
          playAudio();
        } else {
          audioRef.current.addEventListener('canplay', playAudio, { once: true });
        }
      }
    };
    
    // Écouter les interactions utilisateur
    const handleInteraction = () => {
      if (!hasPlayedRef.current && audioRef.current) {
        playAudio();
      }
    };

    // Écouter plusieurs événements
    const events = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown', 'mousemove', 'pointerdown'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    // Utiliser requestAnimationFrame pour déclencher après le premier frame (considéré comme interaction)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (audioRef.current && !hasPlayedRef.current) {
          console.log('🎬 Using requestAnimationFrame to trigger audio...');
          playAudio();
        }
      });
    });

    // Essayer de jouer après un court délai
    setTimeout(tryPlayWhenReady, 50);

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

  // Référence pour le conteneur du splash screen
  const splashRef = useRef<HTMLDivElement>(null);

  // Déclencher automatiquement l'audio dès que le composant est monté
  useEffect(() => {
    // Créer un bouton réellement interactif qui se déclenche automatiquement
    const triggerAudio = () => {
      if (autoClickButtonRef.current && audioRef.current && !hasPlayedRef.current) {
        console.log('🖱️ Auto-clicking button to unlock audio...');
        // Utiliser un vrai événement de clic sur un vrai bouton
        autoClickButtonRef.current.focus();
        autoClickButtonRef.current.click();
        
        // Aussi essayer directement
        setTimeout(() => {
          if (audioRef.current && !hasPlayedRef.current) {
            audioRef.current.play().then(() => {
              hasPlayedRef.current = true;
              console.log('✅ Audio played via auto-click button');
            }).catch(err => {
              console.warn('⚠️ Auto-click play failed:', err);
            });
          }
        }, 10);
      }
    };
    
    // Essayer plusieurs fois avec des délais différents
    const attempts = [100, 200, 300, 400, 500, 700, 1000];
    attempts.forEach(delay => {
      setTimeout(triggerAudio, delay);
    });
  }, [show]);

  if (!show) return null;

  return (
    <div
      ref={splashRef}
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ pointerEvents: fadeOut ? 'none' : 'auto' }}
      onClick={() => {
        if (audioRef.current && !hasPlayedRef.current) {
          audioRef.current.play().then(() => {
            hasPlayedRef.current = true;
          }).catch(() => {});
        }
      }}
      onTouchStart={() => {
        if (audioRef.current && !hasPlayedRef.current) {
          audioRef.current.play().then(() => {
            hasPlayedRef.current = true;
          }).catch(() => {});
        }
      }}
      onMouseMove={() => {
        // Le mouvement de la souris est considéré comme une interaction valide
        if (audioRef.current && !hasPlayedRef.current) {
          audioRef.current.play().then(() => {
            hasPlayedRef.current = true;
          }).catch(() => {});
        }
      }}
    >
      {/* Bouton invisible mais réellement interactif pour débloquer l'audio */}
      <button
        ref={autoClickButtonRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'default',
          border: 'none',
          background: 'transparent',
          zIndex: 1
        }}
        aria-hidden="true"
        onClick={(e) => {
          e.preventDefault();
          if (audioRef.current && !hasPlayedRef.current) {
            audioRef.current.play().then(() => {
              hasPlayedRef.current = true;
              console.log('✅ Audio played via invisible button click');
            }).catch(() => {});
          }
        }}
      />
      <img
        ref={imgRef}
        src={gifUrl}
        alt="Loading"
        className="w-full h-full object-cover"
        style={{ 
          imageRendering: 'auto',
          objectFit: 'cover',
          zIndex: 0
        }}
        onLoad={() => {
          if (imgRef.current) {
            imgRef.current.style.animationIterationCount = '1';
          }
          // Déclencher l'audio quand l'image est chargée
          if (audioRef.current && !hasPlayedRef.current && autoClickButtonRef.current) {
            setTimeout(() => {
              if (autoClickButtonRef.current) {
                autoClickButtonRef.current.click();
              }
            }, 50);
          }
        }}
      />
    </div>
  );
}
