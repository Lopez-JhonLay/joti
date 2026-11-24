import { fireEvent, render, screen } from '@testing-library/react-native';
import { useConvex, useConvexConnectionState } from 'convex/react';
import { ConvexStatus } from '@/components/ui/convex-status';
import { useBackendConfigured } from '@/lib/convex-provider';
import { ThemeProvider } from '@/lib/theme';

jest.mock('convex/react', () => ({
  useConvex: jest.fn(),
  useConvexConnectionState: jest.fn(),
}));
jest.mock('@/lib/convex-provider', () => ({ useBackendConfigured: jest.fn() }));
const query = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useBackendConfigured).mockReturnValue(true);
  jest
    .mocked(useConvex)
    .mockReturnValue({ query } as unknown as ReturnType<typeof useConvex>);
  jest.mocked(useConvexConnectionState).mockReturnValue({
    isWebSocketConnected: true,
  } as ReturnType<typeof useConvexConnectionState>);
});

test('missing configuration preserves preview and explains setup', async () => {
  jest.mocked(useBackendConfigured).mockReturnValue(false);
  await render(
    <ThemeProvider>
      <ConvexStatus />
    </ThemeProvider>,
  );
  expect(screen.getByText(/Convex is not configured/)).toBeTruthy();
  expect(query).not.toHaveBeenCalled();
});

test('failed connection checks can retry successfully', async () => {
  query
    .mockRejectedValueOnce(new Error('Unavailable'))
    .mockResolvedValue({ status: 'ok' });
  await render(
    <ThemeProvider>
      <ConvexStatus />
    </ThemeProvider>,
  );
  await screen.findByText(/Backend check failed/);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Retry connection' }),
  );
  await screen.findByText('Connected to Convex');
  expect(query).toHaveBeenCalledTimes(2);
});

test('a disconnected socket is not reported as connected after a cached health result', async () => {
  query.mockResolvedValue({ status: 'ok' });
  jest.mocked(useConvexConnectionState).mockReturnValue({
    isWebSocketConnected: false,
  } as ReturnType<typeof useConvexConnectionState>);
  await render(
    <ThemeProvider>
      <ConvexStatus />
    </ThemeProvider>,
  );
  expect(screen.queryByText('Connected to Convex')).toBeNull();
  expect(screen.getByText(/Connecting to Convex/)).toBeTruthy();
});
