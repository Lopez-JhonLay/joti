import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@convex-dev/auth/react';

export const secureStorage: TokenStorage = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fail closed if the OS cannot unlock/read storage. Never restore an
      // unverified in-memory identity or crash auth initialization.
      return null;
    }
  },
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};
