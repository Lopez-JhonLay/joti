import { companySchema } from '../lib/company-validation';

test.each([
  '2023-02-29',
  '2024-02-30',
  '2024-04-31',
  '2024-13-01',
  '0000-01-01',
  '2024-1-01',
  '01/01/2024',
  'yesterday',
])('rejects invalid date-only values: %s', (startDate) => {
  const result = companySchema.safeParse({ name: 'Acme', startDate });
  expect(result.success).toBe(false);
  if (!result.success)
    expect(result.error.issues[0].path).toEqual(['startDate']);
});

test('accepts leap days, equal employment dates, and optional dates', () => {
  expect(
    companySchema.parse({
      name: ' Acme ',
      startDate: '2024-02-29',
      endDate: '2024-02-29',
    }),
  ).toMatchObject({
    name: 'Acme',
    startDate: '2024-02-29',
    endDate: '2024-02-29',
  });
  expect(
    companySchema.parse({
      name: 'Acme',
      jobTitle: ' ',
      startDate: '',
      endDate: '',
    }),
  ).toEqual({
    name: 'Acme',
    jobTitle: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  expect(
    companySchema.safeParse({ name: 'Acme', endDate: '2024-02-29' }).success,
  ).toBe(true);
});

test('an inverted range points to the end date for field-specific feedback', () => {
  const result = companySchema.safeParse({
    name: 'Acme',
    startDate: '2025-01-01',
    endDate: '2024-12-31',
  });
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.issues[0].path).toEqual(['endDate']);
});
