import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import {
  useConvexConnectionState,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { useAuthSession } from '@/lib/auth-session';
import { useNavigationPreview } from '@/lib/navigation-preview';
import { useTheme } from '@/lib/theme';
import { requestErrorMessage } from '@/lib/request-errors';
import { companyInitials, employmentDates } from '@/lib/company-presentation';
import { layout } from '@/constants/design-tokens';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { QueryBoundary } from '@/components/ui/query-boundary';
import { Feedback } from '@/components/ui/feedback';
import { CompanyForm } from './company-form';
import { CompanyProjects } from '@/components/projects/company-projects';
import { ScreenFrame } from '@/components/ui/screen-frame';

type CompanyScreenProps =
  | { mode: 'list' }
  | { mode: 'create' }
  | { mode: 'detail' | 'edit'; companyId: string };

function companyLocation(companyId: Id<'companies'>) {
  return { pathname: '/company/[companyId]' as const, params: { companyId } };
}

function backToCompanies() {
  if (router.canGoBack()) router.back();
  else router.replace('/companies');
}

function ConnectionNotice() {
  const { isWebSocketConnected } = useConvexConnectionState();
  return isWebSocketConnected ? null : (
    <Feedback message="Connecting… Check your internet connection. Displayed information may be out of date." />
  );
}

export function CompanyScreen(props: CompanyScreenProps) {
  const { isPreview } = useNavigationPreview();
  const { isAuthenticated } = useAuthSession();
  const title = {
    list: 'Companies',
    create: 'Add company',
    detail: 'Company',
    edit: 'Edit company',
  }[props.mode];
  const onBack = props.mode === 'list' ? undefined : backToCompanies;
  if (isPreview || !isAuthenticated)
    return (
      <ScreenFrame title={title} onBack={onBack}>
        <Feedback message="Sign in to manage your companies. Design preview does not access private records." />
      </ScreenFrame>
    );
  return (
    <QueryBoundary
      title={title}
      onBack={onBack}
      key={
        'companyId' in props ? `${props.mode}-${props.companyId}` : props.mode
      }
    >
      {props.mode === 'list' ? (
        <ScreenFrame title={title}>
          <ConnectionNotice />
          <CompanyList />
        </ScreenFrame>
      ) : props.mode === 'create' ? (
        <ScreenFrame title={title} onBack={onBack}>
          <ConnectionNotice />
          <CreateCompany />
        </ScreenFrame>
      ) : props.companyId ? (
        <ExistingCompany
          companyId={props.companyId as Id<'companies'>}
          mode={props.mode}
        />
      ) : (
        <ScreenFrame title={title} onBack={onBack}>
          <Feedback error message="This company is unavailable." />
        </ScreenFrame>
      )}
    </QueryBoundary>
  );
}

function CompanyAvatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  return (
    <View
      className={`${large ? 'h-16 w-16' : 'h-12 w-12'} shrink-0 items-center justify-center rounded-card bg-elevated`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Typography variant={large ? 'title' : 'label'} className="text-link">
        {companyInitials(name)}
      </Typography>
    </View>
  );
}

function CompanyEmpty() {
  return (
    <View className="flex-1 gap-6">
      <Divider />
      <View className="items-center gap-6 py-12">
        <Image
          source={require('@/assets/mascot/joti-2d/joti-organize.png')}
          style={{
            width: layout.spacing[16] * 3,
            height: layout.spacing[16] * 3,
          }}
          resizeMode="contain"
          accessible={false}
        />
        <Typography
          variant="title"
          accessibilityRole="header"
          className="text-center"
        >
          Add your first company.
        </Typography>
        <Button
          title="Add company"
          icon="plus"
          className="self-center"
          onPress={() => router.push('/company/new')}
        />
      </View>
    </View>
  );
}

function CompanyList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.companies.list,
    {},
    { initialNumItems: 20 },
  );
  const { colors } = useTheme();
  if (status === 'LoadingFirstPage')
    return <Feedback loading message="Loading your companies…" />;
  if (results.length === 0) return <CompanyEmpty />;
  return (
    <View className="gap-6">
      <Button
        title="Add company"
        icon="plus"
        onPress={() => router.push('/company/new')}
      />
      <View className="border-t border-border">
        {results.map((company) => (
          <Pressable
            key={company._id}
            accessibilityRole="button"
            accessibilityLabel={`View ${company.name}`}
            accessibilityHint="Opens company details."
            onPress={() => router.push(companyLocation(company._id))}
            className="min-h-touch flex-row items-center gap-4 border-b border-border py-4 active:bg-elevated"
          >
            {({ pressed }) => (
              <>
                <CompanyAvatar name={company.name} />
                <View className="flex-1 gap-1">
                  <Typography className="font-semibold">
                    {company.name}
                  </Typography>
                  {!!company.jobTitle && (
                    <Typography className="text-muted">
                      {company.jobTitle}
                    </Typography>
                  )}
                  <Typography variant="caption">
                    {employmentDates(company)}
                  </Typography>
                </View>
                <AnimatedIcon name="chevron-right" size={20} active={pressed} />
              </>
            )}
          </Pressable>
        ))}
      </View>
      {status === 'CanLoadMore' && (
        <Button
          title="Load more companies"
          variant="secondary"
          onPress={() => loadMore(20)}
        />
      )}
      {status === 'LoadingMore' && (
        <ActivityIndicator
          accessibilityLabel="Loading more companies"
          color={colors.primary}
        />
      )}
    </View>
  );
}

