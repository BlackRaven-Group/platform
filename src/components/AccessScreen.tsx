import { useEffect, useRef } from 'react';

interface AccessScreenProps {
  onAccess: () => void;
}

export default function AccessScreen({ onAccess }: AccessScreenProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasUnlockedRef = useRef(false);

  // Débloquer l'autoplay audio avec l'interaction utilisateur
  const handleAccess = () => {
    if (!hasUnlockedRef.current) {
      // Créer un contexte audio pour débloquer l'autoplay
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Créer un son silencieux très court pour débloquer l'autoplay
        const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        console.log('✅ Audio context unlocked');
      } catch (err) {
        console.warn('⚠️ Audio context creation failed:', err);
      }
      hasUnlockedRef.current = true;
    }
    
    // Lancer le splash screen
    onAccess();
  };

  // Débloquer aussi avec les touches du clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAccess();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mb-8 animate-pulse">
          <div className="inline-block px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-sm">
            <span className="text-white text-sm font-bold tracking-widest">[BLACKRAVEN]</span>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight glitch" data-text="ACCÈS RESTREINT">
          ACCÈS RESTREINT
        </h1>
        
        <p className="text-zinc-400 mb-8 text-sm md:text-base font-mono">
          &gt; Cliquez pour accéder au système
        </p>
        
        <button
          onClick={handleAccess}
          className="px-8 py-4 bg-green-900/30 border-2 border-green-700 text-white font-bold tracking-widest hover:bg-green-900/50 hover:border-green-600 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-black"
          style={{ fontFamily: 'monospace' }}
        >
          [ ACCÉDER ]
        </button>
        
        <p className="text-zinc-600 mt-6 text-xs font-mono">
          Appuyez sur ENTRÉE ou ESPACE
        </p>
      </div>
    </div>
  );
}
