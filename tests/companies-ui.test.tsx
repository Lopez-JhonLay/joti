import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, usePreventRemove } from 'expo-router';
import { ConvexError } from 'convex/values';
import { getFunctionName } from 'convex/server';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CompanyScreen } from '@/components/companies/company-screen';
import { ThemeProvider } from '@/lib/theme';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const companyId = 'company' as Id<'companies'>;
const company: Doc<'companies'> = {
  _id: companyId,
  _creationTime: 1,
  userId: 'owner' as Id<'users'>,
  name: 'Acme',
  jobTitle: 'Engineer',
  startDate: '2024-01-01',
  createdAt: 1,
  updatedAt: 1,
};
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();
const mockLoadMore = jest.fn();
let mockPreview = false;
let mockConnected = true;
let mockCompany: Doc<'companies'> | null | undefined = company;
let mockResults: Doc<'companies'>[] = [];
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
  usePaginatedQuery: jest.fn(() => ({
    results: mockResults,
    status: mockStatus,
    loadMore: mockLoadMore,
  })),
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
  mockResults = [];
  mockStatus = 'Exhausted';
  mockCreate.mockReset().mockResolvedValue(companyId);
  mockUpdate.mockReset().mockResolvedValue(null);
  mockRemove.mockReset().mockResolvedValue(null);
  jest.mocked(useQuery).mockImplementation((...args) =>
    getFunctionName(args[0]) === 'projects:general'
      ? {
          _id: 'general',
          companyId,
          userId: company.userId,
          name: 'General / Adhoc',
          isGeneral: true,
          status: 'active',
          createdAt: 1,
          updatedAt: 1,
          _creationTime: 1,
        }
      : mockCompany,
  );
  jest.mocked(useMutation).mockImplementation((ref) => {
    const name = getFunctionName(ref);
    const mutation =
      name === 'companies:create'
        ? mockCreate
        : name === 'companies:update'
          ? mockUpdate
          : mockRemove;
    const result: ReturnType<typeof useMutation> = Object.assign(mutation, {
      withOptimisticUpdate: () => result,
    });
    return result;
  });
  jest.mocked(usePaginatedQuery).mockImplementation((ref) => ({
    results: getFunctionName(ref) === 'projects:list' ? [] : mockResults,
    status: mockStatus as 'Exhausted',
    isLoading: false,
    loadMore: mockLoadMore,
  }));
});
afterEach(() => jest.restoreAllMocks());

async function pickDate(label: string, date: Date) {
  await fireEvent.press(screen.getByRole('button', { name: label }));
  const options = jest
    .mocked(DateTimePickerAndroid.open)
    .mock.calls.at(-1)?.[0];
  await act(() =>
    options?.onValueChange?.(
      {
        nativeEvent: {
          timestamp: date.getTime(),
          utcOffset: -date.getTimezoneOffset(),
        },
      },
      date,
    ),
  );
}

test('the list distinguishes loading, empty records, and paginated companies', async () => {
  mockStatus = 'LoadingFirstPage';
  const view = await render(<CompanyScreen mode="list" />, { wrapper });
  expect(screen.getByText('Loading your companies…')).toBeTruthy();
  expect(screen.queryByText('Add your first company.')).toBeNull();
  mockStatus = 'Exhausted';
  await view.rerender(<CompanyScreen mode="list" />);
  expect(screen.getByText('Add your first company.')).toBeTruthy();
  expect(screen.getAllByRole('button', { name: 'Add company' })).toHaveLength(
    1,
  );
  mockResults = [company];
  mockStatus = 'CanLoadMore';
  await view.rerender(<CompanyScreen mode="list" />);
  await fireEvent.press(screen.getByRole('button', { name: 'View Acme' }));
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/company/[companyId]',
    params: { companyId },
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Load more companies' }),
  );
  expect(mockLoadMore).toHaveBeenCalledWith(20);
});

test('preview never mounts private queries or mutations', async () => {
  mockPreview = true;
  await render(<CompanyScreen mode="list" />, { wrapper });
  expect(
    screen.getByText(/Design preview does not access private records/),
  ).toBeTruthy();
  expect(useMutation).not.toHaveBeenCalled();
  expect(usePaginatedQuery).not.toHaveBeenCalled();
});

