/**
 * Error Handler Utility
 * Cung cấp các hàm tiện ích để xử lý và format lỗi một cách nhất quán
 */

export interface ErrorInfo {
  title: string;
  description: string;
  type: 'network' | 'validation' | 'permission' | 'not_found' | 'server' | 'unknown';
  originalError?: any;
}

/**
 * Parse error từ API response hoặc exception
 */
export function parseError(error: any): ErrorInfo {
  // Network errors
  if (!error || error.message === 'Network request failed' || error.message === 'Failed to fetch') {
    return {
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.',
      type: 'network',
      originalError: error,
    };
  }

  // Timeout errors
  if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
    return {
      title: 'Hết thời gian chờ',
      description: 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.',
      type: 'network',
      originalError: error,
    };
  }

  // Extract error message from various sources
  let errorMessage = '';
  let statusCode: number | undefined;

  if (error.response) {
    // Axios error response
    statusCode = error.response.status;
    errorMessage = error.response.data?.message || error.response.data?.error || error.message;
  } else if (error.data) {
    // Direct API response
    statusCode = error.data.statusCode || error.statusCode;
    errorMessage = error.data.message || error.data.error || error.message;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Đã xảy ra lỗi không xác định';
  }

  // Handle specific status codes
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return {
          title: 'Lỗi dữ liệu',
          description: errorMessage || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.',
          type: 'validation',
          originalError: error,
        };
      case 401:
        return {
          title: 'Chưa đăng nhập',
          description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          type: 'permission',
          originalError: error,
        };
      case 403:
        return {
          title: 'Không có quyền',
          description: errorMessage || 'Bạn không có quyền thực hiện thao tác này.',
          type: 'permission',
          originalError: error,
        };
      case 404:
        return {
          title: 'Không tìm thấy',
          description: errorMessage || 'Không tìm thấy dữ liệu yêu cầu.',
          type: 'not_found',
          originalError: error,
        };
      case 409:
        return {
          title: 'Xung đột dữ liệu',
          description: errorMessage || 'Dữ liệu đã tồn tại hoặc bị xung đột.',
          type: 'validation',
          originalError: error,
        };
      case 422:
        return {
          title: 'Lỗi xác thực',
          description: errorMessage || 'Dữ liệu không đúng định dạng hoặc thiếu thông tin bắt buộc.',
          type: 'validation',
          originalError: error,
        };
      case 429:
        return {
          title: 'Quá nhiều yêu cầu',
          description: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một lát và thử lại.',
          type: 'server',
          originalError: error,
        };
      case 500:
      case 502:
      case 503:
        return {
          title: 'Lỗi server',
          description: 'Server đang gặp sự cố. Vui lòng thử lại sau.',
          type: 'server',
          originalError: error,
        };
    }
  }

  // Handle specific error messages (Vietnamese)
  const lowerMessage = errorMessage.toLowerCase();

  // Permission errors
  if (
    lowerMessage.includes('not assigned') ||
    lowerMessage.includes('không có quyền') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('forbidden')
  ) {
    return {
      title: 'Không có quyền',
      description: errorMessage || 'Bạn không có quyền thực hiện thao tác này.',
      type: 'permission',
      originalError: error,
    };
  }

  // Validation errors
  if (
    lowerMessage.includes('required') ||
    lowerMessage.includes('invalid') ||
    lowerMessage.includes('không hợp lệ') ||
    lowerMessage.includes('thiếu') ||
    lowerMessage.includes('bắt buộc')
  ) {
    return {
      title: 'Lỗi xác thực',
      description: errorMessage || 'Vui lòng kiểm tra lại thông tin đã nhập.',
      type: 'validation',
      originalError: error,
    };
  }

  // Not found errors
  if (
    lowerMessage.includes('not found') ||
    lowerMessage.includes('không tìm thấy') ||
    lowerMessage.includes('does not exist')
  ) {
    return {
      title: 'Không tìm thấy',
      description: errorMessage || 'Không tìm thấy dữ liệu yêu cầu.',
      type: 'not_found',
      originalError: error,
    };
  }

  // Time-related errors
  if (
    lowerMessage.includes('3 hours') ||
    lowerMessage.includes('đã qua') ||
    lowerMessage.includes('expired') ||
    lowerMessage.includes('hết hạn')
  ) {
    return {
      title: 'Hết thời gian',
      description: errorMessage || 'Thời gian đã hết hạn. Vui lòng thử lại.',
      type: 'validation',
      originalError: error,
    };
  }

  // Booking status errors
  if (
    lowerMessage.includes('cannot be confirmed') ||
    lowerMessage.includes('không thể xác nhận') ||
    lowerMessage.includes('already') ||
    lowerMessage.includes('đã')
  ) {
    return {
      title: 'Trạng thái không hợp lệ',
      description: errorMessage || 'Trạng thái hiện tại không cho phép thực hiện thao tác này.',
      type: 'validation',
      originalError: error,
    };
  }

  // Default error
  return {
    title: 'Đã xảy ra lỗi',
    description: errorMessage || 'Vui lòng thử lại sau.',
    type: 'unknown',
    originalError: error,
  };
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: any): string {
  const errorInfo = parseError(error);
  return errorInfo.description;
}

/**
 * Get error title
 */
export function getErrorTitle(error: any): string {
  const errorInfo = parseError(error);
  return errorInfo.title;
}

/**
 * Check if error is a specific type
 */
export function isErrorType(error: any, type: ErrorInfo['type']): boolean {
  const errorInfo = parseError(error);
  return errorInfo.type === type;
}

/**
 * Log error for debugging
 */
export function logError(error: any, context?: string): void {
  const errorInfo = parseError(error);
  console.error(`[Error Handler]${context ? ` [${context}]` : ''}:`, {
    title: errorInfo.title,
    description: errorInfo.description,
    type: errorInfo.type,
    originalError: errorInfo.originalError,
  });
}

