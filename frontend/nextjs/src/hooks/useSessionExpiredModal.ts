import { create } from "zustand";

interface SessionExpiredModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const useSessionExpiredModal = create<SessionExpiredModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export default useSessionExpiredModal;
