/**
 * Utility để retry API calls khi gặp rate limit
 */

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Chỉ retry cho 429 (rate limit) và 503 (service unavailable)
      if (error.status === 429 || error.status === 503) {
        if (attempt < maxRetries) {
          const delayTime = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`API rate limited. Retrying in ${delayTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await delay(delayTime);
          continue;
        }
      }
      
      // Throw ngay lập tức cho các lỗi khác
      throw error;
    }
  }
  
  throw lastError!;
};