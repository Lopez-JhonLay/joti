import {
  act,
  fireEvent,
  renderRouter,
  screen,
  waitFor,
} from 'expo-router/testing-library';
import { Alert } from 'react-native';
import { getFunctionName as mockGetFunctionName } from 'convex/server';
import RootLayout from '@/app/_layout';
import AuthLayout from '@/app/(auth)/_layout';
import SignInScreen from '@/app/(auth)/sign-in';
import ProtectedLayout from '@/app/(protected)/_layout';
import TabsLayout from '@/app/(protected)/(tabs)/_layout';
import CompaniesScreen from '@/app/(protected)/(tabs)/companies';
import HomeScreen from '@/app/(protected)/(tabs)/index';
import HistoryScreen from '@/app/(protected)/(tabs)/history';
import SettingsScreen from '@/app/(protected)/(tabs)/settings';
import NewCompanyRoute from '@/app/(protected)/company/new';
import CompanyDetailRoute from '@/app/(protected)/company/[companyId]/index';
import EditCompanyRoute from '@/app/(protected)/company/[companyId]/edit';
import NewProjectRoute from '@/app/(protected)/company/[companyId]/project/new';
import ProjectDetailRoute from '@/app/(protected)/project/[projectId]/index';
import EditProjectRoute from '@/app/(protected)/project/[projectId]/edit';
import AddEntryScreen from '@/app/(protected)/add-entry';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const mockCompanyId = 'company' as Id<'companies'>;
let mockCompany: Doc<'companies'>;
let mockGeneral: Doc<'projects'>;
let mockProjectDetail: {
  project: Doc<'projects'>;
  company: Doc<'companies'>;
} | null;
let mockVersion = 0;
const mockProjectId = 'project' as Id<'projects'>;
const mockSave = jest.fn();
const mockEdit = jest.fn();
const mockProjectSave = jest.fn();
const mockProjectEdit = jest.fn();
const mockProjectStatus = jest.fn();
const mockListeners = new Set<() => void>();
const mockStore = {
  subscribe: (listener: () => void) => {
    mockListeners.add(listener);
    return () => {
      mockListeners.delete(listener);
    };
  },
  getSnapshot: () => mockVersion,
};

jest.mock('@/lib/auth-session', () => ({
  AuthSessionProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  useAuthSession: () => ({ isAuthenticated: true, isLoading: false }),
}));
jest.mock('convex/react', () => ({
  ...jest.requireActual('convex/react'),
  useConvexConnectionState: () => ({ isWebSocketConnected: true }),
  useMutation: (ref: Parameters<typeof mockGetFunctionName>[0]) =>
    ({
      'companies:create': mockSave,
      'companies:update': mockEdit,
      'projects:create': mockProjectSave,
      'projects:update': mockProjectEdit,
      'projects:setStatus': mockProjectStatus,
    })[mockGetFunctionName(ref)],
  useQuery: (
    ref: Parameters<typeof mockGetFunctionName>[0],
    args?: unknown,
  ) => {
    jest
      .requireActual<typeof import('react')>('react')
      .useSyncExternalStore(mockStore.subscribe, mockStore.getSnapshot);
    if (args === 'skip') return undefined;
    if (mockGetFunctionName(ref) === 'projects:general') return mockGeneral;
    if (
      mockGetFunctionName(ref) === 'projects:get' &&
      typeof args === 'object' &&
      args !== null &&
      'projectId' in args &&
      args.projectId === mockGeneral._id
    )
      return { project: mockGeneral, company: mockCompany };
    return mockGetFunctionName(ref) === 'companies:get'
      ? mockCompany
      : mockProjectDetail;
  },
  usePaginatedQuery: (
    ref: Parameters<typeof mockGetFunctionName>[0],
    args?: { status?: string },
  ) => {
    jest
      .requireActual<typeof import('react')>('react')
      .useSyncExternalStore(mockStore.subscribe, mockStore.getSnapshot);
    return {
      results:
        mockGetFunctionName(ref) === 'companies:list'
          ? [mockCompany]
          : mockProjectDetail &&
              (!args?.status ||
                args.status === mockProjectDetail.project.status)
            ? [mockProjectDetail.project]
            : [],
      status: 'Exhausted',
    };
  },
}));

