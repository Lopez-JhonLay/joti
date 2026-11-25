import { ConvexError } from 'convex/values';

export function requestErrorMessage(error: unknown) {
  if (
    error instanceof ConvexError &&
    typeof error.data === 'object' &&
    error.data !== null
  ) {
    const data = error.data as Record<string, unknown>;
    if (
      [
        'VALIDATION_ERROR',
        'HAS_RELATED_RECORDS',
        'NOT_FOUND',
        'UNAUTHENTICATED',
      ].includes(String(data.code)) &&
      typeof data.message === 'string'
    ) {
      return data.message;
    }
  }
  return 'Unable to complete this request. Check your connection and try again.';
}
