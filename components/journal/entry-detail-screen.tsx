import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAuthSession } from '@/lib/auth-session';
import { useNavigationPreview } from '@/lib/navigation-preview';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { ScreenFrame } from '@/components/ui/screen-frame';
import { Typography } from '@/components/ui/typography';
import { StatusBadge } from '@/components/ui/status-badge';

function back() {
  if (router.canGoBack()) router.back();
  else router.replace('/entries');
}
function PrivateDetail({
  entryId,
}: {
  entryId: Id<'entries'>;
  completed?: boolean;
}) {
  const result = useQuery(api.entries.get, { entryId });
  if (result === undefined)
    return (
      <ScreenFrame title="Entry" onBack={back}>
        <Feedback loading message="Loading entry…" />
      </ScreenFrame>
    );
  if (!result)
    return (
      <ScreenFrame title="Entry" onBack={back}>
        <Feedback message="This entry is unavailable or in Trash." />
      </ScreenFrame>
    );
  const { entry, company, project } = result;
  const sections = [
    ['What I did', entry.whatIDid],
    ['Who it helped', entry.whoItHelped],
    ['Company impact', entry.companyImpact],
    ['Impact categories', entry.impactCategories.join(', ')],
    [
      'Impact status',
      entry.impactStatus === 'not_measurable'
        ? 'Not measurable'
        : entry.impactStatus === 'known'
          ? 'Known'
          : 'Pending',
    ],
    ['Impact metrics', entry.impactMetrics],
    ['Notes and praise', entry.notesAndPraise],
  ];
  return (
    <ScreenFrame
      title="Entry"
      onBack={back}
      actions={
        <View className="items-end gap-1">
          <StatusBadge
            label={entry.status === 'draft' ? 'Draft' : 'Completed'}
            accessibilityLabel={`Entry status: ${entry.status === 'draft' ? 'Draft' : 'Completed'}`}
            tone={entry.status === 'completed' ? 'success' : 'neutral'}
          />
        </View>
      }
    >
      <Typography variant="heading">
        {entry.task || 'Untitled draft'}
      </Typography>
      <Typography>Date: {entry.date || 'Not set'}</Typography>
      <Typography>Company: {company.name}</Typography>
      <Typography>
        Project: {project.name}
        {project.status === 'archived' ? ' (archived)' : ''}
      </Typography>
      {sections.map(([label, value]) => (
        <View key={label} className="gap-2 border-t border-border pt-4">
          <Typography variant="title">{label}</Typography>
          <Typography>{value || 'Not recorded'}</Typography>
        </View>
      ))}
      <Button
        title={entry.status === 'draft' ? 'Resume draft' : 'Edit entry'}
        icon="pencil"
        className="w-full"
        onPress={() => router.push(`/entry/${entryId}/edit`)}
      />
    </ScreenFrame>
  );
}
export function EntryDetailScreen(props: {
  entryId: Id<'entries'>;
  completed?: boolean;
}) {
  const { isAuthenticated } = useAuthSession();
  const { isPreview } = useNavigationPreview();
  return (
    <QueryBoundary title="Entry" onBack={back}>
      {isAuthenticated && !isPreview ? (
        <PrivateDetail {...props} />
      ) : (
        <ScreenFrame title="Entry" onBack={back}>
          <Feedback message="Sign in to view private entries." />
        </ScreenFrame>
      )}
    </QueryBoundary>
  );
}
