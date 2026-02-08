/**
 * Extracts a user-friendly error message from an unknown error type.
 * @param err - The error object (can be Error, string, or unknown type)
 * @returns A string error message
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'string') {
    return err;
  }

  return 'Unexpected error occurred';
}
