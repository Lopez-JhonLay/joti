import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { Typography } from '@/components/ui/typography';
import { ROW_INSET_STYLE } from '@/components/ui/layout';
export function EntryList({
  draftsOnly = false,
  projectId,
}: {
  draftsOnly?: boolean;
  projectId?: Id<'projects'>;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.entries.list,
    { draftsOnly, projectId },
    { initialNumItems: 5 },
  );
  return (
    <>
      {status === 'LoadingFirstPage' ? (
        <Feedback loading message="Loading entries…" />
      ) : results.length === 0 ? (
        <Feedback
          message={
            projectId
              ? 'No entries in this project yet.'
              : draftsOnly
                ? 'No unfinished drafts.'
                : 'Every little achievement counts. Add your first entry.'
          }
        />
      ) : (
        results.map((entry) => (
          <Pressable
            key={entry._id}
            style={ROW_INSET_STYLE}
            accessibilityRole="button"
            accessibilityLabel={`${entry.task || 'Untitled draft'}, ${entry.status}`}
            onPress={() =>
              router.push(
                entry.status === 'draft'
                  ? `/entry/${entry._id}/edit`
                  : `/entry/${entry._id}`,
              )
            }
            className="min-h-touch flex-row items-center gap-3 border-b border-border py-4 active:bg-elevated"
          >
            {({ pressed }) => (
              <>
                <View className="flex-1 gap-1">
                  <Typography variant="label">
                    {entry.task || 'Untitled draft'}
                  </Typography>
                  <Typography variant="caption">
                    {entry.date || 'No work date'} ·{' '}
                    {entry.status === 'draft' ? 'Draft' : 'Completed'}
                  </Typography>
                </View>
                <AnimatedIcon name="chevron-right" active={pressed} />
              </>
            )}
          </Pressable>
        ))
      )}
      {status === 'CanLoadMore' && (
        <Button
          title="Load More"
          className="w-full"
          variant="secondary"
          onPress={() => loadMore(3)}
        />
      )}
      {status === 'LoadingMore' && (
        <Feedback loading message="Loading more entries…" />
      )}
    </>
  );
}
