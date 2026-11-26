import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router, usePreventRemove } from 'expo-router';
import { getFunctionName } from 'convex/server';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProjectScreen } from '@/components/projects/project-screen';
import { CompanyProjects } from '@/components/projects/company-projects';
import { ThemeProvider } from '@/lib/theme';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const companyId = 'company' as Id<'companies'>;
const projectId = 'project' as Id<'projects'>;
const company: Doc<'companies'> = {
  _id: companyId,
  _creationTime: 1,
  userId: 'owner' as Id<'users'>,
  name: 'Acme',
  createdAt: 1,
  updatedAt: 1,
};
const project: Doc<'projects'> = {
  _id: projectId,
  _creationTime: 1,
  userId: company.userId,
  companyId,
  name: 'Atlas',
  description: 'Delivery tools',
  status: 'active',
  isGeneral: false,
  createdAt: 1,
  updatedAt: 1,
};
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockSetStatus = jest.fn();
const mockLoadMore = jest.fn();
let mockEntryResults: Doc<'entries'>[] = [];
let mockEntryStatus: 'Exhausted' | 'CanLoadMore' = 'Exhausted';
let mockPreview = false;
let mockConnected = true;
let mockCompany: Doc<'companies'> | null | undefined;
let mockDetail:
  { project: Doc<'projects'>; company: Doc<'companies'> } | null | undefined;
let mockResults: Doc<'projects'>[] = [];
let mockStatus = 'Exhausted';

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    dismissTo: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  },
  usePreventRemove: jest.fn(),
}));
jest.mock('@/lib/auth-session', () => ({
  useAuthSession: () => ({ isAuthenticated: true }),
}));
jest.mock('@/lib/navigation-preview', () => ({
  useNavigationPreview: () => ({ isPreview: mockPreview }),
}));
jest.mock('convex/react', () => ({
  ...jest.requireActual('convex/react'),
  useConvexConnectionState: () => ({ isWebSocketConnected: mockConnected }),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  usePaginatedQuery: jest.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </SafeAreaProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockPreview = false;
  mockConnected = true;
  mockCompany = company;
  mockDetail = { project, company };
  mockResults = [];
  mockEntryResults = [];
  mockEntryStatus = 'Exhausted';
  mockStatus = 'Exhausted';
  mockCreate.mockReset().mockResolvedValue(projectId);
  mockUpdate.mockReset().mockResolvedValue(null);
  mockSetStatus.mockReset().mockResolvedValue(null);
  jest.mocked(useMutation).mockImplementation((ref) => {
    const name = getFunctionName(ref);
    const mutation =
      name === 'projects:create'
        ? mockCreate
        : name === 'projects:update'
          ? mockUpdate
          : mockSetStatus;
    const result: ReturnType<typeof useMutation> = Object.assign(mutation, {
      withOptimisticUpdate: () => result,
    });
    return result;
  });
  jest.mocked(useQuery).mockImplementation((...args) =>
    getFunctionName(args[0]) === 'companies:get'
      ? mockCompany
      : getFunctionName(args[0]) === 'projects:general'
        ? {
            ...project,
            _id: 'general',
            name: 'General / Adhoc',
            isGeneral: true,
          }
        : mockDetail,
  );
  jest.mocked(usePaginatedQuery).mockImplementation((ref) => ({
    results:
      getFunctionName(ref) === 'entries:list' ? mockEntryResults : mockResults,
    status:
      getFunctionName(ref) === 'entries:list'
        ? mockEntryStatus
        : (mockStatus as 'Exhausted'),
    isLoading: false,
    loadMore: mockLoadMore,
  }));
});
afterEach(() => jest.restoreAllMocks());

test('company projects distinguish loading, empty, filtered, and paginated results', async () => {
  mockStatus = 'LoadingFirstPage';
  const view = await render(<CompanyProjects companyId={companyId} />, {
    wrapper,
  });
  expect(screen.getByText('Loading projects…')).toBeTruthy();
  mockStatus = 'Exhausted';
  await view.rerender(<CompanyProjects companyId={companyId} />);
  expect(screen.getByText('No named projects yet.')).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'View project General / Adhoc' }),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Archived' }));
  expect(screen.getByText('No archived projects.')).toBeTruthy();
  expect(usePaginatedQuery).toHaveBeenLastCalledWith(
    expect.anything(),
    { companyId, status: 'archived', namedOnly: true },
    { initialNumItems: 20 },
  );
  mockResults = [{ ...project, status: 'archived' }];
  mockStatus = 'CanLoadMore';
  await view.rerender(<CompanyProjects companyId={companyId} />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'View project Atlas' }),
  );
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/project/[projectId]',
    params: { projectId },
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Load more projects' }),
  );
  expect(mockLoadMore).toHaveBeenCalledWith(20);
  await fireEvent.press(screen.getByRole('button', { name: 'Add project' }));
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/company/[companyId]/project/new',
    params: { companyId },
  });
});

