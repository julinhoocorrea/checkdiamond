import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Mock users para autenticação
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Julio Correa',
    email: 'juliocorrea@check2.com.br',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=julio'
  },
  {
    id: '2',
    name: 'João Revendedor',
    email: 'joao@revendedor.com',
    role: 'revendedor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao'
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulação de autenticação
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const user = mockUsers.find(u => u.email === email);

        // Credenciais específicas para cada usuário
        const validCredentials =
          (email === 'juliocorrea@check2.com.br' && password === 'Ju113007?') ||
          (email === 'joao@revendedor.com' && password === '123456');

        if (user && validCredentials) {
          set({ user, isAuthenticated: true });
          return true;
        }

        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
