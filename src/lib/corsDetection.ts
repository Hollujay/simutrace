export function isLikelyCorsError(err: unknown): boolean {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    return true;
  }

  if (err instanceof TypeError && err.message.includes('NetworkError')) {
    return true;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    const msg = (err as { message: string }).message;
    if (
      msg.includes('CORS') ||
      msg.includes('cors') ||
      msg.includes('cross-origin') ||
      msg.toLowerCase().includes('network error') ||
      msg.includes('ERR_NETWORK')
    ) {
      return true;
    }
  }

  return false;
}