test('preview mounts no private project data hooks', async () => {
  mockPreview = true;
  await render(<ProjectScreen mode="create" companyId={companyId} />, {
    wrapper,
  });
  expect(
    screen.getByText(/Design preview does not access private records/),
  ).toBeTruthy();
  expect(useQuery).not.toHaveBeenCalled();
  expect(useMutation).not.toHaveBeenCalled();
});

test('creation requires a project name and derives its company from the route', async () => {
  await render(<ProjectScreen mode="create" companyId={companyId} />, {
    wrapper,
  });
  expect(screen.getByText('Acme')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Save project' }));
  expect(await screen.findByText('Enter a project name.')).toBeTruthy();
  expect(mockCreate).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Project name'), ' Atlas ');
  await fireEvent.changeText(
    screen.getByLabelText('Description'),
    ' Delivery tools ',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save project' }));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/project/[projectId]',
      params: { projectId },
    }),
  );
  expect(mockCreate).toHaveBeenCalledWith({
    companyId,
    name: 'Atlas',
    description: 'Delivery tools',
  });
});

test('failed saves retain input and can be retried', async () => {
  mockCreate.mockRejectedValueOnce(new Error('Network failure'));
  await render(<ProjectScreen mode="create" companyId={companyId} />, {
    wrapper,
  });
  await fireEvent.changeText(screen.getByLabelText('Project name'), 'Atlas');
  await fireEvent.press(screen.getByRole('button', { name: 'Save project' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Check your connection/,
  );
  expect(screen.getByLabelText('Project name')).toHaveDisplayValue('Atlas');
  expect(router.replace).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry save' }));
  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(router.replace).toHaveBeenCalled());
});

test('pending saves cannot be submitted twice', async () => {
  let finish: ((id: Id<'projects'>) => void) | undefined;
  mockCreate.mockReturnValue(
    new Promise<Id<'projects'>>((resolve) => {
      finish = resolve;
    }),
  );
  await render(<ProjectScreen mode="create" companyId={companyId} />, {
    wrapper,
  });
  await fireEvent.changeText(screen.getByLabelText('Project name'), 'Atlas');
  await fireEvent.press(screen.getByRole('button', { name: 'Save project' }));
  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Save project' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Save project' }));
  expect(mockCreate).toHaveBeenCalledTimes(1);
  await act(() => finish?.(projectId));
});

test('editing preloads values, clears descriptions, and changes status explicitly', async () => {
  await render(<ProjectScreen mode="edit" projectId={projectId} />, {
    wrapper,
  });
  expect(screen.getByLabelText('Project name')).toHaveDisplayValue('Atlas');
  expect(screen.getByLabelText('Description')).toHaveDisplayValue(
    'Delivery tools',
  );
  await fireEvent.changeText(screen.getByLabelText('Description'), '');
  await fireEvent.press(screen.getByRole('radio', { name: 'Archived' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith({
      projectId,
      name: 'Atlas',
      description: undefined,
      status: 'archived',
    }),
  );
  await waitFor(() =>
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: '/project/[projectId]',
      params: { projectId },
    }),
  );
});

test('archive and restore require confirmation and retain a failed action for retry', async () => {
  mockSetStatus.mockRejectedValueOnce(new Error('Disconnected'));
  const view = await render(
    <ProjectScreen mode="detail" projectId={projectId} />,
    { wrapper },
  );
  expect(screen.queryByRole('button', { name: 'Delete project' })).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Archive project' }),
  );
  expect(screen.getByRole('header', { name: 'Archive project?' })).toBeTruthy();
  expect(mockSetStatus).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
  expect(mockSetStatus).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Archive project' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm archive project' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Check your connection/,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm archive project' }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('header', { name: 'Archive project?' }),
    ).toBeNull(),
  );
  expect(mockSetStatus).toHaveBeenLastCalledWith({
    projectId,
    status: 'archived',
  });
  mockDetail = { project: { ...project, status: 'archived' }, company };
  await view.rerender(<ProjectScreen mode="detail" projectId={projectId} />);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Restore project' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm restore project' }),
  );
  await waitFor(() =>
    expect(mockSetStatus).toHaveBeenLastCalledWith({
      projectId,
      status: 'active',
    }),
  );
});

