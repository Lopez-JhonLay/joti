import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';
import { usePreventRemove } from 'expo-router';
import { useConvexConnectionState } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import {
  companySchema,
  type CompanyFormValues,
  type CompanyValues,
} from '@/lib/company-validation';
import { requestErrorMessage } from '@/lib/request-errors';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { DateField } from '@/components/ui/date-field';
import { Feedback } from '@/components/ui/feedback';

type CompanyFormProps = {
  initialValues?: CompanyFormValues;
  onSave: (values: CompanyValues) => Promise<Id<'companies'>>;
  onSaved: (companyId: Id<'companies'>) => void;
  submitLabel?: string;
};

const fields = [
  { name: 'name', label: 'Company name', hint: 'Required', maxLength: 200 },
  { name: 'jobTitle', label: 'Job title', hint: 'Optional', maxLength: 200 },
] as const;

export function CompanyForm({
  initialValues,
  onSave,
  onSaved,
  submitLabel = 'Save company',
}: CompanyFormProps) {
  const { isWebSocketConnected } = useConvexConnectionState();
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<Id<'companies'> | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const saving = useRef(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<CompanyFormValues, unknown, CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      jobTitle: '',
      startDate: '',
      endDate: '',
      ...initialValues,
    },
  });

  usePreventRemove(
    (isDirty || isSubmitting) && !savedId && !discarding,
    ({ repeat }) => {
      Alert.alert(
        isSubmitting ? 'Save in progress' : 'Discard changes?',
        isSubmitting
          ? 'Saving may still finish after you leave. Stay here to see whether it succeeds.'
          : 'Your company changes have not been saved.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: isSubmitting ? 'Leave' : 'Discard',
            style: 'destructive',
            onPress: () => {
              setDiscarding(true);
              repeat();
            },
          },
        ],
      );
    },
  );
  useEffect(() => {
    if (savedId) onSaved(savedId);
  }, [savedId, onSaved]);

  async function submit(values: CompanyValues) {
    if (saving.current) return;
    if (!isWebSocketConnected) {
      setError('You’re offline. Reconnect before saving your company.');
      return;
    }
    saving.current = true;
    setError(null);
    try {
      const id = await onSave(values);
      reset(values);
      setSavedId(id);
    } catch (cause) {
      setError(requestErrorMessage(cause));
    } finally {
      saving.current = false;
    }
  }

  return (
    <View className="flex-1 gap-6">
      {fields.map(({ name, label, hint, maxLength }) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field: { value, onChange, onBlur, ref }, fieldState }) => (
            <FormField
              ref={ref}
              label={label}
              hint={hint}
              error={fieldState.error?.message}
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              editable={!isSubmitting && !savedId}
              maxLength={maxLength}
              autoCapitalize="words"
            />
          )}
        />
      ))}
      {(['startDate', 'endDate'] as const).map((name) => (
        <Controller
          key={name}
          control={control}
          name={name}
          render={({ field, fieldState }) => (
            <DateField
              label={name === 'startDate' ? 'Start date' : 'End date'}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isSubmitting || !!savedId}
              error={fieldState.error?.message}
            />
          )}
        />
      ))}
      <View className="mt-auto gap-3 pt-8">
        {!isWebSocketConnected && (
          <Feedback message="You’re offline. Reconnect to save changes." />
        )}
        {error && <Feedback error message={error} />}
        <View accessibilityLiveRegion="polite">
          {isSubmitting && (
            <Feedback message="Saving company… Keep this screen open until saving finishes." />
          )}
          {savedId && <Feedback message="Company saved." />}
        </View>
        <Button
          title={error ? 'Retry save' : submitLabel}
          className="w-full"
          loading={isSubmitting}
          disabled={!isWebSocketConnected || !!savedId}
          onPress={() => void handleSubmit(submit)()}
        />
      </View>
    </View>
  );
}
