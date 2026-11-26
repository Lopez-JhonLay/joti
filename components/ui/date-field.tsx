import { useEffect, useState } from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Keyboard, Pressable, View } from 'react-native';
import { AnimatedIcon } from './animated-icon';
import { Button } from './button';
import { Typography } from './typography';
import { ROW_INSET_STYLE } from './layout';
import {
  companyDateForPicker,
  companyDateFromPicker,
  formatCompanyDate,
} from '@/lib/company-presentation';

type DateFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
};

export function DateField({
  label,
  value,
  onChange,
  onBlur,
  disabled,
  error,
  required = false,
}: DateFieldProps) {
  const [pickerError, setPickerError] = useState<string | null>(null);
  useEffect(
    () => () => {
      void DateTimePickerAndroid.dismiss('date');
    },
    [],
  );
  const displayValue = value ? formatCompanyDate(value, true) : 'Select date';

  function openPicker() {
    setPickerError(null);
    Keyboard.dismiss();
    onBlur();
    DateTimePickerAndroid.open({
      value: companyDateForPicker(value),
      mode: 'date',
      display: 'default',
      onValueChange: (_event, date) => onChange(companyDateFromPicker(date)),
      onError: () => setPickerError('Unable to open the calendar. Try again.'),
    });
  }

  return (
    <View className="gap-2">
      <Typography variant="label">
        {label}{' '}
        <Typography
          variant="label"
          className={required ? 'text-danger' : 'font-sans text-muted'}
        >
          {required ? '*' : '(optional)'}
        </Typography>
      </Typography>
      <View
        className={`form-input flex-row items-center px-0 py-0 ${error ? 'border-danger' : 'border-border'} ${disabled ? 'opacity-50' : ''}`}
      >
        <Pressable
          accessibilityRole="button"
          style={ROW_INSET_STYLE}
          accessibilityLabel={label}
          accessibilityValue={{ text: displayValue }}
          accessibilityHint={error ?? 'Opens the calendar to select a date.'}
          accessibilityState={{ disabled: !!disabled }}
          disabled={disabled}
          onPress={openPicker}
          className="min-h-touch flex-1 flex-row items-center justify-between gap-3 rounded-card px-4 py-3 active:bg-elevated"
        >
          {({ pressed }) => (
            <>
              <Typography
                className={`shrink ${value ? 'text-foreground' : 'text-muted'}`}
              >
                {displayValue}
              </Typography>
              {!value && (
                <AnimatedIcon name="calendar" size={20} active={pressed} />
              )}
            </>
          )}
        </Pressable>
        {!!value && (
          <Button
            title={`Clear ${label.toLowerCase()}`}
            icon="x"
            iconOnly
            variant="ghost"
            className="mr-1"
            disabled={disabled}
            onPress={() => {
              setPickerError(null);
              onChange('');
              onBlur();
            }}
          />
        )}
      </View>
      {(error || pickerError) && (
        <Typography
          variant="caption"
          className="text-danger"
          accessibilityRole="alert"
        >
          {error ?? pickerError}
        </Typography>
      )}
    </View>
  );
}