const routes = {
  _layout: RootLayout,
  '(auth)/_layout': AuthLayout,
  '(auth)/sign-in': SignInScreen,
  '(protected)/_layout': ProtectedLayout,
  '(protected)/(tabs)/_layout': TabsLayout,
  '(protected)/(tabs)/index': HomeScreen,
  '(protected)/(tabs)/history': HistoryScreen,
  '(protected)/(tabs)/companies': CompaniesScreen,
  '(protected)/(tabs)/settings': SettingsScreen,
  '(protected)/add-entry': AddEntryScreen,
  '(protected)/company/new': NewCompanyRoute,
  '(protected)/company/[companyId]/index': CompanyDetailRoute,
  '(protected)/company/[companyId]/edit': EditCompanyRoute,
  '(protected)/company/[companyId]/project/new': NewProjectRoute,
  '(protected)/project/[projectId]/index': ProjectDetailRoute,
  '(protected)/project/[projectId]/edit': EditProjectRoute,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockVersion = 0;
  mockProjectDetail = null;
  mockCompany = {
    _id: mockCompanyId,
    _creationTime: 1,
    userId: 'owner' as Id<'users'>,
    name: 'Acme',
    createdAt: 1,
    updatedAt: 1,
  };
  mockSave.mockResolvedValue(mockCompanyId);
  mockGeneral = {
    _id: 'general' as Id<'projects'>,
    _creationTime: 1,
    companyId: mockCompanyId,
    userId: mockCompany.userId,
    name: 'General / Adhoc',
    status: 'active',
    isGeneral: true,
    createdAt: 1,
    updatedAt: 1,
  };
  mockEdit.mockImplementation(async (values: { name: string }) => {
    mockCompany = { ...mockCompany, name: values.name };
    mockVersion++;
    mockListeners.forEach((listener) => listener());
    return null;
  });
  mockProjectSave.mockImplementation(
    async (values: { name: string; description?: string }) => {
      mockProjectDetail = {
        company: mockCompany,
        project: {
          _id: mockProjectId,
          _creationTime: 1,
          userId: mockCompany.userId,
          companyId: mockCompanyId,
          isGeneral: false,
          status: 'active',
          createdAt: 1,
          updatedAt: 1,
          ...values,
        },
      };
      mockVersion++;
      mockListeners.forEach((listener) => listener());
      return mockProjectId;
    },
  );
  mockProjectEdit.mockImplementation(
    async (values: {
      name: string;
      description?: string;
      status: 'active' | 'archived';
    }) => {
      if (mockProjectDetail)
        mockProjectDetail = {
          ...mockProjectDetail,
          project: { ...mockProjectDetail.project, ...values },
        };
      mockVersion++;
      mockListeners.forEach((listener) => listener());
      return null;
    },
  );
  mockProjectStatus.mockImplementation(
    async (values: { status: 'active' | 'archived' }) => {
      if (mockProjectDetail)
        mockProjectDetail = {
          ...mockProjectDetail,
          project: { ...mockProjectDetail.project, status: values.status },
        };
      mockVersion++;
      mockListeners.forEach((listener) => listener());
      return null;
    },
  );
});
afterEach(() => jest.restoreAllMocks());

