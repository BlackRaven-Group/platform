import { ArrowLeft, Shield, FileText, Lock, AlertTriangle } from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
}

export default function LegalPage({ onBack }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button onClick={onBack} className="terminal-button flex items-center space-x-2 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>RETOUR</span>
        </button>

        <div className="terminal-box mb-6">
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-zinc-800">
            <FileText className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-white">MENTIONS LÉGALES</h1>
          </div>

          <div className="space-y-8 text-sm">
            {/* Éditeur */}
            <section>
              <h2 className="text-xl font-bold text-amber-600 mb-4">1. ÉDITEUR DU SITE</h2>
              <div className="text-zinc-300 space-y-2">
                <p><strong>Dénomination :</strong> BlackRaven Intelligence Platform</p>
                <p><strong>Nature :</strong> Plateforme d'intelligence et d'investigation OSINT</p>
                <p><strong>Classification :</strong> Service professionnel sécurisé</p>
              </div>
            </section>

            {/* RGPD */}
            <section>
              <h2 className="text-xl font-bold text-amber-600 mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>2. PROTECTION DES DONNÉES PERSONNELLES (RGPD)</span>
              </h2>
              <div className="text-zinc-300 space-y-3">
                <p>
                  <strong>2.1. Responsable du traitement</strong><br />
                  BlackRaven est responsable du traitement des données personnelles collectées via cette plateforme.
                </p>
                <p>
                  <strong>2.2. Données collectées</strong><br />
                  Les données suivantes peuvent être collectées :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Données d'identification (nom, email, organisation)</li>
                  <li>Données de connexion (adresses IP, logs d'accès)</li>
                  <li>Données de communication (messages PGP, tickets)</li>
                  <li>Données d'investigation (dossiers, cibles, notes d'intelligence)</li>
                </ul>
                <p>
                  <strong>2.3. Finalités du traitement</strong><br />
                  Les données sont traitées pour :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Fournir les services d'intelligence et d'investigation</li>
                  <li>Gérer l'authentification et la sécurité des accès</li>
                  <li>Assurer la communication sécurisée avec les clients</li>
                  <li>Respecter les obligations légales et réglementaires</li>
                </ul>
                <p>
                  <strong>2.4. Base légale</strong><br />
                  Le traitement repose sur :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>L'exécution d'un contrat de service</li>
                  <li>Le consentement explicite de l'utilisateur</li>
                  <li>L'intérêt légitime pour la sécurité et la prévention de la fraude</li>
                  <li>Le respect d'obligations légales</li>
                </ul>
                <p>
                  <strong>2.5. Conservation des données</strong><br />
                  Les données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, 
                  conformément aux obligations légales et aux besoins opérationnels de sécurité.
                </p>
                <p>
                  <strong>2.6. Vos droits</strong><br />
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Droit d'accès :</strong> Vous pouvez demander l'accès à vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> Vous pouvez corriger vos données inexactes</li>
                  <li><strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de vos données</li>
                  <li><strong>Droit à la portabilité :</strong> Vous pouvez récupérer vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition :</strong> Vous pouvez vous opposer au traitement de vos données</li>
                  <li><strong>Droit à la limitation :</strong> Vous pouvez demander la limitation du traitement</li>
                </ul>
                <p>
                  Pour exercer ces droits, contactez-nous via les canaux sécurisés prévus sur la plateforme.
                </p>
                <p>
                  <strong>2.7. Sécurité des données</strong><br />
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Chiffrement PGP pour les communications sensibles</li>
                  <li>Authentification multi-facteurs</li>
                  <li>Row Level Security (RLS) au niveau de la base de données</li>
                  <li>Accès restreint et traçabilité des actions</li>
                  <li>Audits de sécurité réguliers</li>
                </ul>
                <p>
                  <strong>2.8. Transferts internationaux</strong><br />
                  Les données peuvent être hébergées dans l'Union Européenne ou dans des pays offrant un niveau de protection 
                  adéquat reconnu par la Commission Européenne.
                </p>
              </div>
            </section>

            {/* Déresponsabilisation */}
            <section>
              <h2 className="text-xl font-bold text-amber-600 mb-4 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>3. LIMITATION DE RESPONSABILITÉ</span>
              </h2>
              <div className="text-zinc-300 space-y-3">
                <p>
                  <strong>3.1. Nature des services</strong><br />
                  BlackRaven fournit une plateforme d'intelligence et d'investigation OSINT. Les informations et données 
                  présentées sont issues de sources publiques et de bases de données de fuites de données.
                </p>
                <p>
                  <strong>3.2. Exactitude des données</strong><br />
                  Bien que nous nous efforcions de fournir des informations précises, nous ne garantissons pas l'exactitude, 
                  la complétude ou l'actualité des données collectées. Les utilisateurs doivent vérifier et valider 
                  indépendamment toute information avant de l'utiliser.
                </p>
                <p>
                  <strong>3.3. Utilisation des données</strong><br />
                  L'utilisation des données et informations fournies par la plateforme relève de la seule responsabilité de l'utilisateur. 
                  BlackRaven ne peut être tenu responsable :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Des décisions prises sur la base des informations fournies</li>
                  <li>De l'utilisation illégale ou non autorisée des données</li>
                  <li>Des dommages directs ou indirects résultant de l'utilisation de la plateforme</li>
                  <li>Des pertes de données dues à des erreurs utilisateur ou des actions malveillantes</li>
                  <li>Des interruptions de service ou des dysfonctionnements techniques</li>
                </ul>
                <p>
                  <strong>3.4. Conformité légale</strong><br />
                  Il est de la responsabilité de l'utilisateur de s'assurer que son utilisation de la plateforme et des données 
                  collectées est conforme à la législation applicable dans sa juridiction, notamment :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Les lois sur la protection des données personnelles (RGPD, CCPA, etc.)</li>
                  <li>Les lois sur la cybersécurité et la protection de la vie privée</li>
                  <li>Les réglementations sectorielles applicables</li>
                  <li>Les lois pénales relatives à la collecte et au traitement de données</li>
                </ul>
                <p>
                  <strong>3.5. Limitation de garantie</strong><br />
                  La plateforme est fournie "en l'état" sans garantie d'aucune sorte, expresse ou implicite, concernant :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>La disponibilité continue du service</li>
                  <li>L'absence d'erreurs ou de bugs</li>
                  <li>La sécurité absolue des données</li>
                  <li>L'adéquation à un usage particulier</li>
                </ul>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section>
              <h2 className="text-xl font-bold text-amber-600 mb-4">4. PROPRIÉTÉ INTELLECTUELLE</h2>
              <div className="text-zinc-300 space-y-3">
                <p>
                  La plateforme BlackRaven, son code source, son design, ses logos et marques sont la propriété exclusive 
                  de BlackRaven. Toute reproduction, distribution ou utilisation non autorisée est strictement interdite.
                </p>
                <p>
                  Les données collectées via les services OSINT restent la propriété de leurs sources respectives. 
                  L'utilisateur n'acquiert aucun droit de propriété sur ces données.
                </p>
              </div>
            </section>

            {/* Utilisation */}
            <section>
              <h2 className="text-xl font-bold text-amber-600 mb-4">5. CONDITIONS D'UTILISATION</h2>
              <div className="text-zinc-300 space-y-3">
                <p>
                  <strong>5.1. Utilisation autorisée</strong><br />
                  La plateforme est destinée à un usage professionnel et légitime d'investigation et d'intelligence. 
                  Toute utilisation à des fins illégales, frauduleuses ou malveillantes est strictement interdite.
                </p>
                <p>
                  <strong>5.2. Obligations de l'utilisateur</strong><br />
                  L'utilisateur s'engage à :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Utiliser la plateforme conformément à la législation applicable</li>
                  <li>Respecter les droits de tiers et la vie privée</li>
                  <li>Maintenir la confidentialité de ses identifiants d'accès</li>
                  <li>Ne pas tenter de contourner les mesures de sécurité</li>
                  <li>Ne pas utiliser la plateforme pour des activités illégales</li>
                </ul>
                <p>
                  <strong>5.3. Suspension et résiliation</strong><br />
                  BlackRaven se réserve le droit de suspendre ou résilier l'accès à tout utilisateur en cas de :
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Violation des conditions d'utilisation</li>
                  <li>Utilisation frauduleuse ou malveillante</li>
                  <li>Non-respect des obligations légales</li>
                  <li>Comportement préjudiciable à la sécurité de la plateforme</li>
                </ul>
              </div>
            </section>

            {/* Confidentialité */}
            <section>
              <h2 className="text-xl font-bold text-amber-600 mb-4 flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>6. CONFIDENTIALITÉ ET SÉCURITÉ</h2>
              </div>
              <div className="text-zinc-300 space-y-3">
                <p>
                  Toutes les communications et données transitant par la plateforme sont traitées avec le plus grand soin. 
                  Nous mettons en œuvre des mesures de sécurité avancées, mais aucune transmission de données sur Internet 
                  ne peut être garantie comme étant 100% sécurisée.
                </p>
                <p>
                  En cas de violation de données susceptible d'affecter vos informations personnelles, nous vous en informerons 
                  dans les meilleurs délais conformément aux obligations légales.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-bold text-amber-600 mb-4">7. CONTACT</h2>
              <div className="text-zinc-300 space-y-3">
                <p>
                  Pour toute question concernant ces mentions légales, l'exercice de vos droits RGPD, ou pour signaler 
                  un problème, veuillez utiliser les canaux de communication sécurisés prévus sur la plateforme.
                </p>
                <p className="text-xs text-zinc-500">
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
