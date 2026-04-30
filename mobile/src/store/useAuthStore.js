import { create } from 'zustand';
import { disconnectSocket } from '../services/SocketService';

/**
 * Global Auth Store
 * Manages the authentication state and onboarding status.
 */
// شرح كل وظائف بالعربي
// isFirstTime: true, // true = onboarding, false = login

const useAuthStore = create((set) => ({
  isFirstTime: true,// اول مرة يفتح التطبيق
  isAuthenticated: false,// هل المستخدم مسجل
  user: null,
  token: null,
  technicianProfile: null,

  // Actions
  completeOnboarding: () => set({ isFirstTime: false }),
  setAuth: (token, user, technicianProfile = null) => 
    set({ isAuthenticated: true, user, token, technicianProfile }),
  
  updateUser: (updatedUser) => 
    set((state) => ({ user: { ...state.user, ...updatedUser } })),
  
  logout: () => {
    disconnectSocket();
    set({ isAuthenticated: false, user: null, token: null, technicianProfile: null });
  },
}));

export default useAuthStore;
