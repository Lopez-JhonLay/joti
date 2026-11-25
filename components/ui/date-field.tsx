import { useEffect, useState } from 'react';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Keyboard, Pressable, View } from 'react-native';
import { AnimatedIcon } from './animated-icon';
import { Button } from './button';
import { Typography } from './typography';
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
};

export function DateField({
  label,
  value,
  onChange,
  onBlur,
  disabled,
  error,
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
        <Typography variant="label" className="font-sans text-muted">
          (optional)
        </Typography>
      </Typography>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: displayValue }}
          accessibilityHint={error ?? 'Opens the calendar to select a date.'}
          accessibilityState={{ disabled: !!disabled }}
          disabled={disabled}
          onPress={openPicker}
          className={`form-input flex-1 flex-row items-center justify-between gap-3 active:bg-elevated ${error ? 'border-danger' : 'border-border'} ${disabled ? 'opacity-50' : ''}`}
        >
          {({ pressed }) => (
            <>
              <Typography
                className={`shrink ${value ? 'text-foreground' : 'text-muted'}`}
              >
                {displayValue}
              </Typography>
              <AnimatedIcon name="calendar" size={20} active={pressed} />
            </>
          )}
        </Pressable>
        {!!value && (
          <Button
            title="Clear"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            variant="ghost"
            disabled={disabled}
            onPress={() => {
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
