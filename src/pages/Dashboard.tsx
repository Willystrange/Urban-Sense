import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreditCard, MapPin, Settings, User, Bell, ChevronRight, CheckCircle2, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [nfcOrdered, setNfcOrdered] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Style flottant et moderne */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="lg:sticky lg:top-28 space-y-4 lg:space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-urbansense-accent to-purple-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                   <User size={24} className="text-white" />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-white text-lg leading-tight">{user.firstName}</h2>
                <span className="text-xs font-medium text-urbansense-secondary bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Membre Premium</span>
              </div>
            </div>

            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {[ 
                { id: 'overview', icon: User, label: 'Vue d\'ensemble' },
                { id: 'nfc', icon: CreditCard, label: 'Ma Carte NFC' },
                { id: 'places', icon: MapPin, label: 'Lieux Favoris' },
                { id: 'notifications', icon: Bell, label: 'Notifications', badge: 2 },
                { id: 'settings', icon: Settings, label: 'Paramètres' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={clsx(
                    "flex items-center justify-between p-3 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden shrink-0",
                    activeTab === item.id 
                      ? "text-white bg-white/5 border border-white/10 shadow-lg shadow-black/20" 
                      : "text-urbansense-secondary hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <item.icon size={20} className={activeTab === item.id ? "text-urbansense-accent" : "text-zinc-500 group-hover:text-zinc-300"} />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="ml-3 w-5 h-5 flex items-center justify-center bg-urbansense-accent text-white text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-urbansense-accent rounded-l-xl" />
                  )}
                </button>
              ))}
            </nav>

            <div className="hidden lg:block p-4 rounded-2xl bg-gradient-to-br from-urbansense-surface-1 to-urbansense-surface-0 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 bg-urbansense-accent/10 blur-3xl rounded-full" />
              <h3 className="text-white font-bold mb-1 relative z-10">Besoin d\'aide ?</h3>
              <p className="text-xs text-urbansense-secondary mb-3 relative z-10">Contactez le support technique disponible 24/7.</p>
              <button className="text-xs font-bold text-urbansense-accent hover:text-white transition-colors relative z-10 flex items-center gap-1">
                Contacter le support <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <header className="flex justify-between items-end pb-6 border-b border-white/5">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Tableau de bord</h1>
              <p className="text-urbansense-secondary">Gérez vos activités et préférences UrbanSense.</p>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-sm text-urbansense-tertiary">Dernière connexion</div>
              <div className="text-white font-mono text-sm">Aujourd\'hui, 14:30</div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* NFC Card Section - Enhanced visual */}
            <section className="col-span-1 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="text-urbansense-accent" size={20} />
                  Carte Physique
                </h2>
                <span className="text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 font-medium">Active</span>
              </div>
              
              {/* Carte Réaliste */}
              <div className="relative aspect-[1.58/1] w-full bg-[#0a0a0a] rounded-2xl p-6 text-white shadow-2xl overflow-hidden group border border-white/10 transition-transform hover:scale-[1.02] duration-500">
                {/* Texture de fond */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-black to-zinc-900" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-colors" />
                
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">UrbanSense</span>
                      <span className="font-bold text-2xl tracking-tight text-white mt-1">Pass</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center">
                       <Shield size={20} className="text-white/80" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-6 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded flex overflow-hidden relative">
                         <div className="absolute inset-0 bg-black/10 grid grid-cols-4 gap-0.5">
                            <div className="border-r border-black/20" />
                            <div className="border-r border-black/20" />
                            <div className="border-r border-black/20" />
                         </div>
                      </div>
                      <div className="text-lg font-mono tracking-widest text-white/90 shadow-black drop-shadow-md">•••• 4242</div>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-white/10 pt-4">
                      <div>
                        <div className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider mb-0.5">Titulaire</div>
                        <div className="text-sm font-bold uppercase text-white tracking-wide">{user.firstName} {user.lastName}</div>
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono">EXP 12/28</div>
                    </div>
                  </div>
                </div>
              </div>

              {!nfcOrdered ? (
                <div className="p-5 rounded-xl bg-urbansense-surface-1 border border-urbansense-border-mid hover:border-urbansense-border-light transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-urbansense-accent/10 rounded-lg flex items-center justify-center text-urbansense-accent border border-urbansense-accent/20 group-hover:scale-110 transition-transform">
                      <CreditCard size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm mb-1">Carte physique supplémentaire</h3>
                      <p className="text-xs text-urbansense-secondary mb-3 leading-relaxed">Commandez une carte de secours ou pour un membre de la famille.</p>
                      <button 
                        onClick={() => setNfcOrdered(true)}
                        className="text-xs font-bold text-white bg-urbansense-accent hover:bg-urbansense-accent-hover px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
                      >
                        Commander (Gratuit)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4"
                >
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-400 text-sm">Commande confirmée</h3>
                    <p className="text-xs text-emerald-500/60">Livraison estimée : 3 jours</p>
                  </div>
                </motion.div>
              )}
            </section>

            {/* Usual Places Section */}
            <section className="col-span-1 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="text-urbansense-accent" size={20} />
                  Lieux Favoris
                </h2>
                <button className="text-xs font-medium text-urbansense-secondary hover:text-white transition-colors">Gérer</button>
              </div>
              
              <div className="space-y-3">
                {user.usualPlaces.length > 0 ? (
                  user.usualPlaces.map((place, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-urbansense-surface-1 rounded-xl border border-white/5 hover:border-urbansense-accent/30 hover:bg-urbansense-surface-2 transition-all group cursor-pointer relative overflow-hidden">
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                      
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-urbansense-surface-0 rounded-lg flex items-center justify-center text-zinc-500 group-hover:text-urbansense-accent group-hover:scale-110 transition-all border border-white/5 shadow-inner">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-200 group-hover:text-white transition-colors text-sm">{place.label}</h3>
                          <p className="text-xs text-urbansense-tertiary group-hover:text-urbansense-secondary transition-colors">{place.address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         <div className="hidden group-hover:flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                            <Clock size={10} /> 12 min
                         </div>
                         <ChevronRight className="text-zinc-600 group-hover:text-white transition-colors" size={16} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-sm text-urbansense-secondary">Aucun lieu favori enregistré.</p>
                  </div>
                )}
                
                <button className="w-full py-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 hover:bg-white/5 transition-all text-sm font-medium flex items-center justify-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">+</div>
                  Ajouter une nouvelle destination
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