test('company create, detail, edit, and discard work through the real router', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await renderRouter(routes, { initialUrl: '/companies' });
  await fireEvent.press(screen.getByRole('button', { name: 'Add company' }));
  await waitFor(() => expect(screen).toHavePathname('/company/new'));
  await fireEvent.changeText(screen.getByLabelText('Company name'), 'Acme');
  await fireEvent.press(screen.getByRole('button', { name: 'Save company' }));
  await waitFor(() => expect(screen).toHavePathname('/company/company'));
  expect(mockSave).toHaveBeenCalledTimes(1);
  expect(alert).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByRole('button', { name: 'Edit company' }));
  await waitFor(() => expect(screen).toHavePathname('/company/company/edit'));
  await fireEvent.changeText(screen.getByLabelText('Company name'), 'Unsaved');
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(alert).toHaveBeenCalledWith(
    'Discard changes?',
    expect.any(String),
    expect.any(Array),
  );
  expect(screen).toHavePathname('/company/company/edit');
  await act(() =>
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((button) => button.text === 'Discard')
      ?.onPress?.(),
  );
  await waitFor(() => expect(screen).toHavePathname('/company/company'));
  expect(mockEdit).not.toHaveBeenCalled();

  alert.mockClear();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit company' }));
  await fireEvent.changeText(screen.getByLabelText('Company name'), 'Renamed');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(screen).toHavePathname('/company/company'));
  expect(mockEdit).toHaveBeenCalledTimes(1);
  expect(alert).not.toHaveBeenCalled();
  expect(screen.getByRole('header', { name: 'Renamed' })).toBeVisible();
}, 20000);

test('project creation, edit, archive, filtering, and restore work through company navigation', async () => {
  await renderRouter(routes, { initialUrl: '/company/company' });
  await fireEvent.press(screen.getByRole('button', { name: 'Add project' }));
  await waitFor(() =>
    expect(screen).toHavePathname('/company/company/project/new'),
  );
  expect(screen.queryByTestId('pill-tab-surface')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Project name'), 'Atlas');
  await fireEvent.press(screen.getByRole('button', { name: 'Save project' }));
  await waitFor(() => expect(screen).toHavePathname('/project/project'));
  await fireEvent.press(screen.getByRole('button', { name: 'Edit project' }));
  await fireEvent.changeText(screen.getByLabelText('Project name'), 'Atlas v2');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(screen).toHavePathname('/project/project'));
  expect(screen.getByRole('header', { name: 'Atlas v2' })).toBeVisible();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Archive project' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm archive project' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Restore project' }),
    ).toBeVisible(),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await waitFor(() => expect(screen).toHavePathname('/company/company'));
  await fireEvent.press(screen.getByRole('radio', { name: 'Active' }));
  expect(screen.getByText('No active named projects.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Archived' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'View project Atlas v2' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Restore project' }),
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Confirm restore project' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Archive project' }),
    ).toBeVisible(),
  );
  expect(mockProjectStatus).toHaveBeenNthCalledWith(1, {
    projectId: mockProjectId,
    status: 'archived',
  });
  expect(mockProjectStatus).toHaveBeenNthCalledWith(2, {
    projectId: mockProjectId,
    status: 'active',
  });
}, 30000);

test('General is pinned in company details and its detail route has no edit/archive action', async () => {
  await renderRouter(routes, { initialUrl: '/company/company' });
  expect(
    screen.getAllByRole('button', { name: 'View project General / Adhoc' }),
  ).toHaveLength(1);
  await fireEvent.press(
    screen.getByRole('button', { name: 'View project General / Adhoc' }),
  );
  await waitFor(() => expect(screen).toHavePathname('/project/general'));
  expect(screen.getByRole('header', { name: 'General / Adhoc' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Edit project' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Archive project' })).toBeNull();
});

test('Add Entry selects the company’s General category without creating a journal record', async () => {
  await renderRouter(routes, { initialUrl: '/' });
  await fireEvent.press(
    screen.getAllByRole('button', { name: 'Add Entry' })[0],
  );
  await waitFor(() => expect(screen).toHavePathname('/add-entry'));
  await fireEvent.press(screen.getByRole('button', { name: 'Company' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Acme' }));
  expect(screen.getByRole('button', { name: 'Project / category' })).toHaveProp(
    'accessibilityValue',
    { text: 'General / Adhoc' },
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Project / category' }),
  );
  expect(
    screen.getByRole('radio', { name: 'General / Adhoc', checked: true }),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'General / Adhoc' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen).toHavePathname('/'));
  expect(mockSave).not.toHaveBeenCalled();
  expect(mockProjectSave).not.toHaveBeenCalled();
}, 20000);
