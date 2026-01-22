import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// --- DEFINITIONS LOCALES (Fusionnées pour éviter l'erreur d'import) ---

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  type: 'personal' | 'family';
  usualPlaces: { id: number; label: string; address: string }[];
}

const USERS_KEY = 'urbansense_users';
const SESSION_KEY = 'urbansense_session';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const authService = {
  async register(userData: Omit<User, 'id'> & { password: string }): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
            const usersStr = localStorage.getItem(USERS_KEY);
            const users = usersStr ? JSON.parse(usersStr) : [];
            
            if (users.find((u: any) => u.email === userData.email)) {
              reject(new Error("Cet email est déjà utilisé."));
              return;
            }

            const newUser = {
              ...userData,
              id: generateId(),
              password: userData.password 
            };

            users.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            
            const { password, ...userWithoutPassword } = newUser;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
            
            resolve(userWithoutPassword as User);
        } catch (e) {
            reject(new Error("Erreur de stockage local"));
        }
      }, 800);
    });
  },

  async login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
            const usersStr = localStorage.getItem(USERS_KEY);
            const users = usersStr ? JSON.parse(usersStr) : [];
            const user = users.find((u: any) => u.email === email && u.password === password);

            if (!user) {
              reject(new Error("Email ou mot de passe incorrect."));
              return;
            }

            const { password: _, ...userWithoutPassword } = user;
            localStorage.setItem(SESSION_KEY, JSON.stringify(userWithoutPassword));
            resolve(userWithoutPassword as User);
        } catch (e) {
            reject(new Error("Erreur de connexion"));
        }
      }, 600);
    });
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
  }
};

// --- FIN DEFINITIONS ---

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = () => {
        try {
            const currentUser = authService.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
            }
        } catch (e) {
            console.error("Erreur init auth", e);
        } finally {
            setIsLoading(false);
        }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.register(data);
      setUser(newUser);
    } catch (err: any) {
      setError(err.message || "Erreur d'inscription");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
        authService.logout();
        setUser(null);
    } catch(e) {
        console.error("Erreur logout", e);
    }
  };

  if (isLoading && !user && !error) {
      return (
        <div className="min-h-screen bg-urbansense-background flex items-center justify-center">
          <div className="text-urbansense-accent animate-pulse font-bold tracking-widest uppercase text-sm">
            UrbanSense
          </div>
        </div>
      );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!user,
      isLoading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};