import { create } from "zustand";
import { UserSchema, decodeUser } from "./models/User";

type Store = {
  user: UserSchema | null;
  isHistoryPageTab: boolean;
  transactionPageTab: {
    isTransactionsTab: boolean;
    message: string;
    isSuccess: boolean;
    toDisplay: boolean;
  };
  setUser: (data: UserSchema) => void;
  removeSession: () => void;
  setHistoryPageTab: (isHistoryTab: boolean) => void;
  setTransactionPageTab: (data: {
    isTransactionsTab: boolean;
    message: string;
    isSuccess: boolean;
    toDisplay: boolean;
  }) => void;
};

const user = localStorage.getItem("user");

export const useStore = create<Store>(
  (set): Store => ({
    user: user ? decodeUser(JSON.parse(user)) : null,
    isHistoryPageTab: false,
    transactionPageTab: {
      isTransactionsTab: false,
      message: "",
      isSuccess: false,
      toDisplay: false,
    },
    setUser: (data: UserSchema) => set((state) => ({ ...state, user: data })),
    removeSession: () => {
      localStorage.removeItem("user");
      set((state) => ({ ...state, user: null }));
    },
    setHistoryPageTab: (isHistoryTab: boolean) =>
      set((state) => ({ ...state, isHistoryPageTab: isHistoryTab })),
    setTransactionPageTab: (data: {
      isTransactionsTab: boolean;
      message: string;
      isSuccess: boolean;
      toDisplay: boolean;
    }) => set((state) => ({ ...state, transactionPageTab: data })),
  })
);
