/* Small authenticated fetch helper used across frontend services
   - attaches Authorization: Bearer <accessToken> when available
   - supports credentials include when needed (for cookie refresh)
   - returns parsed JSON or throws an Error with response info
*/
export interface FetchOptions extends RequestInit {
  useCredentials?: boolean; // when true, set credentials: 'include'
}

export async function authFetch(input: string, options: FetchOptions = {}) {
  const accessToken = localStorage.getItem("accessToken");

  const baseHeaders: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    baseHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const fetchOpts: RequestInit = {
    ...options,
    headers: baseHeaders,
  };

  if (options.useCredentials) {
    // include cookies for endpoints that rely on httpOnly refresh_token
    (fetchOpts as any).credentials = "include";
  }

  const res = await fetch(input, fetchOpts);
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = text;
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || res.statusText || "Request failed");
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}

export default authFetch;
