import type { Doc } from '@/convex/_generated/dataModel';

export function companyInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...word][0] ?? '')
    .join('')
    .toLocaleUpperCase();
}

// Pickers use local calendar components. Never parse a date-only value as UTC:
// that shifts the selected day in negative-offset timezones.
export function companyDateForPicker(value?: string) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  if (value) {
    const [year, month, day] = value.split('-').map(Number);
    date.setFullYear(year, month - 1, day);
  }
  return date;
}

export function companyDateFromPicker(date: Date) {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function formatCompanyDate(value: string, withDay = false) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
    ...(withDay ? { day: 'numeric' } : {}),
  }).format(companyDateForPicker(value));
}

export function employmentDates(
  company: Pick<Doc<'companies'>, 'startDate' | 'endDate'>,
) {
  return company.startDate
    ? `${formatCompanyDate(company.startDate)} – ${company.endDate ? formatCompanyDate(company.endDate) : 'Present'}`
    : company.endDate
      ? `Ended ${formatCompanyDate(company.endDate)}`
      : 'Employment dates not added';
}
