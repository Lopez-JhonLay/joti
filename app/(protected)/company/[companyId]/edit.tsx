import { Stack, useLocalSearchParams } from 'expo-router';
import { CompanyScreen } from '@/components/companies/company-screen';

export default function EditCompanyRoute() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Edit company', headerShown: false }} />
      <CompanyScreen mode="edit" companyId={companyId} />
    </>
  );
}
