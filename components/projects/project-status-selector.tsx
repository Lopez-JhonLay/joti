import { Pressable, View } from 'react-native';
import { Typography } from '@/components/ui/typography';
import type { Doc } from '@/convex/_generated/dataModel';

type ProjectStatus = Doc<'projects'>['status'];
export type ProjectFilter = ProjectStatus | 'all';

export function ProjectStatusSelector({
  value,
  onChange,
  disabled = false,
  includeAll = false,
}: {
  value: ProjectFilter;
  onChange: (value: ProjectFilter) => void;
  disabled?: boolean;
  includeAll?: boolean;
}) {
  const options: { value: ProjectFilter; label: string }[] = [
    ...(includeAll ? [{ value: 'all' as const, label: 'All' }] : []),
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
  ];
  return (
    <View
      className="flex-row flex-wrap gap-2"
      accessibilityRole="radiogroup"
      accessibilityLabel={
        includeAll ? 'Filter projects by status' : 'Project status'
      }
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="radio"
          accessibilityLabel={option.label}
          accessibilityState={{ checked: value === option.value, disabled }}
          disabled={disabled}
          onPress={() => onChange(option.value)}
          className={`control-base flex-1 ${value === option.value ? 'control-primary' : 'control-secondary'} ${disabled ? 'opacity-50' : ''}`}
        >
          <Typography
            variant="label"
            className={`shrink text-center ${value === option.value ? 'text-on-primary' : 'text-foreground'}`}
          >
            {option.label}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}
