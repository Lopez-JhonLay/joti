import { Stack, useLocalSearchParams } from 'expo-router';
import { CompanyScreen } from '@/components/companies/company-screen';

export default function CompanyDetailRoute() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'Company', headerShown: false }} />
      <CompanyScreen mode="detail" companyId={companyId} />
    </>
  );
}
