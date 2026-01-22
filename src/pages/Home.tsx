import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, CreditCard, ArrowRight, Check } from 'lucide-react';

const Home = () => {
  return (
    <main className="min-h-screen">
      {/* Hero Section - Plus clean, sans effets de lumière excessifs */}
      <section className="pt-24 pb-12 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto border-b border-urbansense-border-dim">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-urbansense-surface-1 border border-urbansense-border-dim text-urbansense-primary text-xs font-medium tracking-wide">
              <span className="w-2 h-2 rounded-full bg-urbansense-accent"></span>
              Version 2.0 disponible
            </div>
            
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              La ville, <br />
              en toute simplicité.
            </h1>
            
            <p className="text-lg text-urbansense-secondary max-w-lg leading-relaxed">
              Une plateforme unifiée pour vos trajets urbains. Accédez aux bornes, gérez vos itinéraires et connectez-vous à votre ville sans friction.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/register" className="btn btn-primary h-12 px-6">
                Commencer
                <ArrowRight size={18} />
              </Link>
              <Link to="/map" className="btn btn-secondary h-12 px-6">
                Voir la carte
              </Link>
            </div>

            <div className="pt-8 flex items-center gap-8 text-urbansense-tertiary text-sm font-medium">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-urbansense-accent" /> Sans abonnement caché
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-urbansense-accent" /> Données sécurisées
              </div>
            </div>
          </div>

          {/* Visuel Hero - Abstrait et géométrique au lieu de "Sci-fi" */}
          <div className="flex-1 w-full max-w-md md:max-w-full">
            <div className="aspect-square rounded-2xl bg-gradient-to-tr from-urbansense-surface-1 to-urbansense-surface-0 border border-urbansense-border-dim relative p-8 flex flex-col justify-between">
              {/* Abstract Map UI Representation */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-full bg-urbansense-surface-2"></div>
                    <div className="h-2 w-12 rounded-full bg-urbansense-surface-2"></div>
                 </div>
                 <div className="h-32 w-full rounded-xl bg-urbansense-surface-1 border border-urbansense-border-dim"></div>
                 <div className="flex gap-4">
                    <div className="h-24 flex-1 rounded-xl bg-urbansense-surface-1 border border-urbansense-border-dim"></div>
                    <div className="h-24 flex-1 rounded-xl bg-urbansense-surface-1 border border-urbansense-border-dim"></div>
                 </div>
              </div>
              
              <div className="bg-urbansense-accent/10 p-4 rounded-xl border border-urbansense-accent/20">
                <div className="text-urbansense-accent font-semibold mb-1">Trajet optimisé</div>
                <div className="text-sm text-urbansense-secondary">Bus 42 • Arrivée dans 4 min</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Minimaliste */}
      <section className="border-b border-urbansense-border-dim bg-urbansense-surface-0/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Bornes Actives', value: '150+' },
              { label: 'Utilisateurs', value: '12k' },
              { label: 'Villes', value: '3' },
              { label: 'Disponibilité', value: '99.9%' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-urbansense-tertiary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Services connectés</h2>
          <p className="text-urbansense-secondary max-w-2xl">L'écosystème UrbanSense regroupe tous les outils nécessaires pour vivre la ville intelligemment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<CreditCard />}
            title="Pass Unique"
            description="Un seul identifiant pour les transports, les musées et les services municipaux."
          />
          <FeatureCard 
            icon={<Users />}
            title="Comptes Famille"
            description="Centralisez la gestion des abonnements pour toute votre famille."
          />
          <FeatureCard 
            icon={<Shield />}
            title="Sécurité & Urgence"
            description="Ligne directe avec les services de secours géolocalisés."
          />
        </div>
      </section>

      {/* App Preview - Flat Design */}
      <section className="py-24 bg-urbansense-surface-0 border-y border-urbansense-border-dim">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 md:order-1">
             <div className="absolute inset-0 bg-urbansense-accent/20 blur-3xl rounded-full opacity-20"></div>
             <img 
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800" 
                alt="Borne interactive"
                className="relative rounded-lg shadow-2xl border border-urbansense-border-dim grayscale hover:grayscale-0 transition-all duration-700"
              />
          </div>
          
          <div className="order-1 md:order-2 space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              L'interface de la ville.
            </h2>
            <p className="text-urbansense-secondary text-lg leading-relaxed">
              Nos bornes sont conçues pour s'intégrer discrètement dans le paysage urbain tout en offrant une puissance de service inégalée.
            </p>
            <ul className="space-y-4">
              {[
                "Cartographie vectorielle haute définition",
                "Temps réel ultra-précis",
                "Accessibilité universelle"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-urbansense-primary">
                  <div className="h-1.5 w-1.5 rounded-full bg-urbansense-accent"></div>
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-4">
              <Link to="/map" className="text-urbansense-primary border-b border-urbansense-primary/30 hover:border-urbansense-primary pb-0.5 transition-colors">
                En savoir plus sur le déploiement
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-6 rounded-lg bg-urbansense-surface-0 border border-urbansense-border-dim hover:border-urbansense-border-light transition-colors">
    <div className="w-10 h-10 rounded-md bg-urbansense-surface-1 flex items-center justify-center text-urbansense-primary mb-4">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-urbansense-secondary text-sm leading-relaxed">{description}</p>
  </div>
);

export default Home;