import { create } from "zustand";
import { persist } from 'zustand/middleware';
import type { User } from "@/types";

type AuthState = {
  user: User | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;
};

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage', // 存到 localStorage 的 key
      partialize: (state) => ({ user: state.user, token: state.token }), // 只保存这两个字段
    }
  )
);

export default useAuthStore;