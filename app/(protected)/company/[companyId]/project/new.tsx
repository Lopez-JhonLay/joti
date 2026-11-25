import { Stack, useLocalSearchParams } from 'expo-router';
import { ProjectScreen } from '@/components/projects/project-screen';

export default function NewProjectRoute() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Add project', headerShown: false }} />
      <ProjectScreen mode="create" companyId={companyId} />
    </>
  );
}
