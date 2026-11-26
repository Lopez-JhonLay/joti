import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
  type ComponentRef,
} from 'react';
import {
  Keyboard,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { Typography } from '@/components/ui/typography';
import { layout } from '@/constants/design-tokens';
import { keyboardLayout } from '@/lib/keyboard-layout';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { FormKeyboardContext, type FormInput } from './form-keyboard-context';
import { useTheme } from '@/lib/theme';

type ScreenFrameProps = PropsWithChildren<{
  title: string;
  onBack?: () => void;
  actions?: ReactNode;
  busy?: boolean;
  busyLabel?: string;
}>;

export function ScreenFrame({
  title,
  onBack,
  actions,
  children,
  busy = false,
  busyLabel = 'Saving changes',
}: ScreenFrameProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const focusedInput = useRef<FormInput>(null);
  const scrollOffset = useRef(0);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const reducedMotion = useReducedMotion();
  const pendingFrame = useRef<number | null>(null);
  const revealFocusedField = useCallback(() => {
    if (!Keyboard.isVisible()) return;
    if (pendingFrame.current !== null)
      cancelAnimationFrame(pendingFrame.current);
    // Measure after the keyboard's viewport resize and the latest input layout.
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = null;
      const input = focusedInput.current;
      const keyboardTop = Keyboard.metrics()?.screenY;
      const viewport = scroll.current?.getNativeScrollRef();
      if (!input || keyboardTop === undefined || !viewport) return;
      viewport.measureInWindow((_x, viewportY, _width, viewportHeight) => {
        if (focusedInput.current !== input || !Keyboard.isVisible()) return;
        input.measureInWindow((_fieldX, fieldY, _fieldWidth, fieldHeight) => {
          if (focusedInput.current !== input || !Keyboard.isVisible()) return;
          const adjustment = keyboardLayout({
            keyboardTop,
            viewportBottom: viewportY + viewportHeight,
            fieldBottom: fieldY + fieldHeight,
            scrollOffset: scrollOffset.current,
            clearance: layout.spacing[4],
          });
          setKeyboardInset(adjustment.bottomInset);
          if (adjustment.scrollTo > scrollOffset.current) {
            scroll.current?.scrollTo({
              y: adjustment.scrollTo,
              animated: !reducedMotion,
            });
          }
        });
      });
    });
  }, [reducedMotion]);
  const focus = useCallback(
    (input: FormInput | null) => {
      focusedInput.current = input;
      revealFocusedField();
    },
    [revealFocusedField],
  );
  const blur = useCallback((input: FormInput | null) => {
    if (focusedInput.current === input) focusedInput.current = null;
  }, []);
  useEffect(() => {
    const subscription = Keyboard.addListener(
      'keyboardDidShow',
      revealFocusedField,
    );
    const hidden = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardInset(0),
    );
    return () => {
      subscription.remove();
      hidden.remove();
      if (pendingFrame.current !== null)
        cancelAnimationFrame(pendingFrame.current);
    };
  }, [revealFocusedField]);
  useEffect(
    () => () => {
      focusedInput.current = null;
    },
    [],
  );
  return (
    <FormKeyboardContext.Provider value={{ focus, blur }}>
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        <View
          className="mx-auto w-full max-w-reading flex-row items-center gap-3 px-5 sm:px-6"
          style={{ minHeight: layout.touchTarget + layout.spacing[2] }}
        >
          {onBack && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={onBack}
              className="min-h-touch items-center justify-center rounded-control active:bg-elevated"
              style={{ minWidth: layout.touchTarget }}
            >
              {({ pressed }) => (
                <AnimatedIcon name="arrow-left" active={pressed} />
              )}
            </Pressable>
          )}
          <Typography
            accessibilityRole="header"
            variant="heading"
            className="flex-1 py-2"
          >
            {title}
          </Typography>
          {actions && (
            <View className="shrink-0 flex-row items-center gap-2">
              {actions}
            </View>
          )}
        </View>
        <ScrollView
          ref={scroll}
          className="flex-1"
          contentContainerClassName="grow"
          contentContainerStyle={{
            paddingBottom: insets.bottom + keyboardInset,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={false}
          onScroll={(event) => {
            scrollOffset.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          onLayout={revealFocusedField}
          onContentSizeChange={revealFocusedField}
        >
          <View className="mx-auto w-full max-w-reading flex-1 gap-6 px-5 pb-6 pt-6 sm:px-6">
            {children}
          </View>
        </ScrollView>
        {busy && (
          <View
            accessibilityViewIsModal
            className="absolute inset-0 items-center justify-center bg-background/60"
          >
            <ActivityIndicator
              accessible
              accessibilityState={{ busy: true }}
              size="large"
              color={colors.primary}
              accessibilityRole="progressbar"
              accessibilityLabel={busyLabel}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </FormKeyboardContext.Provider>
  );
}