test('offline forms and archive actions cannot start writes', async () => {
  mockConnected = false;
  const view = await render(
    <ProjectScreen mode="create" companyId={companyId} />,
    { wrapper },
  );
  expect(screen.getByRole('button', { name: 'Save project' })).toBeDisabled();
  expect(mockCreate).not.toHaveBeenCalled();
  await view.rerender(<ProjectScreen mode="detail" projectId={projectId} />);
  expect(
    screen.getByRole('button', { name: 'Archive project' }),
  ).toBeDisabled();
  expect(mockSetStatus).not.toHaveBeenCalled();
});

test('unsaved navigation asks before discarding project changes', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await render(<ProjectScreen mode="create" companyId={companyId} />, {
    wrapper,
  });
  await fireEvent.changeText(screen.getByLabelText('Project name'), 'Atlas');
  const args = jest.mocked(usePreventRemove).mock.calls.at(-1);
  expect(args?.[0]).toBe(true);
  const repeat = jest.fn();
  await act(() =>
    args?.[1]?.({ data: { action: { type: 'GO_BACK' } }, repeat }),
  );
  expect(alert).toHaveBeenCalledWith(
    'Discard changes?',
    expect.any(String),
    expect.any(Array),
  );
  expect(repeat).not.toHaveBeenCalled();
  await act(() =>
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((button) => button.text === 'Discard')
      ?.onPress?.(),
  );
  expect(repeat).toHaveBeenCalledTimes(1);
});

test('missing projects and companies do not mount editable forms', async () => {
  mockCompany = null;
  const view = await render(
    <ProjectScreen mode="create" companyId={companyId} />,
    { wrapper },
  );
  expect(screen.getByText(/This company is unavailable/)).toBeTruthy();
  expect(screen.queryByLabelText('Project name')).toBeNull();
  mockDetail = null;
  await view.rerender(<ProjectScreen mode="detail" projectId={projectId} />);
  expect(screen.getByText(/This project is unavailable/)).toBeTruthy();
});

test('built-in flags prevent editing or archiving through the UI', async () => {
  mockDetail = { project: { ...project, isGeneral: true }, company };
  const view = await render(
    <ProjectScreen mode="detail" projectId={projectId} />,
    { wrapper },
  );
  expect(screen.queryByRole('button', { name: 'Archive project' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit project' })).toBeNull();
  await view.rerender(<ProjectScreen mode="edit" projectId={projectId} />);
  expect(
    screen.getByText('The built-in category cannot be edited or archived.'),
  ).toBeTruthy();
});

test('Adhoc details show saved entries and route drafts back to the editor', async () => {
  mockEntryStatus = 'CanLoadMore';
  mockDetail = {
    project: { ...project, name: 'General / Adhoc', isGeneral: true },
    company,
  };
  const draft: Doc<'entries'> = {
    _id: 'draft-entry' as Id<'entries'>,
    _creationTime: 1,
    userId: company.userId,
    companyId,
    projectId,
    task: 'My Adhoc draft',
    status: 'draft',
    impactStatus: 'pending',
    impactCategories: [],
    revision: 1,
    createdAt: 1,
    updatedAt: 1,
  };
  mockEntryResults = [
    draft,
    {
      ...draft,
      _id: 'completed-entry' as Id<'entries'>,
      task: 'My Adhoc work',
      status: 'completed',
    },
  ];
  await render(<ProjectScreen mode="detail" projectId={projectId} />, {
    wrapper,
  });
  expect(usePaginatedQuery).toHaveBeenCalledWith(
    expect.anything(),
    { projectId, draftsOnly: false },
    { initialNumItems: 5 },
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Load More' }));
  expect(mockLoadMore).toHaveBeenCalledWith(3);
  await fireEvent.press(
    screen.getByRole('button', { name: 'My Adhoc work, completed' }),
  );
  expect(router.push).toHaveBeenCalledWith('/entry/completed-entry');
  await fireEvent.press(
    screen.getByRole('button', { name: 'My Adhoc draft, draft' }),
  );
  expect(router.push).toHaveBeenCalledWith('/entry/draft-entry/edit');
});

test('query failures can be retried without exposing error details', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(useQuery).mockImplementation(() => {
    throw new Error('Query failed');
  });
  await render(<ProjectScreen mode="detail" projectId={projectId} />, {
    wrapper,
  });
  expect(screen.getByRole('alert')).toHaveTextContent(/Check your connection/);
  jest.mocked(useQuery).mockImplementation(() => mockDetail);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByRole('header', { name: 'Atlas' })).toBeTruthy();
});
