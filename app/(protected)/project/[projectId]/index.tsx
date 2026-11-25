import { Stack, useLocalSearchParams } from 'expo-router';
import { ProjectScreen } from '@/components/projects/project-screen';

export default function ProjectDetailRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Project', headerShown: false }} />
      <ProjectScreen mode="detail" projectId={projectId} />
    </>
  );
}
