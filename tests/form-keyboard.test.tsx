import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormField } from '@/components/ui/form-field';
import { FormKeyboardContext } from '@/components/ui/form-keyboard-context';
import { ThemeProvider } from '@/lib/theme';

test('native input focus registers directly with the screen while preserving form handlers and ref', async () => {
  const focus = jest.fn();
  const blur = jest.fn();
  const onFocus = jest.fn();
  const onBlur = jest.fn();
  const ref = jest.fn();
  await render(
    <ThemeProvider>
      <FormKeyboardContext.Provider value={{ focus, blur }}>
        <FormField
          label="Notes"
          multiline
          ref={ref}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </FormKeyboardContext.Provider>
    </ThemeProvider>,
  );
  await fireEvent(screen.getByLabelText('Notes'), 'focus', { nativeEvent: {} });
  expect(focus).toHaveBeenCalledTimes(1);
  const nativeInput = focus.mock.calls[0][0];
  expect(nativeInput).not.toBeNull();
  expect(ref).toHaveBeenCalledWith(nativeInput);
  expect(onFocus).toHaveBeenCalledTimes(1);
  await fireEvent(screen.getByLabelText('Notes'), 'blur', { nativeEvent: {} });
  expect(blur).toHaveBeenCalledWith(nativeInput);
  expect(onBlur).toHaveBeenCalledTimes(1);
});
