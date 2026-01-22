import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error: authError, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Erreur gérée par le contexte
    }
  };

  return (
    <main className="pt-24 px-4 max-w-md mx-auto h-[calc(100vh-100px)] flex flex-col justify-center">
      <div className="card max-w-sm mx-auto p-8">
        <header className="mb-8 text-center">
          <div className="w-12 h-12 bg-urbansense-accent/10 text-urbansense-accent rounded-full flex items-center justify-center mx-auto mb-4 border border-urbansense-accent/20">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white">Bon retour !</h1>
          <p className="text-urbansense-secondary">Connectez-vous à votre espace UrbanSense.</p>
        </header>

        {authError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-fade-in">
            <AlertCircle size={20} className="shrink-0" />
            <p>{authError}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-urbansense-secondary">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
              <input 
                type="email" id="email" className="input-field pl-10" placeholder="vous@exemple.com" 
                value={email} onChange={(e) => setEmail(e.target.value)} required 
              />
            </div>
          </div>
          
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

          <button type="submit" disabled={isLoading} className="btn btn-primary w-full h-12 text-lg mt-4">
            {isLoading ? <Loader2 className="animate-spin" /> : <>Se connecter <ArrowRight size={20} /></>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-urbansense-border-dim text-center text-sm text-urbansense-secondary">
          Pas encore de compte ? <a href="/register" className="text-urbansense-accent font-bold hover:text-white transition-colors">S'inscrire</a>
        </div>
      </div>
    </main>
  );
};

export default Login;
