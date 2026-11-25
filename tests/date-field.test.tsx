import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { DateField } from '@/components/ui/date-field';
import { ThemeProvider } from '@/lib/theme';

beforeEach(() => jest.clearAllMocks());

test('the calendar starts on the saved date, preserves cancellation, and returns a date-only value', async () => {
  const onChange = jest.fn();
  const onBlur = jest.fn();
  const view = await render(
    <ThemeProvider>
      <DateField
        label="Start date"
        value="2024-02-29"
        onChange={onChange}
        onBlur={onBlur}
      />
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Start date' }));
  const options = jest
    .mocked(DateTimePickerAndroid.open)
    .mock.calls.at(-1)?.[0];
  expect(options?.value.getFullYear()).toBe(2024);
  expect(options?.value.getMonth()).toBe(1);
  expect(options?.value.getDate()).toBe(29);
  expect(onBlur).toHaveBeenCalledTimes(1);
  await act(() => options?.onDismiss?.());
  expect(onChange).not.toHaveBeenCalled();
  const date = new Date(2025, 0, 1, 12);
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
  expect(onChange).toHaveBeenCalledWith('2025-01-01');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Clear start date' }),
  );
  expect(onChange).toHaveBeenLastCalledWith('');
  await view.unmount();
  expect(DateTimePickerAndroid.dismiss).toHaveBeenCalledWith('date');
});

test('disabled dates cannot open a dialog or clear saved values', async () => {
  const onChange = jest.fn();
  await render(
    <ThemeProvider>
      <DateField
        label="End date"
        value="2024-01-01"
        disabled
        onChange={onChange}
        onBlur={jest.fn()}
      />
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'End date' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Clear end date' }));
  expect(DateTimePickerAndroid.open).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
});

test('a native calendar failure has visible feedback and can be retried', async () => {
  await render(
    <ThemeProvider>
      <DateField label="Start date" onChange={jest.fn()} onBlur={jest.fn()} />
    </ThemeProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Start date' }));
  const options = jest
    .mocked(DateTimePickerAndroid.open)
    .mock.calls.at(-1)?.[0];
  await act(() => options?.onError?.(new Error('Native picker failed')));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Unable to open the calendar. Try again.',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Start date' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(2);
});
