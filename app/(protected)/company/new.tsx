import { Stack } from 'expo-router';
import { CompanyScreen } from '@/components/companies/company-screen';

export default function NewCompanyRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'Add company', headerShown: false }} />
      <CompanyScreen mode="create" />
    </>
  );
}
