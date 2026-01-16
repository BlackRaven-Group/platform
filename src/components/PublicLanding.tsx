import { useState } from 'react';
import { Shield, Eye, Lock, Globe, ChevronRight, Mail, Phone, MapPin } from 'lucide-react';

export default function PublicLanding() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/removal-190.png" alt="BlackRaven" className="w-10 h-10 object-contain" />
              <span className="font-bold text-xl tracking-tight">BLACKRAVEN</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-zinc-400 hover:text-white transition-colors text-sm">Services</a>
              <a href="#expertise" className="text-zinc-400 hover:text-white transition-colors text-sm">Expertise</a>
              <a href="#contact" className="text-zinc-400 hover:text-white transition-colors text-sm">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent"></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-8">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-amber-400 text-sm font-medium">Sécurité & Intelligence</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Intelligence
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                  Stratégique
                </span>
              </h1>
              
              <p className="text-xl text-zinc-400 mb-8 max-w-lg">
                Solutions avancées d'investigation et de sécurité informatique 
                pour protéger vos intérêts les plus sensibles.
              </p>

              <div className="flex flex-wrap gap-4">
                <a 
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  Nous Contacter
                  <ChevronRight className="w-5 h-5" />
                </a>
                <a 
                  href="#services"
                  className="inline-flex items-center gap-2 border border-zinc-700 text-white px-6 py-3 rounded-lg hover:bg-zinc-900 transition-colors"
                >
                  Nos Services
                </a>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-3xl"></div>
                <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-black/50 rounded-xl p-6 border border-zinc-800">
                      <Eye className="w-8 h-8 text-amber-500 mb-4" />
                      <h3 className="font-bold mb-2">OSINT</h3>
                      <p className="text-zinc-500 text-sm">Open Source Intelligence</p>
                    </div>
                    <div className="bg-black/50 rounded-xl p-6 border border-zinc-800">
                      <Shield className="w-8 h-8 text-amber-500 mb-4" />
                      <h3 className="font-bold mb-2">Sécurité</h3>
                      <p className="text-zinc-500 text-sm">Protection des données</p>
                    </div>
                    <div className="bg-black/50 rounded-xl p-6 border border-zinc-800">
                      <Lock className="w-8 h-8 text-amber-500 mb-4" />
                      <h3 className="font-bold mb-2">Cryptographie</h3>
                      <p className="text-zinc-500 text-sm">Communications sécurisées</p>
                    </div>
                    <div className="bg-black/50 rounded-xl p-6 border border-zinc-800">
                      <Globe className="w-8 h-8 text-amber-500 mb-4" />
                      <h3 className="font-bold mb-2">Investigation</h3>
                      <p className="text-zinc-500 text-sm">Analyse approfondie</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Nos Services</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Une gamme complète de solutions pour répondre à vos besoins en matière 
              de sécurité et d'intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Eye,
                title: "Recherche OSINT",
                description: "Investigation approfondie utilisant les sources ouvertes pour collecter des informations stratégiques."
              },
              {
                icon: Shield,
                title: "Audit Sécurité",
                description: "Évaluation complète de votre infrastructure pour identifier les vulnérabilités potentielles."
              },
              {
                icon: Lock,
                title: "Communication Sécurisée",
                description: "Solutions de messagerie chiffrée et protocoles de sécurité avancés."
              },
              {
                icon: Globe,
                title: "Veille Stratégique",
                description: "Surveillance continue de votre environnement concurrentiel et réglementaire."
              },
              {
                icon: Eye,
                title: "Due Diligence",
                description: "Vérification approfondie avant partenariats, investissements ou acquisitions."
              },
              {
                icon: Shield,
                title: "Protection Réputation",
                description: "Gestion proactive de votre image en ligne et neutralisation des menaces."
              }
            ].map((service, index) => (
              <div 
                key={index}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-amber-500/50 transition-all group"
              >
                <service.icon className="w-10 h-10 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-zinc-400">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-black mb-2">500+</div>
              <div className="text-amber-900">Dossiers traités</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mb-2">98%</div>
              <div className="text-amber-900">Taux de succès</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mb-2">24/7</div>
              <div className="text-amber-900">Disponibilité</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-black mb-2">100%</div>
              <div className="text-amber-900">Confidentialité</div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section id="expertise" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Expertise &
                <span className="text-amber-500"> Discrétion</span>
              </h2>
              <p className="text-zinc-400 mb-8">
                Notre équipe d'experts combine des décennies d'expérience dans les domaines 
                du renseignement, de la cybersécurité et de l'investigation privée.
              </p>
              
              <div className="space-y-4">
                {[
                  "Équipe d'anciens professionnels du renseignement",
                  "Méthodologie éprouvée et adaptable",
                  "Confidentialité absolue garantie",
                  "Technologies de pointe",
                  "Réseau international de partenaires"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6">Restez informé</h3>
              <p className="text-zinc-400 mb-6">
                Recevez nos analyses et conseils en matière de sécurité.
              </p>
              
              {subscribed ? (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-green-400">
                  ✓ Merci ! Vous êtes inscrit à notre newsletter.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Votre email"
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                  >
                    S'inscrire
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Contact</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Discutons de vos besoins en toute confidentialité.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
              <Mail className="w-8 h-8 text-amber-500 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Email</h3>
              <p className="text-zinc-400">contact@blackraven.fr</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
              <Phone className="w-8 h-8 text-amber-500 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Téléphone</h3>
              <p className="text-zinc-400">Sur rendez-vous</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
              <MapPin className="w-8 h-8 text-amber-500 mx-auto mb-4" />
              <h3 className="font-bold mb-2">Siège</h3>
              <p className="text-zinc-400">Paris, France</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/removal-190.png" alt="BlackRaven" className="w-8 h-8 object-contain" />
              <span className="font-bold">BLACKRAVEN</span>
            </div>
            <p className="text-zinc-500 text-sm">
              © 2024 BlackRaven Intelligence. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
