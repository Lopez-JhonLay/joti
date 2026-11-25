import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { usePaginatedQuery, useQuery } from 'convex/react';
import { router } from 'expo-router';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useGeneralProject } from '@/hooks/use-general-project';
import { useTheme } from '@/lib/theme';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Button } from '@/components/ui/button';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { Feedback } from '@/components/ui/feedback';
import { Typography } from '@/components/ui/typography';

export type EntryOrganization = {
  companyId: Id<'companies'>;
  projectId: Id<'projects'>;
};

function SelectionField({
  label,
  value,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View className="gap-2">
      <Typography variant="label">{label}</Typography>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value }}
        accessibilityHint="Opens available choices."
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        className={`form-input flex-row items-center justify-between gap-3 border-border active:bg-elevated ${disabled ? 'opacity-50' : ''}`}
      >
        {({ pressed }) => (
          <>
            <Typography className="shrink">{value}</Typography>
            <AnimatedIcon name="chevron-right" size={20} active={pressed} />
          </>
        )}
      </Pressable>
    </View>
  );
}

function ChoiceRow({
  label,
  detail,
  checked,
  onPress,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      accessibilityHint={detail}
      onPress={onPress}
      className={`min-h-touch flex-row items-center gap-3 border-b border-border py-4 ${checked ? 'bg-elevated' : 'active:bg-elevated'}`}
    >
      <View className="flex-1 gap-1">
        <Typography className="font-semibold">{label}</Typography>
        {detail && <Typography variant="caption">{detail}</Typography>}
      </View>
      {checked && (
        <Typography variant="caption" className="text-link">
          Selected
        </Typography>
      )}
    </Pressable>
  );
}

function CompanyChoices({
  selectedId,
  onSelect,
  onAdd,
}: {
  selectedId?: Id<'companies'>;
  onSelect: (companyId: Id<'companies'>) => void;
  onAdd: () => void;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.companies.list,
    {},
    { initialNumItems: 20 },
  );
  const { colors } = useTheme();
  return (
    <>
      {status === 'LoadingFirstPage' ? (
        <Feedback loading message="Loading companies…" />
      ) : results.length === 0 ? (
        <View className="gap-3">
          <Typography>Add a company before choosing a category.</Typography>
          <Button title="Add company" icon="plus" onPress={onAdd} />
        </View>
      ) : (
        results.map((company) => (
          <ChoiceRow
            key={company._id}
            label={company.name}
            detail={company.jobTitle}
            checked={company._id === selectedId}
            onPress={() => onSelect(company._id)}
          />
        ))
      )}
      {status === 'CanLoadMore' && (
        <Button
          title="Load more companies"
          variant="secondary"
          onPress={() => loadMore(20)}
        />
      )}
      {status === 'LoadingMore' && (
        <ActivityIndicator
          color={colors.primary}
          accessibilityLabel="Loading more companies"
        />
      )}
    </>
  );
}

function ProjectChoices({
  companyId,
  general,
  selectedId,
  onSelect,
}: {
  companyId: Id<'companies'>;
  general: Doc<'projects'>;
  selectedId?: Id<'projects'>;
  onSelect: (projectId: Id<'projects'>) => void;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.projects.list,
    { companyId, status: 'active', namedOnly: true },
    { initialNumItems: 20 },
  );
  const { colors } = useTheme();
  return (
    <>
      <ChoiceRow
        label={general.name}
        detail="Built in · Work without a named project"
        checked={selectedId === general._id}
        onPress={() => onSelect(general._id)}
      />
      {status === 'LoadingFirstPage' ? (
        <Feedback loading message="Loading projects…" />
      ) : (
        results.map((project) => (
          <ChoiceRow
            key={project._id}
            label={project.name}
            detail="Named project"
            checked={selectedId === project._id}
            onPress={() => onSelect(project._id)}
          />
        ))
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
    </>
  );
}

export function EntryOrganizationSelector({
  onChange,
}: {
  onChange?: (selection: EntryOrganization | null) => void;
}) {
  const [companyId, setCompanyId] = useState<Id<'companies'> | undefined>();
  const [projectId, setProjectId] = useState<Id<'projects'> | undefined>();
  const [sheet, setSheet] = useState<'company' | 'project' | null>(null);
  const company = useQuery(
    api.companies.get,
    companyId ? { companyId } : 'skip',
  );
  const { general, error, connected, retry } = useGeneralProject(company?._id);
  const requestedProject = useQuery(
    api.projects.get,
    company && projectId ? { projectId } : 'skip',
  );
  const waitingForProject = !!projectId && requestedProject === undefined;
  const requestedAvailable =
    requestedProject?.project.status === 'active' &&
    requestedProject.project.companyId === company?._id;
  const selection =
    company && !waitingForProject
      ? requestedAvailable
        ? requestedProject.project
        : general
      : null;
  const selectedCompanyId = company?._id;
  const selectedProjectId = selection?._id;
  useEffect(() => {
    onChange?.(
      selectedCompanyId && selectedProjectId
        ? { companyId: selectedCompanyId, projectId: selectedProjectId }
        : null,
    );
  }, [selectedCompanyId, selectedProjectId, onChange]);

  return (
    <View className="gap-6">
      <SelectionField
        label="Company"
        value={
          company?.name ??
          (companyId
            ? company === undefined
              ? 'Loading company…'
              : 'Choose another company'
            : 'Select company')
        }
        onPress={() => setSheet('company')}
      />
      {company === null && companyId && (
        <Feedback
          error
          message="This company is unavailable. Choose another company."
        />
      )}
      <SelectionField
        label="Project / category"
        value={
          selection?.name ??
          (waitingForProject
            ? 'Loading project…'
            : company
              ? 'Preparing General / Adhoc…'
              : 'Select a company first')
        }
        disabled={!company || !general || waitingForProject}
        onPress={() => setSheet('project')}
      />
      {company &&
        general === null &&
        (error ? (
          <View className="gap-3">
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
      {projectId &&
        requestedProject !== undefined &&
        !requestedAvailable &&
        selection?.isGeneral && (
          <Feedback message="This project is unavailable. General / Adhoc is selected instead." />
        )}
      {sheet === 'company' && (
        <ChoiceSheet title="Choose company" onClose={() => setSheet(null)}>
          <CompanyChoices
            selectedId={companyId}
            onAdd={() => {
              setSheet(null);
              router.push('/company/new');
            }}
            onSelect={(id) => {
              setCompanyId(id);
              setProjectId(undefined);
              setSheet(null);
            }}
          />
        </ChoiceSheet>
      )}
      {sheet === 'project' && company && general && (
        <ChoiceSheet
          title="Choose project / category"
          onClose={() => setSheet(null)}
        >
          <ProjectChoices
            companyId={company._id}
            general={general}
            selectedId={selection?._id}
            onSelect={(id) => {
              setProjectId(id === general._id ? undefined : id);
              setSheet(null);
            }}
          />
        </ChoiceSheet>
      )}
    </View>
  );
}
