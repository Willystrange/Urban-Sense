export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  type: 'personal' | 'family';
  usualPlaces: { id: number; label: string; address: string }[];
}

// Clés de stockage
const USERS_KEY = 'urbansense_users';
const SESSION_KEY = 'urbansense_session';

// Générateur d'ID compatible tout navigateur
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const authService = {
  // Simule une inscription
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

  // Simule une connexion
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
