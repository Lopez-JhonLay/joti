import { useEffect, useState } from 'react';
import { useConvexConnectionState, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { requestErrorMessage } from '@/lib/request-errors';

export function useGeneralProject(companyId?: Id<'companies'>) {
  const general = useQuery(
    api.projects.general,
    companyId ? { companyId } : 'skip',
  );
  const ensure = useMutation(api.projects.ensureGeneral);
  const { isWebSocketConnected } = useConvexConnectionState();
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{
    companyId: Id<'companies'>;
    attempt: number;
    message: string;
  } | null>(null);
  useEffect(() => {
    if (!companyId || general !== null || !isWebSocketConnected) return;
    let active = true;
    void ensure({ companyId }).catch((cause: unknown) => {
      if (active)
        setFailure({ companyId, attempt, message: requestErrorMessage(cause) });
    });
    return () => {
      active = false;
    };
  }, [companyId, general, ensure, isWebSocketConnected, attempt]);
  return {
    general,
    error:
      failure && failure.companyId === companyId && failure.attempt === attempt
        ? failure.message
        : null,
    connected: isWebSocketConnected,
    retry: () => setAttempt((value) => value + 1),
  };
}
