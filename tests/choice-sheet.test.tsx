import { fireEvent, render, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChoiceSheet } from '@/components/ui/choice-sheet';
import { ThemeProvider } from '@/lib/theme';

let mockReducedMotion = false;
jest.mock('@/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => mockReducedMotion,
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
afterEach(() => jest.restoreAllMocks());
test('fades the backdrop separately from the drawer without sliding the native modal', async () => {
  mockReducedMotion = false;
  const timing = jest.spyOn(Animated, 'timing');
  const onClose = jest.fn();
  await render(<ChoiceSheet title="Choose company" onClose={onClose} />, {
    wrapper,
  });
  const modal = screen.getByTestId('choice-sheet');
  expect(modal).toHaveProp('animationType', 'none');
  timing.mockClear();
  await fireEvent(modal, 'show');
  expect(timing).toHaveBeenCalledTimes(2);
  const [backdrop, drawer] = timing.mock.calls;
  expect(backdrop[0]).not.toBe(drawer[0]);
  for (const [, options] of [backdrop, drawer]) {
    expect(options).toMatchObject({ toValue: 1, useNativeDriver: true });
  }
  await fireEvent.press(
    screen.getByRole('button', { name: 'Close selection' }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});
test('reduced motion shows the sheet without timed entrance animations', async () => {
  mockReducedMotion = true;
  const timing = jest.spyOn(Animated, 'timing');
  await render(<ChoiceSheet title="Choose category" onClose={jest.fn()} />, {
    wrapper,
  });
  timing.mockClear();
  await fireEvent(screen.getByTestId('choice-sheet'), 'show');
  expect(timing).not.toHaveBeenCalled();
});
