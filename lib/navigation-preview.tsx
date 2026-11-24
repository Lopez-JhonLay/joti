import { createContext, useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';

type NavigationPreview = {
  isLoading: boolean;
  isPreview: boolean;
  enterPreview: () => void;
  exitPreview: () => void;
};

const NavigationPreviewContext = createContext<NavigationPreview | null>(null);

// Development-only design harness, separate from the real Convex Auth session.
// Preview grants no identity, persistence, or backend access.
export function NavigationPreviewProvider({ children }: PropsWithChildren) {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <NavigationPreviewContext.Provider
      value={{
        isLoading: false,
        isPreview: __DEV__ && isPreview,
        enterPreview: () => {
          if (__DEV__) setIsPreview(true);
        },
        exitPreview: () => setIsPreview(false),
      }}
    >
      {children}
    </NavigationPreviewContext.Provider>
  );
}

export function useNavigationPreview() {
  const context = useContext(NavigationPreviewContext);
  if (!context) {
    throw new Error('useNavigationPreview requires NavigationPreviewProvider');
  }
  return context;
}
