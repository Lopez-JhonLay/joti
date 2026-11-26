import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ThemeProvider } from '@/lib/theme';
import { EntryForm } from '@/components/journal/entry-form';
import type { Id } from '@/convex/_generated/dataModel';

jest.mock('@/components/journal/entry-organization-selector', () => ({
  EntryOrganizationSelector: () => null,
}));
const organization = {
  companyId: 'company' as Id<'companies'>,
  projectId: 'project' as Id<'projects'>,
};
const props = {
  initialOrganization: organization,
  onChange: jest.fn(),
  onOrganizationChange: jest.fn(),
  onComplete: jest.fn(),
  onDone: jest.fn(),
  onDiscard: jest.fn(),
};
beforeEach(() => jest.clearAllMocks());
test('preserves values across all three steps and submits completion only explicitly', async () => {
  await render(
    <ThemeProvider>
      <EntryForm {...props} />
    </ThemeProvider>,
  );
  await fireEvent.changeText(screen.getByLabelText('Task title'), 'Ship a fix');
  await fireEvent.changeText(
    screen.getByLabelText('What I did'),
    'Fixed timeout handling',
  );
  await fireEvent.press(screen.getByText('Next'));
  await fireEvent.press(screen.getByText('Technical'));
  await fireEvent.changeText(
    screen.getByLabelText('Impact metrics'),
    'Saved 2 hours',
  );
  await fireEvent.press(screen.getByText('Next'));
  expect(
    screen.getByText(
      'Images cannot be attached yet. Avoid including confidential company information.',
    ),
  ).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText('Notes and praise'),
    'Thanks from support',
  );
  expect(props.onComplete).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Previous'));
  expect(screen.getByDisplayValue('Saved 2 hours')).toBeTruthy();
  await fireEvent.press(screen.getByText('Previous'));
  expect(screen.getByDisplayValue('Ship a fix')).toBeTruthy();
  await waitFor(() =>
    expect(props.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        task: 'Ship a fix',
        impactCategories: ['technical'],
        notesAndPraise: 'Thanks from support',
      }),
    ),
  );
});
test('incomplete completion returns to task details with field errors', async () => {
  await render(
    <ThemeProvider>
      <EntryForm {...props} />
    </ThemeProvider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: '3. Notes and evidence' }),
  );
  await fireEvent.press(screen.getByText('Complete'));
  await waitFor(() =>
    expect(screen.getByText('Choose a work date.')).toBeTruthy(),
  );
  expect(screen.getByText('Enter a task title.')).toBeTruthy();
  expect(props.onComplete).not.toHaveBeenCalled();
});
test('resumes saved values and explicitly completes a valid draft', async () => {
  await render(
    <ThemeProvider>
      <EntryForm
        {...props}
        existing
        initialValues={{
          date: '2026-11-25',
          task: 'Ship',
          whatIDid: 'Fixed a bug',
        }}
      />
    </ThemeProvider>,
  );
  expect(screen.getByDisplayValue('Ship')).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: '3. Notes and evidence' }),
  );
  await fireEvent.press(screen.getByText('Complete'));
  expect(props.onComplete).toHaveBeenCalledWith(
    expect.objectContaining({ task: 'Ship', date: '2026-11-25' }),
  );
});
