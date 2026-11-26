import { TextInput, View, type TextInputProps } from 'react-native';
import { useCallback, useContext, useRef, type ComponentProps } from 'react';
import { FormKeyboardContext, type FormInput } from './form-keyboard-context';
import { Typography } from './typography';
import { useTheme } from '@/lib/theme';

type FormFieldProps = TextInputProps & {
  ref?: ComponentProps<typeof TextInput>['ref'];
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

export function FormField({
  label,
  error,
  hint,
  required,
  ref: forwardedRef,
  onFocus,
  onBlur,
  ...props
}: FormFieldProps) {
  const { colors } = useTheme();
  const keyboard = useContext(FormKeyboardContext);
  const input = useRef<FormInput>(null);
  const setInput = useCallback(
    (instance: FormInput | null) => {
      input.current = instance;
      if (typeof forwardedRef === 'function') forwardedRef(instance);
      else if (forwardedRef) forwardedRef.current = instance;
    },
    [forwardedRef],
  );
  return (
    <View className="gap-2">
      <Typography variant="label">
        {label}
        {required && <Typography className="text-danger"> *</Typography>}
      </Typography>
      <TextInput
        {...props}
        ref={setInput}
        onFocus={(event) => {
          keyboard?.focus(input.current);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          keyboard?.blur(input.current);
          onBlur?.(event);
        }}
        accessibilityLabel={label}
        accessibilityHint={
          error ??
          hint ??
          (required ? 'Required to complete the entry.' : undefined)
        }
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        className={`form-input ${error ? 'border-danger' : 'border-border'}`}
      />
      {error ? (
        <Typography
          accessibilityRole="alert"
          className="text-danger"
          variant="caption"
        >
          {error}
        </Typography>
      ) : hint ? (
        <Typography variant="caption">{hint}</Typography>
      ) : null}
    </View>
  );
}