function CreateCompany() {
  const create = useMutation(api.companies.create);
  return (
    <CompanyForm
      onSave={(values) => create(values)}
      onSaved={(id) => router.replace(companyLocation(id))}
    />
  );
}

function ExistingCompany({
  companyId,
  mode,
}: {
  companyId: Id<'companies'>;
  mode: 'detail' | 'edit';
}) {
  const company = useQuery(api.companies.get, { companyId });
  const update = useMutation(api.companies.update);
  const title = mode === 'edit' ? 'Edit company' : (company?.name ?? 'Company');
  if (company && mode === 'detail') return <CompanyDetails company={company} />;
  return (
    <ScreenFrame title={title} onBack={backToCompanies}>
      <ConnectionNotice />
      {company === undefined ? (
        <Feedback loading message="Loading company…" />
      ) : company === null ? (
        <View className="gap-4">
          <Feedback message="This company is unavailable. It may have been deleted." />
          <Button
            title="Back to companies"
            variant="secondary"
            onPress={() => router.replace('/companies')}
          />
        </View>
      ) : (
        <CompanyForm
          key={company._id}
          initialValues={company}
          submitLabel="Save changes"
          onSave={async (values) => {
            await update({ companyId, ...values });
            return companyId;
          }}
          onSaved={(id) => router.dismissTo(companyLocation(id))}
        />
      )}
    </ScreenFrame>
  );
}

function CompanyDetails({ company }: { company: Doc<'companies'> }) {
  const remove = useMutation(api.companies.remove);
  const { isWebSocketConnected } = useConvexConnectionState();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  async function deleteCompany() {
    if (pending.current) return;
    pending.current = true;
    setDeleting(true);
    setError(null);
    try {
      await remove({ companyId: company._id });
      router.dismissTo('/companies');
    } catch (cause) {
      setError(requestErrorMessage(cause));
    } finally {
      pending.current = false;
      setDeleting(false);
    }
  }

  return (
    <ScreenFrame
      title={company.name}
      onBack={backToCompanies}
      actions={
        <>
          <Button
            title="Edit company"
            icon="pencil"
            iconOnly
            variant="secondary"
            disabled={deleting}
            onPress={() =>
              router.push({
                pathname: '/company/[companyId]/edit',
                params: { companyId: company._id },
              })
            }
          />
          <Button
            title="Delete company"
            icon="trash-2"
            iconOnly
            variant="secondary"
            disabled={deleting || !isWebSocketConnected}
            loading={deleting}
            onPress={() =>
              Alert.alert(
                'Delete company?',
                `This permanently deletes ${company.name}. Companies with named projects or saved work cannot be deleted.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => void deleteCompany(),
                  },
                ],
              )
            }
          />
        </>
      }
    >
      <View className="flex-row items-center gap-4">
        <CompanyAvatar name={company.name} large />
        <View className="flex-1 gap-1">
          <Typography>{company.jobTitle ?? 'Job title not added'}</Typography>
          <Typography variant="caption">{employmentDates(company)}</Typography>
        </View>
      </View>
      <Divider />
      {error && <Feedback error message={error} />}
      {deleting && <Feedback message="Deleting company…" />}
      <CompanyProjects companyId={company._id} />
    </ScreenFrame>
  );
}
