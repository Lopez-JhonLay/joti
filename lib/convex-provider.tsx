import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { createContext, useContext, type PropsWithChildren } from 'react';

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
        <ConvexProvider client={client}>{children}</ConvexProvider>
      ) : (
        children
      )}
    </BackendConfiguredContext.Provider>
  );
}
