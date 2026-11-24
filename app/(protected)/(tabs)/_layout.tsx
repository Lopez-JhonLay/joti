import { Tabs } from 'expo-router/js-tabs';

import { AddEntryButton } from '@/components/ui/add-entry-button';
import { fonts, layout } from '@/constants/design-tokens';
import { useTheme, useNavigationStyles } from '@/lib/theme';
import type { AnimatedIconName } from '@/components/ui/animated-icon';
import {
  PillTabBar,
  PillTabButton,
  PillTabIcon,
  PillTabIndicator,
} from '@/components/ui/pill-tab-bar';

const tabIcons: Record<string, AnimatedIconName> = {
  index: 'house',
  history: 'history',
  companies: 'building-2',
  settings: 'settings',
};

export default function TabsLayout() {
  const { colors } = useTheme();
  const navigationStyles = useNavigationStyles();
  return (
    <Tabs
      backBehavior="history"
      safeAreaInsets={{ bottom: 0 }}
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={({ route }) => ({
        ...navigationStyles,
        headerRight: () => <AddEntryButton />,
        tabBarIcon: ({ color, size }) => (
          <PillTabIcon
            routeName={route.name}
            name={tabIcons[route.name] ?? 'house'}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: colors.link,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarBackground: () => <PillTabIndicator />,
        tabBarButton: (props) => <PillTabButton {...props} />,
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          borderRadius: layout.radius.pill,
          marginHorizontal: layout.spacing[1] / 2,
          minHeight: layout.touchTarget,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderTopWidth: 0,
          height: layout.touchTarget + layout.spacing[6],
          paddingTop: layout.spacing[2],
          paddingBottom: layout.spacing[2],
          paddingHorizontal: layout.spacing[2],
          elevation: 0,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.background },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="companies" options={{ title: 'Companies' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
