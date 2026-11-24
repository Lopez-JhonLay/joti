import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion() {
  // Keep decorative motion off until the phone's preference is known.
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    let current = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        changed = true;
        setReducedMotion(enabled);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        if (current && !changed) setReducedMotion(enabled);
      },
      () => {
        /* Preserve the safe, static default if the platform query fails. */
      },
    );
    return () => {
      current = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
