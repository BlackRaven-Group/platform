import { useState, useEffect } from 'react';

interface MasterPouletProps {
  onAccessGranted: () => void;
}

// Liste des IPs bannies (stockée en localStorage pour la démo)
const BANNED_STORAGE_KEY = 'mp_banned';
const ACCESS_STORAGE_KEY = 'mp_access_granted';

export default function MasterPoulet({ onAccessGranted }: MasterPouletProps) {
  const [selectedCuisson, setSelectedCuisson] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà accès
    const hasAccess = localStorage.getItem(ACCESS_STORAGE_KEY) === 'true';
    if (hasAccess) {
      onAccessGranted();
      return;
    }

    // Vérifier si l'utilisateur est banni
    const banned = localStorage.getItem(BANNED_STORAGE_KEY) === 'true';
    if (banned) {
      setIsBanned(true);
    }
    
    setIsLoading(false);
  }, [onAccessGranted]);

  const handleCuissonSelect = (cuisson: string) => {
    setSelectedCuisson(cuisson);
  };

  const handleCommander = () => {
    if (!selectedCuisson) return;

    if (selectedCuisson === 'bien_cuit') {
      // Accès accordé
      localStorage.setItem(ACCESS_STORAGE_KEY, 'true');
      onAccessGranted();
    } else if (selectedCuisson === 'mi_cuit') {
      // Bannissement
      localStorage.setItem(BANNED_STORAGE_KEY, 'true');
      setIsBanned(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 to-red-950 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Service Indisponible
          </h1>
          <p className="text-red-200 mb-8">
            Nous sommes désolés, mais notre établissement ne peut pas vous servir.
            Veuillez essayer un autre restaurant.
          </p>
          <div className="text-red-400 text-sm">
            Erreur: HYGIENE_VIOLATION_403
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-800 to-orange-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🍗</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  MASTER POULET
                </h1>
                <p className="text-amber-200 text-sm">Rôtisserie Artisanale depuis 1987</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-amber-100">
              <a href="#menu" className="hover:text-white transition-colors">Menu</a>
              <a href="#about" className="hover:text-white transition-colors">À Propos</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">🍗</div>
          <div className="absolute bottom-20 right-20 text-7xl">🍖</div>
          <div className="absolute top-1/2 left-1/3 text-6xl">🌿</div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-amber-900 mb-6">
            Le Poulet Parfait,
            <br />
            <span className="text-orange-600">À Votre Goût</span>
          </h2>
          <p className="text-xl text-amber-700 mb-8 max-w-2xl mx-auto">
            Découvrez l'art de la rôtisserie traditionnelle. 
            Nos poulets fermiers sont préparés avec passion depuis plus de 35 ans.
          </p>
          <button
            onClick={() => setShowMenu(true)}
            className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Commander Maintenant
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🐔</div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">Poulet Fermier</h3>
              <p className="text-amber-700">Élevés en plein air dans nos fermes partenaires</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🔥</div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">Cuisson au Feu de Bois</h3>
              <p className="text-amber-700">Une saveur authentique incomparable</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🌿</div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">Herbes Fraîches</h3>
              <p className="text-amber-700">Assaisonnés avec des herbes de notre jardin</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de commande */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
              <h3 className="text-2xl font-bold">Votre Commande</h3>
              <p className="text-amber-100 mt-1">Choisissez votre cuisson préférée</p>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-amber-900 font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">🍗</span>
                  Poulet Rôti Entier - 12,90€
                </h4>
                
                <div className="space-y-3">
                  <label 
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedCuisson === 'bien_cuit' 
                        ? 'border-amber-500 bg-amber-50' 
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cuisson"
                      value="bien_cuit"
                      checked={selectedCuisson === 'bien_cuit'}
                      onChange={() => handleCuissonSelect('bien_cuit')}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-amber-900">🔥 Bien Cuit</div>
                      <div className="text-sm text-amber-600">Croustillant et doré, cuisson parfaite</div>
                    </div>
                    {selectedCuisson === 'bien_cuit' && (
                      <div className="text-amber-600 text-xl">✓</div>
                    )}
                  </label>
                  
                  <label 
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedCuisson === 'mi_cuit' 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cuisson"
                      value="mi_cuit"
                      checked={selectedCuisson === 'mi_cuit'}
                      onChange={() => handleCuissonSelect('mi_cuit')}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-700">🥩 Mi-Cuit</div>
                      <div className="text-sm text-gray-500">Cuisson légère, rosé à cœur</div>
                    </div>
                    {selectedCuisson === 'mi_cuit' && (
                      <div className="text-red-600 text-xl">✓</div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowMenu(false)}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCommander}
                  disabled={!selectedCuisson}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  Commander
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-100 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🍗</span>
            <span className="font-bold text-xl">MASTER POULET</span>
          </div>
          <p className="text-amber-300 text-sm">
            © 2024 Master Poulet - Rôtisserie Artisanale
          </p>
          <p className="text-amber-400 text-xs mt-2">
            123 Rue de la Broche, 75001 Paris | Tél: 01 23 45 67 89
          </p>
        </div>
      </footer>
    </div>
  );
}
