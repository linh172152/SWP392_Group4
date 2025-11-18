/* Small authenticated fetch helper used across frontend services
   - attaches Authorization: Bearer <accessToken> when available
   - supports credentials include when needed (for cookie refresh)
   - returns parsed JSON or throws an Error with response info
*/
export interface FetchOptions extends RequestInit {
  useCredentials?: boolean; // when true, set credentials: 'include'
  _retry?: boolean; // internal flag to prevent infinite refresh loops
}

// Helper to check if token is expired or about to expire (within 2 minutes)
function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds

    return exp - now < twoMinutes;
  } catch {
    return true; // If can't parse, assume expired
  }
}

// Helper to refresh access token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    return null;
  }

  try {
    // Get API base URL from config (Vite uses import.meta.env)
    const API_BASE_URL =
      import.meta.env.VITE_API_URL ||
      "https://ev-battery-backend.onrender.com/api";
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem("accessToken", data.data.accessToken);
      return data.data.accessToken;
    }
    return null;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return null;
  }
}

export async function authFetch(input: string, options: FetchOptions = {}) {
  let accessToken = localStorage.getItem("accessToken");

  // Auto-refresh token if expiring soon
  if (isTokenExpiringSoon(accessToken)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      accessToken = newToken;
    } else {
      // Refresh failed, clear tokens and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("ev_swap_user");

      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/staff")) {
        window.location.href = "/staff/login";
      } else if (currentPath.startsWith("/admin")) {
        window.location.href = "/admin/login";
      } else {
        window.location.href = "/";
      }
      throw new Error("Session expired. Please login again.");
    }
  }

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
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
    // 🔍 Enhanced error logging for debugging
    let requestBody = null;
    try {
      requestBody = options.body ? JSON.parse(options.body as string) : null;
    } catch (e) {
      requestBody = options.body;
    }

    console.group(" API Request Failed");
    console.error(" URL:", input);
    console.error(" Method:", options.method || "GET");
    console.error(" Status:", res.status, res.statusText);
    console.error(" Response:", data);
    console.error(" Request Body:", requestBody);
    console.groupEnd();

    // Handle 401 - try to refresh token once, then redirect to login
    if (res.status === 401) {
      // Skip refresh if we just tried (avoid infinite loop)
      if (!options._retry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the request with new token
          return authFetch(input, { ...options, _retry: true });
        }
      }

      // Refresh failed or already retried, clear tokens and redirect
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("ev_swap_user");

      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/staff")) {
        window.location.href = "/staff/login";
      } else if (currentPath.startsWith("/admin")) {
        window.location.href = "/admin/login";
      } else {
        window.location.href = "/";
      }
    }

    const err = new Error(
      (data && data.message) || res.statusText || "Request failed"
    );
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data;
}

export default authFetch;
