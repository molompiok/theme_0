// api/stores/ModalAuthStore.ts
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

type AuthModalView = 'login' | 'register' | 'forgot-password' | null;

interface ModalAuthState {
  currentView: AuthModalView;
  isOpen: boolean;
  // Tu peux ajouter des données à passer au modal si besoin
  // مثلاً, l'email pré-rempli pour le reset de mot de passe
  initialEmail?: string; 
}

const initialModalAuthState: ModalAuthState = {
  currentView: null,
  isOpen: false,
  initialEmail: undefined,
};

export const useModalAuthStore = create(
  combine(initialModalAuthState, (set) => ({
    openModal: (view: AuthModalView = 'login', initialEmail?: string) => {
      console.log({view});
      
      set({ isOpen: true, currentView: view, initialEmail });
    },
    closeModal: () => {
      set({ isOpen: false, currentView: null, initialEmail: undefined });
    },
    switchToView: (view: AuthModalView) => {
      set({ currentView: view });
    },
    reset: () => {
      set(initialModalAuthState);
    }
  }))
);