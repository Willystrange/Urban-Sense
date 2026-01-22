import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, LayoutDashboard, Info, LogOut, Menu, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Accueil', path: '/', icon: Info },
    { name: 'Bornes', path: '/map', icon: MapPin },
    ...(isAuthenticated ? [{ name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <nav className="fixed top-0 w-full bg-urbansense-background/80 backdrop-blur-md border-b border-urbansense-border-dim z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        
        {/* Logo Simplifié */}
        <Link to="/" className="flex items-center gap-2 group z-50 relative">
          <div className="w-8 h-8 bg-urbansense-accent rounded-md flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <MapPin size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">UrbanSense</span>
        </Link>

        {/* Navigation Centrale - Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "text-white bg-urbansense-surface-1" 
                    : "text-urbansense-secondary hover:text-white hover:bg-urbansense-surface-0"
                )}
              >
                <Icon size={16} className={cn("transition-colors", isActive ? "text-urbansense-accent" : "text-urbansense-tertiary group-hover:text-white")} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Droite : Auth & Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-urbansense-border-dim">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-white leading-none mb-1">
                    {user.firstName}
                  </span>
                  <span className="text-[10px] text-urbansense-secondary uppercase tracking-wider font-bold">
                    Compte
                  </span>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 rounded-md text-urbansense-secondary hover:text-red-400 hover:bg-urbansense-surface-1 transition-colors"
                  title="Se déconnecter"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-urbansense-secondary hover:text-white transition-colors">
                  Connexion
                </Link>
                <Link to="/register" className="btn btn-primary h-9 px-4 text-sm font-semibold rounded-md shadow-sm">
                  S'inscrire
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2 z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 w-full bg-urbansense-surface-0 border-b border-urbansense-border-dim shadow-2xl md:hidden flex flex-col p-4 gap-2"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200",
                    isActive 
                      ? "text-white bg-urbansense-surface-1 border border-urbansense-border-dim" 
                      : "text-urbansense-secondary hover:text-white hover:bg-urbansense-surface-1"
                  )}
                >
                  <Icon size={20} className={cn("transition-colors", isActive ? "text-urbansense-accent" : "text-urbansense-tertiary")} />
                  {item.name}
                </Link>
              );
            })}
            
            <div className="h-px bg-urbansense-border-dim my-2" />
            
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 text-white">
                  <div className="w-8 h-8 rounded-full bg-urbansense-surface-2 flex items-center justify-center font-bold text-xs">
                    {user.firstName.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-urbansense-secondary">Connecté</span>
                  </div>
                </div>
                <button 
                  onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-urbansense-surface-1 transition-all"
                >
                  <LogOut size={20} />
                  Se déconnecter
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center h-10 rounded-lg border border-urbansense-border-light text-urbansense-secondary hover:text-white font-medium text-sm"
                >
                  Connexion
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center h-10 rounded-lg bg-urbansense-accent text-white font-medium text-sm hover:bg-urbansense-accent-hover"
                >
                  Inscription
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;