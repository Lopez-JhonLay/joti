import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { layout } from '@/constants/design-tokens';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/components/ui/feedback';
import { Divider } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';

export function ProjectArchiveSheet({
  visible,
  restoring,
  name,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  restoring: boolean;
  name: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const action = restoring ? 'Restore project' : 'Archive project';
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessible={false}
          className="absolute inset-0 bg-foreground/40"
          onPress={onCancel}
        />
        <View
          accessibilityViewIsModal
          className="rounded-t-card bg-surface"
          style={{
            maxHeight: '90%',
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }}
        >
          <ScrollView
            contentContainerClassName="gap-4 px-5 pt-6"
            contentContainerStyle={{
              paddingBottom: insets.bottom + layout.spacing[6],
            }}
          >
            <View className="flex-row items-center gap-3">
              <AnimatedIcon name="archive" />
              <Typography
                accessibilityRole="header"
                variant="title"
                className="flex-1"
              >
                {action}?
              </Typography>
            </View>
            <Typography className="font-semibold">{name}</Typography>
            <Typography>
              {restoring
                ? 'Move this project back to Active.'
                : 'Existing work stays in your history.'}
            </Typography>
            <Divider />
            {error && <Feedback error message={error} />}
            <View className="flex-row gap-3">
              <Button
                title="Cancel"
                className="flex-1"
                variant="secondary"
                disabled={busy}
                onPress={onCancel}
              />
              <Button
                title={action}
                className="flex-1"
                accessibilityLabel={`Confirm ${action.toLowerCase()}`}
                loading={busy}
                onPress={onConfirm}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
