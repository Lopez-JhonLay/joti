import { Stack } from 'expo-router';
import { useNavigationStyles } from '@/lib/theme';

export default function AuthLayout() {
  const styles = useNavigationStyles();
  return (
    <Stack screenOptions={{ ...styles, title: 'Joti', headerShown: false }} />
  );
}
