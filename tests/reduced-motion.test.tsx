import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useReducedMotion } from '@/hooks/use-reduced-motion';

afterEach(() => jest.restoreAllMocks());

it('respects the initial reduced-motion preference and removes its listener on unmount', async () => {
  const remove = jest.fn();
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove });
  const { result, unmount } = await renderHook(() => useReducedMotion());
  expect(result.current).toBe(true);
  await unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

it('uses a live preference change instead of a stale initial platform query', async () => {
  let resolveQuery: (enabled: boolean) => void = () => {};
  let changePreference: (enabled: boolean) => void = () => {};
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveQuery = resolve;
      }),
  );
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((_event, listener) => {
      changePreference = listener;
      return { remove: jest.fn() };
    });
  const { result } = await renderHook(() => useReducedMotion());
  expect(result.current).toBe(true);
  await act(async () => changePreference(false));
  expect(result.current).toBe(false);
  await act(async () => resolveQuery(true));
  expect(result.current).toBe(false);
});
