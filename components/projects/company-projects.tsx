import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { Typography } from '@/components/ui/typography';
import { useTheme } from '@/lib/theme';
import { useGeneralProject } from '@/hooks/use-general-project';
import { ROW_INSET_STYLE } from '@/components/ui/layout';
import {
  ProjectStatusSelector,
  type ProjectFilter,
} from './project-status-selector';

function ProjectRow({ project }: { project: Doc<'projects'> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View project ${project.name}`}
      style={ROW_INSET_STYLE}
      accessibilityHint={`${project.isGeneral ? 'Built in' : project.status === 'active' ? 'Active' : 'Archived'}. Opens project details.`}
      onPress={() =>
        router.push({
          pathname: '/project/[projectId]',
          params: { projectId: project._id },
        })
      }
      className="min-h-touch flex-row items-center gap-3 border-b border-border py-4 active:bg-elevated"
    >
      {({ pressed }) => (
        <>
          <View className="flex-1 gap-1">
            <Typography className="font-semibold">{project.name}</Typography>
            <Typography variant="caption">
              {project.isGeneral
                ? 'Built in'
                : project.status === 'active'
                  ? 'Active'
                  : 'Archived'}
            </Typography>
          </View>
          <AnimatedIcon name="chevron-right" size={20} active={pressed} />
        </>
      )}
    </Pressable>
  );
}

export function CompanyProjects({ companyId }: { companyId: Id<'companies'> }) {
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const { general, error, connected, retry } = useGeneralProject(companyId);
  const { results, status, loadMore } = usePaginatedQuery(
    api.projects.list,
    {
      companyId,
      status: filter === 'all' ? undefined : filter,
      namedOnly: true,
    },
    { initialNumItems: 20 },
  );
  const { colors } = useTheme();
  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <Typography variant="title" accessibilityRole="header">
          Projects
        </Typography>
        <Button
          title="Add project"
          icon="plus"
          onPress={() =>
            router.push({
              pathname: '/company/[companyId]/project/new',
              params: { companyId },
            })
          }
        />
      </View>
      <ProjectStatusSelector value={filter} onChange={setFilter} includeAll />
      <View className="border-t border-border">
        {filter !== 'archived' &&
          (general ? (
            <ProjectRow project={general} />
          ) : general === undefined ? (
            <Feedback loading message="Loading General / Adhoc…" />
          ) : error ? (
            <View className="gap-3 py-4">
              <Feedback error message={error} />
              <Button
                title="Retry category setup"
                variant="secondary"
                disabled={!connected}
                onPress={retry}
              />
            </View>
          ) : (
            <Feedback
              message={
                connected
                  ? 'Preparing General / Adhoc…'
                  : 'Reconnect to prepare General / Adhoc.'
              }
            />
          ))}
        {status === 'LoadingFirstPage' ? (
          <Feedback loading message="Loading projects…" />
        ) : (
          results.map((project) => (
            <ProjectRow key={project._id} project={project} />
          ))
        )}
      </View>
      {status !== 'LoadingFirstPage' && results.length === 0 && (
        <Typography className="py-6 text-center text-muted">
          {filter === 'all'
            ? 'No named projects yet.'
            : filter === 'active'
              ? 'No active named projects.'
              : 'No archived projects.'}
        </Typography>
      )}
      {status === 'CanLoadMore' && (
        <Button
          title="Load more projects"
          variant="secondary"
          onPress={() => loadMore(20)}
        />
      )}
      {status === 'LoadingMore' && (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Loading more projects"
        />
      )}
    </View>
  );
}
