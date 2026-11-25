import { TextInput, View, type TextInputProps } from 'react-native';
import type { ComponentProps } from 'react';
import { Typography } from './typography';
import { useTheme } from '@/lib/theme';

type FormFieldProps = TextInputProps & {
  ref?: ComponentProps<typeof TextInput>['ref'];
  label: string;
  error?: string;
  hint?: string;
};

export function FormField({ label, error, hint, ...props }: FormFieldProps) {
  const { colors } = useTheme();
  return (
    <View className="gap-2">
      <Typography variant="label">{label}</Typography>
      <TextInput
        {...props}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
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
