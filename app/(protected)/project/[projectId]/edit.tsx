import { Stack, useLocalSearchParams } from 'expo-router';
import { ProjectScreen } from '@/components/projects/project-screen';

export default function EditProjectRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Edit project', headerShown: false }} />
      <ProjectScreen mode="edit" projectId={projectId} />
    </>
  );
}
