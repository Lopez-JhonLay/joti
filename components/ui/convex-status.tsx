import { useConvex, useConvexConnectionState } from 'convex/react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api } from '@/convex/_generated/api';
import { useBackendConfigured } from '@/lib/convex-provider';
import { Button } from './button';
import { Typography } from './typography';

function ConnectionCheck() {
  const client = useConvex();
  const { isWebSocketConnected } = useConvexConnectionState();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    let active = true;
    client.query(api.health.check, {}).then(
      (result) => {
        if (active) setStatus(result.status === 'ok' ? 'ok' : 'error');
      },
      () => {
        if (active) setStatus('error');
      },
    );
    return () => {
      active = false;
    };
  }, [client, attempt]);

  const message =
    status === 'error'
      ? 'Backend check failed. Verify the deployment and try again.'
      : status === 'ok' && isWebSocketConnected
        ? 'Connected to Convex'
        : 'Connecting to Convex… Check your internet connection if this persists.';

  return (
    <View className="gap-3">
      <Typography variant="caption" accessibilityLiveRegion="polite">
        {message}
      </Typography>
      {status === 'error' && (
        <Button
          title="Retry connection"
          variant="secondary"
          onPress={() => {
            setStatus('checking');
            setAttempt((value) => value + 1);
          }}
        />
      )}
    </View>
  );
}

// Render only in development Settings; never imply that preview authenticates a user.
export function ConvexStatus() {
  const configured = useBackendConfigured();
  return (
    <View className="gap-3 rounded-card border border-border p-4">
      <Typography variant="label">Development backend</Typography>
      {configured ? (
        <ConnectionCheck />
      ) : (
        <Typography variant="caption">
          Convex is not configured. Run npm run convex:dev, then restart Expo.
        </Typography>
      )}
    </View>
  );
}
