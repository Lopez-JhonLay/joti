import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { useAuthSession } from '@/lib/auth-session';
import { useNavigationPreview } from '@/lib/navigation-preview';

import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { ScreenFrame } from '@/components/ui/screen-frame';
import { EntryList } from './entry-list';

export function EntriesScreen() {
  const [draftsOnly, setDraftsOnly] = useState(false);
  const { isAuthenticated } = useAuthSession();
  const { isPreview } = useNavigationPreview();
  return (
    <QueryBoundary title="Entries" onBack={() => router.replace('/')}>
      <ScreenFrame
        title="Entries"
        onBack={() => router.replace('/')}
        actions={
          <Button
            title="Add Entry"
            icon="plus"
            onPress={() => router.push('/add-entry')}
          />
        }
      >
        {isAuthenticated && !isPreview ? (
          <>
            <View className="flex-row gap-3">
              <Button
                title="All entries"
                variant={draftsOnly ? 'secondary' : 'primary'}
                onPress={() => setDraftsOnly(false)}
              />
              <Button
                title="Drafts"
                variant={draftsOnly ? 'primary' : 'secondary'}
                onPress={() => setDraftsOnly(true)}
              />
            </View>
            <EntryList key={String(draftsOnly)} draftsOnly={draftsOnly} />
          </>
        ) : (
          <Feedback message="Sign in to view private entries and drafts." />
        )}
      </ScreenFrame>
    </QueryBoundary>
  );
}
