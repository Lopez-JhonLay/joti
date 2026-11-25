import {
  companyDateForPicker,
  companyDateFromPicker,
  companyInitials,
  employmentDates,
} from '../lib/company-presentation';

test.each(['2024-02-29', '2025-01-01', '0099-12-31'])(
  'calendar values round-trip through local components without UTC shifts: %s',
  (value) => {
    const date = companyDateForPicker(value);
    expect(date.getHours()).toBe(12);
    expect(companyDateFromPicker(date)).toBe(value);
  },
);

test('employment summaries distinguish ongoing work, an end date, and unset dates', () => {
  expect(employmentDates({ startDate: '2024-01-01' })).toBe(
    'Jan 2024 – Present',
  );
  expect(employmentDates({ endDate: '2025-12-01' })).toBe('Ended Dec 2025');
  expect(employmentDates({})).toBe('Employment dates not added');
});

test('initials use at most two words and tolerate extra spaces and Unicode', () => {
  expect(companyInitials(' Northstar  Studio ')).toBe('NS');
  expect(companyInitials('Acme')).toBe('A');
  expect(companyInitials('Élan Work Group')).toBe('ÉW');
});
