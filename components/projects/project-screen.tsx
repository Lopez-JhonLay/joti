import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useConvexConnectionState, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useAuthSession } from '@/lib/auth-session';
import { useNavigationPreview } from '@/lib/navigation-preview';
import { useTheme } from '@/lib/theme';
import { requestErrorMessage } from '@/lib/request-errors';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { Divider, ROW_INSET_STYLE } from '@/components/ui/layout';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { ScreenFrame } from '@/components/ui/screen-frame';
import { Typography } from '@/components/ui/typography';
import { StatusBadge } from '@/components/ui/status-badge';
import { EntryList } from '@/components/journal/entry-list';
import { ProjectArchiveSheet } from './project-archive-sheet';
import { ProjectForm } from './project-form';

type ProjectScreenProps =
  | { mode: 'create'; companyId: string }
  | { mode: 'detail' | 'edit'; projectId: string };

export function projectLocation(projectId: Id<'projects'>) {
  return { pathname: '/project/[projectId]' as const, params: { projectId } };
}

function backFromProject(companyId?: Id<'companies'>) {
  if (router.canGoBack()) router.back();
  else if (companyId)
    router.replace({ pathname: '/company/[companyId]', params: { companyId } });
  else router.replace('/companies');
}

function ConnectionNotice() {
  const { isWebSocketConnected } = useConvexConnectionState();
  return isWebSocketConnected ? null : (
    <Feedback message="Connecting… Check your internet connection. Displayed information may be out of date." />
  );
}

export function ProjectScreen(props: ProjectScreenProps) {
  const { isPreview } = useNavigationPreview();
  const { isAuthenticated } = useAuthSession();
  const title =
    props.mode === 'create'
      ? 'Add project'
      : props.mode === 'edit'
        ? 'Edit project'
        : 'Project';
  if (isPreview || !isAuthenticated)
    return (
      <ScreenFrame title={title} onBack={() => backFromProject()}>
        <Feedback message="Sign in to manage projects. Design preview does not access private records." />
      </ScreenFrame>
    );
  return (
    <QueryBoundary
      title={title}
      onBack={() => backFromProject()}
      key={
        props.mode === 'create'
          ? `create-${props.companyId}`
          : `${props.mode}-${props.projectId}`
      }
    >
      {props.mode === 'create' ? (
        <CreateProject companyId={props.companyId as Id<'companies'>} />
      ) : (
        <ExistingProject
          projectId={props.projectId as Id<'projects'>}
          mode={props.mode}
        />
      )}
    </QueryBoundary>
  );
}

function CreateProject({ companyId }: { companyId: Id<'companies'> }) {
  const company = useQuery(api.companies.get, { companyId });
  const create = useMutation(api.projects.create);
  return (
    <ScreenFrame title="Add project" onBack={() => backFromProject(companyId)}>
      <ConnectionNotice />
      {company === undefined ? (
        <Feedback loading message="Loading company…" />
      ) : company === null ? (
        <Feedback message="This company is unavailable. It may have been deleted." />
      ) : (
        <ProjectForm
          companyName={company.name}
          onSave={({ name, description }) =>
            create({ companyId, name, description })
          }
          onSaved={(id) => router.replace(projectLocation(id))}
        />
      )}
    </ScreenFrame>
  );
}

function ExistingProject({
  projectId,
  mode,
}: {
  projectId: Id<'projects'>;
  mode: 'detail' | 'edit';
}) {
  const result = useQuery(api.projects.get, { projectId });
  const update = useMutation(api.projects.update);
  if (result) {
    if (mode === 'detail')
      return (
        <ProjectDetails project={result.project} company={result.company} />
      );
    return (
      <ScreenFrame
        title="Edit project"
        onBack={() => backFromProject(result.company._id)}
      >
        <ConnectionNotice />
        {result.project.isGeneral ? (
          <Feedback message="The built-in category cannot be edited or archived." />
        ) : (
          <ProjectForm
            key={projectId}
            companyName={result.company.name}
            initialValues={result.project}
            onSave={async (values) => {
              await update({ projectId, ...values });
              return projectId;
            }}
            onSaved={(id) => router.dismissTo(projectLocation(id))}
          />
        )}
      </ScreenFrame>
    );
  }
  return (
    <ScreenFrame
      title={mode === 'edit' ? 'Edit project' : 'Project'}
      onBack={() => backFromProject()}
    >
      <ConnectionNotice />
      {result === undefined ? (
        <Feedback loading message="Loading project…" />
      ) : (
        <>
          <Feedback message="This project is unavailable. It may have been removed." />
          <Button
            title="Back to companies"
            variant="secondary"
            onPress={() => router.replace('/companies')}
          />
        </>
      )}
    </ScreenFrame>
  );
}