test('creation requires a name and rejects inverted calendar dates before saving', async () => {
  await render(<CompanyScreen mode="create" />, { wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Save company' }));
  expect(await screen.findByText('Enter a company name.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Company name'), 'Acme');
  await pickDate('Start date', new Date(2025, 0, 2, 12));
  await pickDate('End date', new Date(2025, 0, 1, 12));
  await fireEvent.press(screen.getByRole('button', { name: 'Save company' }));
  expect(
    await screen.findByText('End date must be on or after the start date.'),
  ).toBeTruthy();
  expect(mockCreate).not.toHaveBeenCalled();
});

test('failed creation retains values and retries successfully', async () => {
  mockCreate.mockRejectedValueOnce(new Error('Network failure'));
  await render(<CompanyScreen mode="create" />, { wrapper });
  await fireEvent.changeText(screen.getByLabelText('Company name'), ' Acme ');
  await fireEvent.changeText(screen.getByLabelText('Job title'), 'Engineer');
  await fireEvent.press(screen.getByRole('button', { name: 'Save company' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Check your connection/,
  );
  expect(screen.getByLabelText('Company name')).toHaveDisplayValue(' Acme ');
  expect(router.replace).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry save' }));
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/company/[companyId]',
      params: { companyId },
    }),
  );
  expect(mockCreate).toHaveBeenLastCalledWith({
    name: 'Acme',
    jobTitle: 'Engineer',
    startDate: undefined,
    endDate: undefined,
  });
});

test('pending saves disable submission and cannot create duplicates', async () => {
  let finish: ((id: Id<'companies'>) => void) | undefined;
  mockCreate.mockReturnValue(
    new Promise<Id<'companies'>>((resolve) => {
      finish = resolve;
    }),
  );
  await render(<CompanyScreen mode="create" />, { wrapper });
  await fireEvent.changeText(screen.getByLabelText('Company name'), 'Acme');
  await fireEvent.press(screen.getByRole('button', { name: 'Save company' }));
  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Save company' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Save company' }));
  expect(mockCreate).toHaveBeenCalledTimes(1);
  await act(() => finish?.(companyId));
});

test('editing preloads employment details and can clear optional fields', async () => {
  await render(<CompanyScreen mode="edit" companyId={companyId} />, {
    wrapper,
  });
  expect(screen.getByLabelText('Company name')).toHaveDisplayValue('Acme');
  expect(screen.getByLabelText('Job title')).toHaveDisplayValue('Engineer');
  expect(screen.getByRole('button', { name: 'Start date' })).toHaveProp(
    'accessibilityValue',
    { text: 'Jan 1, 2024' },
  );
  await fireEvent.changeText(screen.getByLabelText('Job title'), '');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith({
      companyId,
      name: 'Acme',
      jobTitle: undefined,
      startDate: '2024-01-01',
      endDate: undefined,
    }),
  );
});

test('offline forms retain inputs and disable saving', async () => {
  mockConnected = false;
  await render(<CompanyScreen mode="create" />, { wrapper });
  await fireEvent.changeText(screen.getByLabelText('Company name'), 'Acme');
  expect(screen.getByRole('button', { name: 'Save company' })).toBeDisabled();
  expect(
    screen.getByText('You’re offline. Reconnect to save changes.'),
  ).toBeTruthy();
  expect(mockCreate).not.toHaveBeenCalled();
});

test('unsaved navigation asks before discarding changes', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  await render(<CompanyScreen mode="create" />, { wrapper });
  await fireEvent.changeText(screen.getByLabelText('Company name'), 'Acme');
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
  expect(jest.mocked(usePreventRemove).mock.calls.at(-1)?.[0]).toBe(false);
});

test('deletion needs confirmation and displays a dependency failure', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  mockRemove.mockRejectedValueOnce(
    new ConvexError({
      code: 'HAS_RELATED_RECORDS',
      message: 'Remove this company’s projects before deleting the company.',
    }),
  );
  await render(<CompanyScreen mode="detail" companyId={companyId} />, {
    wrapper,
  });
  expect(screen.getByText('Jan 2024 – Present')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete company' }));
  expect(mockRemove).not.toHaveBeenCalled();
  await act(() =>
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((button) => button.text === 'Delete')
      ?.onPress?.(),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Remove this company’s projects/,
  );
  expect(router.replace).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete company' }));
  await act(() =>
    alert.mock.calls
      .at(-1)?.[2]
      ?.find((button) => button.text === 'Delete')
      ?.onPress?.(),
  );
  await waitFor(() =>
    expect(router.dismissTo).toHaveBeenCalledWith('/companies'),
  );
});

test('missing detail records have an explicit recovery action', async () => {
  mockCompany = null;
  await render(<CompanyScreen mode="detail" companyId={companyId} />, {
    wrapper,
  });
  expect(screen.getByText(/This company is unavailable/)).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Back to companies' }),
  );
  expect(router.replace).toHaveBeenCalledWith('/companies');
});

test('query failures display a retry action that recovers the list', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(usePaginatedQuery).mockImplementation(() => {
    throw new Error('Query failure');
  });
  await render(<CompanyScreen mode="list" />, { wrapper });
  expect(screen.getByRole('alert')).toHaveTextContent(/Check your connection/);
  jest.mocked(usePaginatedQuery).mockImplementation(() => ({
    results: [],
    status: 'Exhausted',
    isLoading: false,
    loadMore: mockLoadMore,
  }));
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('Add your first company.')).toBeTruthy();
});
