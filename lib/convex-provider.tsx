import { ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { createContext, useContext, type PropsWithChildren } from 'react';
import { api } from '@/convex/_generated/api';
import { secureStorage } from './secure-storage';

const url = process.env.EXPO_PUBLIC_CONVEX_URL;
const client = url
  ? new ConvexReactClient(url, { unsavedChangesWarning: false })
  : null;
const BackendConfiguredContext = createContext(false);

export function useBackendConfigured() {
  return useContext(BackendConfiguredContext);
}

export function BackendProvider({ children }: PropsWithChildren) {
  return (
    <BackendConfiguredContext.Provider value={client !== null}>
      {client ? (
        <ConvexAuthProvider
          client={client}
          api={api.auth}
          storage={secureStorage}
          ambientSignIns={[]}
        >
          {children}
        </ConvexAuthProvider>
      ) : (
        children
      )}
    </BackendConfiguredContext.Provider>
  );
}
