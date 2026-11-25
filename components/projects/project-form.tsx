import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, View } from 'react-native';
import { usePreventRemove } from 'expo-router';
import { useConvexConnectionState } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import {
  projectSchema,
  type ProjectFormValues,
  type ProjectValues,
} from '@/lib/project-validation';
import { requestErrorMessage } from '@/lib/request-errors';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { FormField } from '@/components/ui/form-field';
import { Typography } from '@/components/ui/typography';
import { ProjectStatusSelector } from './project-status-selector';

export function ProjectForm({
  companyName,
  initialValues,
  onSave,
  onSaved,
}: {
  companyName: string;
  initialValues?: ProjectFormValues;
  onSave: (values: ProjectValues) => Promise<Id<'projects'>>;
  onSaved: (id: Id<'projects'>) => void;
}) {
  const { isWebSocketConnected } = useConvexConnectionState();
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<Id<'projects'> | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const saving = useRef(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<ProjectFormValues, unknown, ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active',
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
          : 'Your project changes have not been saved.',
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
  async function submit(values: ProjectValues) {
    if (saving.current) return;
    if (!isWebSocketConnected) {
      setError('You’re offline. Reconnect before saving your project.');
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
  const blocked = isSubmitting || !!savedId;
  return (
    <View className="flex-1 gap-6">
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur, ref }, fieldState }) => (
          <FormField
            ref={ref}
            label="Project name"
            hint="Required"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={fieldState.error?.message}
            editable={!blocked}
            maxLength={200}
            autoCapitalize="words"
          />
        )}
      />
      <View className="gap-2">
        <Typography variant="label">Company</Typography>
        <View className="form-input border-border">
          <Typography>{companyName}</Typography>
        </View>
        <Typography variant="caption">
          Projects stay with their company.
        </Typography>
      </View>
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur, ref }, fieldState }) => (
          <FormField
            ref={ref}
            label="Description"
            hint="Optional"
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            error={fieldState.error?.message}
            editable={!blocked}
            maxLength={4000}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        )}
      />
      {!!initialValues && (
        <View className="gap-2">
          <Typography variant="label">Status</Typography>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <ProjectStatusSelector
                value={field.value}
                disabled={blocked}
                onChange={(status) => {
                  if (status !== 'all') field.onChange(status);
                }}
              />
            )}
          />
        </View>
      )}
      <View className="mt-auto gap-3 pt-8">
        {!isWebSocketConnected && (
          <Feedback message="You’re offline. Reconnect to save changes." />
        )}
        {error && <Feedback error message={error} />}
        {isSubmitting && (
          <Feedback message="Saving project… Keep this screen open until saving finishes." />
        )}
        {savedId && <Feedback message="Project saved." />}
        <Button
          title={
            error
              ? 'Retry save'
              : initialValues
                ? 'Save changes'
                : 'Save project'
          }
          className="w-full"
          loading={isSubmitting}
          disabled={!isWebSocketConnected || !!savedId}
          onPress={() => void handleSubmit(submit)()}
        />
      </View>
    </View>
  );
}
