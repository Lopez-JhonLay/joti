import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Animated, Pressable, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { FormField } from '@/components/ui/form-field';
import { Typography } from '@/components/ui/typography';
import { Feedback } from '@/components/ui/feedback';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import {
  EMPTY_ENTRY,
  entryDraftSchema,
  entryCompletedSchema,
  type EntryFormValues,
  type EntryContent,
} from '@/lib/entry-validation';
import {
  EntryOrganizationSelector,
  type EntryOrganization,
} from './entry-organization-selector';

type Props = {
  initialValues?: EntryFormValues;
  initialOrganization?: EntryOrganization;
  existing?: boolean;
  completed?: boolean;
  busy?: boolean;
  onChange: (values: EntryFormValues) => void;
  onOrganizationChange: (organization: EntryOrganization | null) => void;
  onComplete: (values: EntryFormValues) => void;
  onDone: () => void;
  onDiscard: () => void;
};
const steps = ['Task details', 'Impact', 'Notes and evidence'];
const textFields = {
  task: ['Task title', 200],
  whatIDid: ['What I did', 20000],
  whoItHelped: ['Who it helped', 4000],
  companyImpact: ['Company impact', 20000],
  impactMetrics: ['Impact metrics', 4000],
  notesAndPraise: ['Notes and praise', 20000],
} as const;
type TextField = keyof typeof textFields;
export function EntryForm({
  initialValues,
  initialOrganization,
  existing,
  completed,
  busy,
  onChange,
  onOrganizationChange,
  onComplete,
  onDone,
  onDiscard,
}: Props) {
  const [step, setStep] = useState(0);
  const [organization, setOrganization] = useState(initialOrganization);
  const [organizationError, setOrganizationError] = useState(false);
  const [labels, setLabels] = useState<{
    company: string;
    project: string;
  } | null>(null);
  const handleOrganization = useCallback(
    (value: EntryOrganization | null) => {
      setOrganization(value ?? undefined);
      onOrganizationChange(value);
    },
    [onOrganizationChange],
  );
  const {
    control,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EntryFormValues, unknown, EntryContent>({
    resolver: zodResolver(entryDraftSchema),
    defaultValues: { ...EMPTY_ENTRY, ...initialValues },
  });
  const values = useWatch({ control });
  useEffect(() => {
    onChange(getValues());
  }, [values, getValues, onChange]);
  const [opacity] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    opacity.stopAnimation();
    if (reducedMotion) opacity.setValue(1);
    else {
      opacity.setValue(0.65);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    }
    return () => opacity.stopAnimation();
  }, [step, opacity, reducedMotion]);
  function textField(name: TextField) {
    const [label, maxLength] = textFields[name];
    return (
      <Controller
        key={name}
        name={name}
        control={control}
        render={({ field }) => (
          <FormField
            label={label}
            value={field.value ?? ''}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
            multiline={name !== 'task'}
            textAlignVertical="top"
            maxLength={maxLength}
            editable={!busy}
            error={errors[name]?.message}
            required={name === 'task' || name === 'whatIDid'}
          />
        )}
      />
    );
  }
  function finish() {
    clearErrors();
    const result = entryCompletedSchema.safeParse(getValues());
    setOrganizationError(!organization);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof EntryFormValues;
        setError(field, { message: issue.message });
      }
      setStep(
        result.error.issues.some((issue) =>
          ['date', 'task', 'whatIDid'].includes(String(issue.path[0])),
        )
          ? 0
          : 1,
      );
      return;
    }
    if (!organization) {
      setStep(0);
      return;
    }
    if (completed) onDone();
    else onComplete(getValues());
  }
  return (
    <View className="flex-1 gap-4">
      <View
        className="flex-row gap-2"
        accessibilityLabel={`Step ${step + 1} of 3`}
      >
        {steps.map((label, index) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={`${index + 1}. ${label}`}
            accessibilityState={{ selected: step === index }}
            className="min-h-touch flex-1 justify-center"
            disabled={busy}
            onPress={() => setStep(index)}
          >
            <View
              className={`h-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-border'}`}
            />
          </Pressable>
        ))}
      </View>
      <Animated.View style={{ opacity }} className="gap-4">
        <Typography variant="title">{steps[step]}</Typography>
        <View
          style={{ display: step === 0 ? 'flex' : 'none' }}
          className="gap-4"
          pointerEvents={busy ? 'none' : 'auto'}
        >
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateField
                label="Work date"
                required
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.date?.message}
                disabled={busy}
              />
            )}
          />
          <EntryOrganizationSelector
            initialSelection={initialOrganization}
            preserveArchived={existing}
            onChange={handleOrganization}
            onLabelsChange={setLabels}
          />
          {organizationError && (
            <Feedback error message="Choose a company and project." />
          )}
          {textField('task')}
          {textField('whatIDid')}
        </View>
        {step === 1 && (
          <>
            {textField('whoItHelped')}
            <Typography variant="label">Impact categories</Typography>
            <Controller
              name="impactCategories"
              control={control}
              render={({ field }) => (
                <View className="flex-row flex-wrap gap-2">
                  {(['technical', 'business', 'people'] as const).map(
                    (category) => {
                      const selected = field.value?.includes(category);
                      return (
                        <Button
                          key={category}
                          title={category[0].toUpperCase() + category.slice(1)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          variant={selected ? 'primary' : 'secondary'}
                          disabled={busy}
                          onPress={() =>
                            field.onChange(
                              selected
                                ? field.value?.filter(
                                    (value) => value !== category,
                                  )
                                : [...(field.value ?? []), category],
                            )
                          }
                        />
                      );
                    },
                  )}
                </View>
              )}
            />
            {textField('companyImpact')}
            <Typography variant="label">Impact status</Typography>
            <Controller
              name="impactStatus"
              control={control}
              render={({ field }) => (
                <View className="flex-row flex-wrap gap-2">
                  {(['pending', 'known', 'not_measurable'] as const).map(
                    (status) => (
                      <Button
                        key={status}
                        title={
                          status === 'not_measurable'
                            ? 'Not measurable'
                            : status[0].toUpperCase() + status.slice(1)
                        }
                        accessibilityRole="radio"
                        accessibilityState={{
                          selected: field.value === status,
                        }}
                        variant={
                          field.value === status ? 'primary' : 'secondary'
                        }
                        disabled={busy}
                        onPress={() => field.onChange(status)}
                      />
                    ),
                  )}
                </View>
              )}
            />
            {textField('impactMetrics')}
          </>
        )}
        {step === 2 && (
          <>
            {textField('notesAndPraise')}
            <Typography variant="label">Attach images</Typography>
            <Typography variant="caption">
              Images cannot be attached yet. Avoid including confidential
              company information.
            </Typography>
            <Typography variant="title">Review</Typography>
            <Typography>Date: {values.date || 'Not set'}</Typography>
            <Typography>Task: {values.task || 'Untitled draft'}</Typography>
            <Typography>
              {values.whatIDid || 'Work description not set'}
            </Typography>
            <Typography>
              Impact: {values.impactStatus?.replaceAll('_', ' ') ?? 'pending'}
            </Typography>
            <Typography>
              Company: {labels?.company ?? 'Not selected'}
            </Typography>
            <Typography>
              Project: {labels?.project ?? 'Not selected'}
            </Typography>
          </>
        )}
      </Animated.View>
      <View className="mt-auto gap-3 pt-4">
        <View className="flex-row gap-3">
          {step > 0 && (
            <Button
              title="Previous"
              className="flex-1"
              variant="secondary"
              disabled={busy}
              onPress={() => setStep(step - 1)}
            />
          )}
          {!completed && (
            <Button
              title="Discard"
              variant="danger-soft"
              className="flex-1"
              disabled={busy}
              onPress={onDiscard}
            />
          )}
          {step < 2 ? (
            <Button
              title="Next"
              className="flex-1"
              disabled={busy}
              onPress={() => setStep(step + 1)}
            />
          ) : (
            <Button
              title={completed ? 'Done' : 'Complete'}
              className="flex-1"
              disabled={busy}
              onPress={finish}
            />
          )}
        </View>
      </View>
    </View>
  );
}