function ProjectDetails({
  project,
  company,
}: {
  project: Doc<'projects'>;
  company: Doc<'companies'>;
}) {
  const setStatus = useMutation(api.projects.setStatus);
  const { isWebSocketConnected } = useConvexConnectionState();
  const { colors } = useTheme();
  const [targetStatus, setTargetStatus] = useState<
    Doc<'projects'>['status'] | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const archived = project.status === 'archived';
  async function changeStatus() {
    if (pending.current || !targetStatus) return;
    if (!isWebSocketConnected) {
      setError('You’re offline. Reconnect before changing project status.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await setStatus({ projectId: project._id, status: targetStatus });
      setTargetStatus(null);
    } catch (cause) {
      setError(requestErrorMessage(cause));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <ScreenFrame
      title={project.name}
      onBack={() => backFromProject(company._id)}
      actions={
        <StatusBadge
          label={
            project.isGeneral ? 'Built in' : archived ? 'Archived' : 'Active'
          }
          tone={archived ? 'neutral' : 'info'}
        />
      }
    >
      <ConnectionNotice />
      <View className="gap-3">
        <Typography variant="label">{company.name}</Typography>
        <Typography>
          {project.description ?? 'No description added.'}
        </Typography>
      </View>
      <Divider />
      <View className="gap-3">
        <Typography variant="title">Entries</Typography>
        <EntryList key={project._id} projectId={project._id} />
      </View>
      {busy && <Feedback message="Updating project…" />}
      {error && !targetStatus && <Feedback error message={error} />}
      {!project.isGeneral && (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit project"
            style={ROW_INSET_STYLE}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() =>
              router.push({
                pathname: '/project/[projectId]/edit',
                params: { projectId: project._id },
              })
            }
            className={`min-h-touch flex-row items-center gap-3 border-b border-border py-3 active:bg-elevated ${busy ? 'opacity-50' : ''}`}
          >
            {({ pressed }) => (
              <>
                <AnimatedIcon name="pencil" active={pressed} />
                <Typography className="flex-1">Edit project</Typography>
                <AnimatedIcon name="chevron-right" size={20} active={pressed} />
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              archived ? 'Restore project' : 'Archive project'
            }
            style={ROW_INSET_STYLE}
            accessibilityState={{
              disabled: busy || !isWebSocketConnected,
              busy,
            }}
            disabled={busy || !isWebSocketConnected}
            onPress={() => {
              setError(null);
              setTargetStatus(archived ? 'active' : 'archived');
            }}
            className={`min-h-touch flex-row items-center gap-3 border-b border-border py-3 active:bg-elevated ${busy || !isWebSocketConnected ? 'opacity-50' : ''}`}
          >
            {({ pressed }) => (
              <>
                {busy ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <AnimatedIcon name="archive" active={pressed} />
                )}
                <View className="flex-1 gap-1">
                  <Typography>
                    {archived ? 'Restore project' : 'Archive project'}
                  </Typography>
                  <Typography variant="caption">
                    {archived
                      ? 'Move back to Active'
                      : 'Preserves your work history'}
                  </Typography>
                </View>
                <AnimatedIcon name="chevron-right" size={20} active={pressed} />
              </>
            )}
          </Pressable>
        </View>
      )}
      <ProjectArchiveSheet
        visible={targetStatus !== null}
        restoring={targetStatus === 'active'}
        name={project.name}
        busy={busy}
        error={error}
        onCancel={() => setTargetStatus(null)}
        onConfirm={() => void changeStatus()}
      />
    </ScreenFrame>
  );
}
