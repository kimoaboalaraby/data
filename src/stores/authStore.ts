import { create } from 'zustand';
import { User } from '../types';

// Mock users for demo purposes
const MOCK_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'مدير النظام',
    role: 'admin' as const,
  },
  {
    id: '2',
    username: 'designer',
    password: 'design123',
    name: 'أحمد المصمم',
    role: 'employee' as const,
    specialization: 'design',
    warningCount: 0,
  },
  {
    id: '3',
    username: 'writer',
    password: 'write123',
    name: 'سارة الكاتبة',
    role: 'employee' as const,
    specialization: 'content',
    warningCount: 2,
  }
];

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  
  initialize: () => {
    // In a real app, we would check for a stored token/session
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({ user, isAuthenticated: true, isLoading: false });
      } catch (error) {
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
  
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const user = MOCK_USERS.find(u => 
      u.username === username && u.password === password
    );
    
    if (user) {
      // Remove password before storing
      const { password: _, ...safeUser } = user;
      localStorage.setItem('user', JSON.stringify(safeUser));
      set({ user: safeUser, isAuthenticated: true, isLoading: false });
      return true;
    } else {
      set({ 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة', 
        isLoading: false 
      });
      return false;
    }
  },
  
  logout: () => {
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  }
}));