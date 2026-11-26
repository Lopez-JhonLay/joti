import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { getFunctionName } from 'convex/server';
import { router, usePreventRemove } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/lib/theme';
import { EntryDetailScreen } from '@/components/journal/entry-detail-screen';
import { EntryEditorScreen } from '@/components/journal/entry-editor-screen';
import { EntriesScreen } from '@/components/journal/entries-screen';
import type { Doc, Id } from '@/convex/_generated/dataModel';

const entryId = 'entry' as Id<'entries'>;
const companyId = 'company' as Id<'companies'>;
const projectId = 'project' as Id<'projects'>;
const mockEntry: Doc<'entries'> = {
  _id: entryId,
  _creationTime: 1,
  userId: 'owner' as Id<'users'>,
  companyId,
  projectId,
  status: 'draft',
  task: 'Ship a fix',
  whatIDid: 'Fixed timeout handling',
  date: '2026-11-25',
  impactCategories: ['technical'],
  impactStatus: 'pending',
  revision: 1,
  createdAt: 1,
  updatedAt: 1,
};
const company: Doc<'companies'> = {
  _id: companyId,
  _creationTime: 1,
  userId: mockEntry.userId,
  name: 'Employer',
  createdAt: 1,
  updatedAt: 1,
};
const project: Doc<'projects'> = {
  _id: projectId,
  _creationTime: 1,
  companyId,
  userId: mockEntry.userId,
  name: 'General / Adhoc',
  isGeneral: true,
  status: 'active',
  createdAt: 1,
  updatedAt: 1,
};
const mockUpdate = jest.fn();
const mockComplete = jest.fn();
const mockDiscard = jest.fn();
let mockPreview = false;
let mockDetail: {
  entry: Doc<'entries'>;
  company: Doc<'companies'>;
  project: Doc<'projects'>;
} | null;
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
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
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useConvex: () => ({ query: async () => mockDetail }),
  useConvexConnectionState: () => ({ isWebSocketConnected: true }),
  usePaginatedQuery: () => ({
    results: [mockEntry],
    status: 'Exhausted',
    loadMore: jest.fn(),
  }),
}));
jest.mock('@/components/journal/entry-organization-selector', () => ({
  EntryOrganizationSelector: ({
    initialSelection,
    onChange,
  }: {
    initialSelection?: {
      companyId: Id<'companies'>;
      projectId: Id<'projects'>;
    };
    onChange: (selection: unknown) => void;
  }) => {
    jest.requireActual<typeof import('react')>('react').useEffect(() => {
      onChange(initialSelection);
    }, [onChange, initialSelection]);
    return null;
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
  mockPreview = false;
  mockDetail = { entry: { ...mockEntry }, company, project };
  jest
    .mocked(useQuery)
    .mockImplementation((...args) =>
      args[1] === 'skip' ? undefined : mockDetail,
    );
  jest.mocked(useMutation).mockImplementation((ref) => {
    const mutation =
      getFunctionName(ref) === 'entries:complete'
        ? mockComplete
        : getFunctionName(ref) === 'entries:discard'
          ? mockDiscard
          : mockUpdate;
    const result: ReturnType<typeof useMutation> = Object.assign(mutation, {
      withOptimisticUpdate: () => result,
    });
    return result;
  });
  mockUpdate.mockImplementation(async (args) => ({
    ...mockEntry,
    ...args,
    revision: args.expectedRevision + 1,
  }));
  mockComplete.mockImplementation(async (args) => ({
    ...mockEntry,
    ...args,
    status: 'completed',
    revision: args.expectedRevision + 1,
  }));
  mockDiscard.mockResolvedValue({ ...mockEntry, revision: 2, deletedAt: 1 });
});
test('detail shows real organization, separate statuses, notes and editing', async () => {
  mockDetail = {
    entry: {
      ...mockEntry,
      status: 'completed',
      notesAndPraise: 'Thanks from support',
    },
    company,
    project,
  };
  await render(<EntryDetailScreen entryId={entryId} completed />, { wrapper });
  expect(screen.getByText('Company: Employer')).toBeTruthy();
  expect(screen.getByText('Project: General / Adhoc')).toBeTruthy();
  expect(screen.getByLabelText('Entry status: Completed')).toBeTruthy();
  expect(screen.getByText('Impact status')).toBeTruthy();
  expect(screen.getByText('Pending')).toBeTruthy();
  expect(
    screen.queryByText(
      'Entry marked completed. Another moment worth remembering.',
    ),
  ).toBeNull();
  expect(screen.getByText('Thanks from support')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit entry' }));
  expect(router.push).toHaveBeenCalledWith('/entry/entry/edit');
});
test('draft rows reopen the editor, and unavailable detail exposes no text', async () => {
  const view = await render(<EntriesScreen />, { wrapper });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Ship a fix, draft' }),
  );
  expect(router.push).toHaveBeenCalledWith('/entry/entry/edit');
  mockDetail = null;
  await view.rerender(<EntryDetailScreen entryId={entryId} />);
  expect(
    screen.getByText('This entry is unavailable or in Trash.'),
  ).toBeTruthy();
  expect(screen.queryByText('Fixed timeout handling')).toBeNull();
});
test('resumes without rewriting, autosaves changed text and enables unsaved navigation protection', async () => {
  await render(<EntryEditorScreen entryId={entryId} />, { wrapper });
  expect(screen.getByDisplayValue('Ship a fix')).toBeTruthy();
  expect(mockUpdate).not.toHaveBeenCalled();
  await fireEvent.changeText(
    screen.getByLabelText('Task title'),
    'Revised title',
  );
  await waitFor(() =>
    expect(usePreventRemove).toHaveBeenLastCalledWith(
      true,
      expect.any(Function),
    ),
  );
  await waitFor(() => expect(screen.getByText('Saved as draft')).toBeTruthy(), {
    timeout: 2500,
  });
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({ task: 'Revised title', expectedRevision: 1 }),
  );
});
test('failed autosave retains text and retries the same revision and request', async () => {
  mockUpdate.mockRejectedValueOnce(new Error('Network error'));
  await render(<EntryEditorScreen entryId={entryId} />, { wrapper });
  await fireEvent.changeText(
    screen.getByLabelText('Task title'),
    'Unsaved title',
  );
  await waitFor(() => expect(screen.getByText('Retry save')).toBeTruthy(), {
    timeout: 2500,
  });
  expect(screen.getByDisplayValue('Unsaved title')).toBeTruthy();
  await fireEvent.press(screen.getByText('Retry save'));
  await waitFor(() => expect(screen.getByText('Saved as draft')).toBeTruthy());
  expect(mockUpdate.mock.calls[0]).toEqual(mockUpdate.mock.calls[1]);
});
test('completion navigates only after backend confirmation', async () => {
  let resolve!: (value: Doc<'entries'>) => void;
  mockComplete.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await render(<EntryEditorScreen entryId={entryId} />, { wrapper });
  await fireEvent.press(
    screen.getByRole('button', { name: '3. Notes and evidence' }),
  );
  await fireEvent.press(screen.getByText('Complete'));
  expect(
    screen.getByRole('button', {
      name: 'Complete',
      includeHiddenElements: true,
    }),
  ).toBeDisabled();
  expect(
    screen.getByRole('progressbar', { name: 'Saving entry' }),
  ).toBeTruthy();
  expect(router.replace).not.toHaveBeenCalled();
  resolve({ ...mockEntry, status: 'completed', revision: 2 });
  await waitFor(() =>
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/entry/[entryId]',
      params: { entryId, completed: '1' },
    }),
  );
});
test('discard confirmation can be cancelled and only confirmed discard calls backend', async () => {
  await render(<EntryEditorScreen entryId={entryId} />, { wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Discard' }));
  await fireEvent.press(screen.getByText('Keep draft'));
  expect(mockDiscard).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Discard' }));
  await fireEvent.press(screen.getAllByRole('button', { name: 'Discard' })[1]);
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/entries'));
  expect(mockDiscard).toHaveBeenCalledTimes(1);
});
test('preview never mounts private entry queries or mutations', async () => {
  mockPreview = true;
  await render(<EntryEditorScreen entryId={entryId} />, { wrapper });
  expect(useQuery).not.toHaveBeenCalled();
  expect(useMutation).not.toHaveBeenCalled();
});
