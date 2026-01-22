import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Users, MapPin, Calendar, Mail, Plus, Trash2, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddressAutocomplete from '../components/AddressAutocomplete';

type AccountType = 'personal' | 'family';

const Register = () => {
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [usualPlaces, setUsualPlaces] = useState([{ id: 1, label: '', address: '' }]);
  
  // Champs du formulaire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mainAddress, setMainAddress] = useState('');
  
  const { register, error: authError, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const addPlace = () => {
    setUsualPlaces([...usualPlaces, { id: Date.now(), label: '', address: '' }]);
  };

  const removePlace = (id: number) => {
    setUsualPlaces(usualPlaces.filter(p => p.id !== id));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation de base
    if (password !== confirmPassword) {
      setFormError("Les mots de passe ne correspondent pas.");
      return;
    }
    
    if (password.length < 6) {
      setFormError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    try {
      await register({
        firstName,
        lastName,
        email,
        age: parseInt(age),
        password,
        type: accountType,
        usualPlaces: usualPlaces
          .filter(p => p.label && p.address) // On ne garde que les lieux remplis
          .map(p => ({
            id: p.id,
            label: p.label,
            address: p.address
          }))
      });
      navigate('/dashboard');
    } catch (err) {
      // L'erreur est gérée par le contexte
    }
  };

  return (
    <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
      <div className="card shadow-xl p-8 border border-urbansense-border-dim">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Rejoignez UrbanSense</h1>
          <p className="text-urbansense-secondary">Créez votre compte pour accéder aux services personnalisés.</p>
        </header>

        {(formError || authError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <p>{formError || authError}</p>
          </div>
        )}

        <form className="space-y-8" onSubmit={handleRegister}>
          {/* Type de compte */}
          <div role="radiogroup" className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setAccountType('personal')}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                accountType === 'personal' 
                  ? 'border-urbansense-accent bg-urbansense-accent/10' 
                  : 'border-urbansense-border-dim bg-urbansense-surface-0 hover:border-zinc-600'
              }`}
            >
              <User className={accountType === 'personal' ? 'text-urbansense-accent' : 'text-zinc-500'} size={32} />
              <span className={`mt-2 font-semibold ${accountType === 'personal' ? 'text-urbansense-accent' : 'text-zinc-400'}`}>Personnel</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('family')}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                accountType === 'family' 
                  ? 'border-urbansense-accent bg-urbansense-accent/10' 
                  : 'border-urbansense-border-dim bg-urbansense-surface-0 hover:border-zinc-600'
              }`}
            >
              <Users className={accountType === 'family' ? 'text-urbansense-accent' : 'text-zinc-500'} size={32} />
              <span className={`mt-2 font-semibold ${accountType === 'family' ? 'text-urbansense-accent' : 'text-zinc-400'}`}>Famille</span>
            </button>
          </div>

          {/* Identité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="firstname" className="text-sm font-semibold text-urbansense-secondary">Prénom</label>
              <input 
                type="text" id="firstname" className="input-field" placeholder="Jean" 
                value={firstName} onChange={(e) => setFirstName(e.target.value)} required 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastname" className="text-sm font-semibold text-urbansense-secondary">Nom</label>
              <input 
                type="text" id="lastname" className="input-field" placeholder="Dupont" 
                value={lastName} onChange={(e) => setLastName(e.target.value)} required 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="age" className="text-sm font-semibold text-urbansense-secondary">Âge</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input 
                  type="number" id="age" className="input-field pl-10" placeholder="25" min="5" max="120"
                  value={age} onChange={(e) => setAge(e.target.value)} required 
                />
              </div>
              <p className="text-xs text-zinc-500">Nécessaire pour le calcul d'itinéraires adaptés.</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-urbansense-secondary">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input 
                  type="email" id="email" className="input-field pl-10" placeholder="jean@exemple.com" 
                  value={email} onChange={(e) => setEmail(e.target.value)} required 
                />
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-urbansense-surface-0 rounded-xl border border-urbansense-border-dim">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-urbansense-secondary">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input 
                  type="password" id="password" className="input-field pl-10" placeholder="••••••••" 
                  value={password} onChange={(e) => setPassword(e.target.value)} required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold text-urbansense-secondary">Confirmer</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
                <input 
                  type="password" id="confirmPassword" className="input-field pl-10" placeholder="••••••••" 
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-urbansense-secondary">Adresse principale</label>
            <AddressAutocomplete 
              value={mainAddress}
              onChange={setMainAddress}
              placeholder="123 Rue de la Paix, 75000 Paris"
            />
          </div>

          {/* Lieux habituels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin size={20} className="text-urbansense-accent" />
                Lieux habituels (Optionnel)
              </h2>
              <button type="button" onClick={addPlace} className="text-sm text-urbansense-accent font-medium flex items-center gap-1 hover:text-white transition-colors">
                <Plus size={16} /> Ajouter
              </button>
            </div>
            
            <AnimatePresence>
              {usualPlaces.map((place, index) => (
                <motion.div 
                  key={place.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-3 items-end bg-urbansense-surface-0 p-4 rounded-lg border border-urbansense-border-dim"
                >
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Nom (ex: Sport)</label>
                    <input 
                      type="text" className="input-field bg-urbansense-surface-1" placeholder="Travail"
                      value={place.label}
                      onChange={(e) => {
                        const newPlaces = [...usualPlaces];
                        newPlaces[index].label = e.target.value;
                        setUsualPlaces(newPlaces);
                      }}
                    />
                  </div>
                  <div className="flex-[2] space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Adresse</label>
                    <AddressAutocomplete 
                      value={place.address}
                      onChange={(val) => {
                        const newPlaces = [...usualPlaces];
                        newPlaces[index].address = val;
                        setUsualPlaces(newPlaces);
                      }}
                      placeholder="Adresse..."
                      className="bg-urbansense-surface-1"
                    />
                  </div>
                  {usualPlaces.length > 1 && (
                    <button 
                      type="button" onClick={() => removePlace(place.id)}
                      className="p-3 text-urbansense-error hover:bg-urbansense-error/10 rounded-lg transition-colors mb-[1px]"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="pt-6 border-t border-urbansense-border-dim flex flex-col gap-4">
            <button type="submit" disabled={isLoading} className="btn btn-primary w-full h-12 text-lg">
              {isLoading ? <Loader2 className="animate-spin" /> : `Créer mon compte ${accountType === 'family' ? 'Famille' : 'Personnel'}`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default Register;