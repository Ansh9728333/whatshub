const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit & { workspaceId?: string; token?: string } = {}
): Promise<{ success: boolean; data?: T; error?: any }> {
  const { workspaceId, token, headers, ...customConfig } = options;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (workspaceId) {
    reqHeaders['x-workspace-id'] = workspaceId;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...customConfig,
      headers: reqHeaders,
    });

    const result = await response.json();
    return result;
  } catch (err: any) {
    return {
      success: false,
      error: { message: err.message || 'Network error occurred.' },
    };
  }
}
