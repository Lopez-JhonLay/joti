import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { getFunctionName } from 'convex/server';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { EntryOrganizationSelector } from '@/components/journal/entry-organization-selector';
import { EntrySetupScreen } from '@/components/journal/entry-setup-screen';
import { ThemeProvider } from '@/lib/theme';

const owner = 'owner' as Id<'users'>;
const firstId = 'first' as Id<'companies'>;
const secondId = 'second' as Id<'companies'>;
const firstCompany: Doc<'companies'> = {
  _id: firstId,
  _creationTime: 1,
  userId: owner,
  name: 'Acme',
  createdAt: 1,
  updatedAt: 1,
};
const secondCompany = { ...firstCompany, _id: secondId, name: 'Other Company' };
const generalOne: Doc<'projects'> = {
  _id: 'general-first' as Id<'projects'>,
  _creationTime: 1,
  userId: owner,
  companyId: firstId,
  name: 'General / Adhoc',
  status: 'active',
  isGeneral: true,
  createdAt: 1,
  updatedAt: 1,
};
const generalTwo = {
  ...generalOne,
  _id: 'general-second' as Id<'projects'>,
  companyId: secondId,
};
const atlas: Doc<'projects'> = {
  ...generalOne,
  _id: 'atlas' as Id<'projects'>,
  name: 'Atlas',
  isGeneral: false,
};
const companies = new Map<string, Doc<'companies'>>();
const categories = new Map<string, Doc<'projects'> | null | undefined>();
const projects = new Map<string, Doc<'projects'>>();
const mockEnsure = jest.fn();
const mockLoadMore = jest.fn();
let mockConnected = true;
let mockPreview = false;

jest.mock('convex/react', () => ({
  ...jest.requireActual('convex/react'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  usePaginatedQuery: jest.fn(),
  useConvexConnectionState: () => ({ isWebSocketConnected: mockConnected }),
}));
jest.mock('@/lib/auth-session', () => ({
  useAuthSession: () => ({ isAuthenticated: true }),
}));
jest.mock('@/lib/navigation-preview', () => ({
  useNavigationPreview: () => ({ isPreview: mockPreview }),
}));
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: {
    canGoBack: () => true,
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  },
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
  mockConnected = true;
  mockPreview = false;
  companies.clear();
  categories.clear();
  projects.clear();
  companies.set(firstId, firstCompany);
  companies.set(secondId, secondCompany);
  categories.set(firstId, generalOne);
  categories.set(secondId, generalTwo);
  projects.set(atlas._id, atlas);
  mockEnsure
    .mockReset()
    .mockImplementation(
      async ({ companyId }: { companyId: Id<'companies'> }) => {
        const general = companyId === firstId ? generalOne : generalTwo;
        categories.set(companyId, general);
        return general._id;
      },
    );
  jest.mocked(useMutation).mockImplementation(() => {
    const result: ReturnType<typeof useMutation> = Object.assign(mockEnsure, {
      withOptimisticUpdate: () => result,
    });
    return result;
  });
  jest.mocked(useQuery).mockImplementation((...args) => {
    if (args[1] === 'skip') return undefined;
    const queryArgs = args[1] as {
      companyId?: Id<'companies'>;
      projectId?: Id<'projects'>;
    };
    const name = getFunctionName(args[0]);
    if (name === 'companies:get')
      return companies.get(queryArgs.companyId ?? '') ?? null;
    if (name === 'projects:general')
      return categories.get(queryArgs.companyId ?? '');
    const project = projects.get(queryArgs.projectId ?? '');
    const company = project ? companies.get(project.companyId) : null;
    return project && company ? { project, company } : null;
  });
  jest.mocked(usePaginatedQuery).mockImplementation((...args) => {
    const queryArgs = args[1] as { companyId?: Id<'companies'> };
    return {
      results:
        getFunctionName(args[0]) === 'companies:list'
          ? [...companies.values()]
          : [...projects.values()].filter(
              (project) =>
                project.companyId === queryArgs.companyId &&
                project.status === 'active',
            ),
      status: 'Exhausted',
      isLoading: false,
      loadMore: mockLoadMore,
    };
  });
});

async function chooseCompany(name = 'Acme') {
  await fireEvent.press(screen.getByRole('button', { name: 'Company' }));
  await fireEvent.press(screen.getByRole('radio', { name }));
}

test('General / Adhoc is selected by default and can be reselected after a named project', async () => {
  const onChange = jest.fn();
  await render(<EntryOrganizationSelector onChange={onChange} />, { wrapper });
  expect(
    screen.getByRole('button', { name: 'Project / category' }),
  ).toBeDisabled();
  await chooseCompany();
  expect(screen.getByRole('button', { name: 'Project / category' })).toHaveProp(
    'accessibilityValue',
    { text: 'General / Adhoc' },
  );
  expect(onChange).toHaveBeenLastCalledWith({
    companyId: firstId,
    projectId: generalOne._id,
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Project / category' }),
  );
  expect(
    screen.getByRole('radio', { name: 'General / Adhoc', checked: true }),
  ).toBeTruthy();
  expect(
    screen.getAllByRole('radio', { name: 'General / Adhoc' }),
  ).toHaveLength(1);
  await fireEvent.press(screen.getByRole('radio', { name: 'Atlas' }));
  expect(onChange).toHaveBeenLastCalledWith({
    companyId: firstId,
    projectId: atlas._id,
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Project / category' }),
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'General / Adhoc' }));
  expect(onChange).toHaveBeenLastCalledWith({
    companyId: firstId,
    projectId: generalOne._id,
  });
  expect(mockEnsure).not.toHaveBeenCalled();
});

