// lib/network-utils.ts
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';

  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('err_name_not_resolved') ||
    message.includes('fetch') ||
    name.includes('network') ||
    error.code === 'ERR_NAME_NOT_RESOLVED' ||
    error.status === 0 // Network error typically has status 0
  );
}

export async function checkNetworkAvailability(): Promise<boolean> {
  try {
    // Try to ping a lightweight endpoint
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    console.warn('Network check failed:', error);
    return false;
  }
}

export async function waitForNetwork(maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkNetworkAvailability()) {
      return true;
    }
    // Wait 1 second before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}
