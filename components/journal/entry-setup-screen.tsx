import { router } from 'expo-router';
import { useAuthSession } from '@/lib/auth-session';
import { useNavigationPreview } from '@/lib/navigation-preview';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { ScreenFrame } from '@/components/ui/screen-frame';
import { Typography } from '@/components/ui/typography';
import { EntryOrganizationSelector } from './entry-organization-selector';

function closeEntry() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function EntrySetupScreen() {
  const { isAuthenticated } = useAuthSession();
  const { isPreview } = useNavigationPreview();
  return (
    <QueryBoundary title="Add Entry" onBack={closeEntry}>
      <ScreenFrame
        title="Add Entry"
        actions={
          <Button
            title="Close"
            icon="x"
            iconOnly
            variant="secondary"
            onPress={closeEntry}
          />
        }
      >
        {isAuthenticated && !isPreview ? (
          <>
            <Typography>Choose where this work belongs.</Typography>
            <EntryOrganizationSelector />
            <Feedback message="Entry details and saving aren’t available yet. These selections are temporary." />
          </>
        ) : (
          <Feedback message="Sign in to choose a company and category. Design preview does not access private records." />
        )}
      </ScreenFrame>
    </QueryBoundary>
  );
}