test('switching companies clears the previous project and chooses the new company’s General category', async () => {
  const onChange = jest.fn();
  await render(<EntryOrganizationSelector onChange={onChange} />, { wrapper });
  await chooseCompany();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Project / category' }),
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Atlas' }));
  await chooseCompany('Other Company');
  expect(onChange).toHaveBeenLastCalledWith({
    companyId: secondId,
    projectId: generalTwo._id,
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Project / category' }),
  );
  expect(screen.queryByRole('radio', { name: 'Atlas' })).toBeNull();
});

test('a newly archived project falls back to General and cannot be chosen again', async () => {
  const onChange = jest.fn();
  const view = await render(<EntryOrganizationSelector onChange={onChange} />, {
    wrapper,
  });
  await chooseCompany();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Project / category' }),
  );
  await fireEvent.press(screen.getByRole('radio', { name: 'Atlas' }));
  projects.set(atlas._id, { ...atlas, status: 'archived' });
  await view.rerender(<EntryOrganizationSelector onChange={onChange} />);
  expect(onChange).toHaveBeenLastCalledWith({
    companyId: firstId,
    projectId: generalOne._id,
  });
  expect(screen.getByText(/General \/ Adhoc is selected instead/)).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Project / category' }),
  );
  expect(screen.queryByRole('radio', { name: 'Atlas' })).toBeNull();
});

test('company removal clears the emitted relationship instead of retaining stale IDs', async () => {
  const onChange = jest.fn();
  const view = await render(<EntryOrganizationSelector onChange={onChange} />, {
    wrapper,
  });
  await chooseCompany();
  companies.delete(firstId);
  await view.rerender(<EntryOrganizationSelector onChange={onChange} />);
  expect(onChange).toHaveBeenLastCalledWith(null);
  expect(
    screen.getByRole('button', { name: 'Project / category' }),
  ).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent(/Choose another company/);
});

test('missing-category setup can fail and retry without claiming a selection was saved', async () => {
  categories.set(firstId, null);
  mockEnsure.mockRejectedValueOnce(new Error('Network failure'));
  const onChange = jest.fn();
  const view = await render(<EntryOrganizationSelector onChange={onChange} />, {
    wrapper,
  });
  await chooseCompany();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /Check your connection/,
  );
  expect(onChange).toHaveBeenLastCalledWith(null);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Retry category setup' }),
  );
  await waitFor(() => expect(mockEnsure).toHaveBeenCalledTimes(2));
  await view.rerender(<EntryOrganizationSelector onChange={onChange} />);
  expect(onChange).toHaveBeenLastCalledWith({
    companyId: firstId,
    projectId: generalOne._id,
  });
});

test('offline missing categories are not provisioned until reconnection', async () => {
  categories.set(firstId, null);
  mockConnected = false;
  const view = await render(<EntryOrganizationSelector />, { wrapper });
  await chooseCompany();
  expect(mockEnsure).not.toHaveBeenCalled();
  expect(
    screen.getByText('Reconnect to prepare General / Adhoc.'),
  ).toBeTruthy();
  mockConnected = true;
  await view.rerender(<EntryOrganizationSelector />);
  await waitFor(() => expect(mockEnsure).toHaveBeenCalledTimes(1));
});

test('late setup failures from a previous company cannot replace the current selection', async () => {
  categories.set(firstId, null);
  let reject: ((error: Error) => void) | undefined;
  mockEnsure.mockImplementationOnce(
    () =>
      new Promise((_resolve, rejectPromise) => {
        reject = rejectPromise;
      }),
  );
  const onChange = jest.fn();
  await render(<EntryOrganizationSelector onChange={onChange} />, { wrapper });
  await chooseCompany();
  await chooseCompany('Other Company');
  await act(() => reject?.(new Error('Old setup failed')));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(onChange).toHaveBeenLastCalledWith({
    companyId: secondId,
    projectId: generalTwo._id,
  });
});

test('Add Entry preview mounts no private hooks, while empty company choices lead to setup', async () => {
  mockPreview = true;
  const view = await render(<EntrySetupScreen />, { wrapper });
  expect(useQuery).not.toHaveBeenCalled();
  expect(useMutation).not.toHaveBeenCalled();
  mockPreview = false;
  companies.clear();
  await view.rerender(<EntrySetupScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Company' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Add company' }));
  expect(router.push).toHaveBeenCalledWith('/company/new');
  expect(screen.queryByRole('button', { name: 'Save entry' })).toBeNull();
});
