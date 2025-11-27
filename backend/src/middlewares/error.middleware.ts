import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Custom error class
 */
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  let { statusCode = 500, message } = error;

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Prisma errors
  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as any;

    switch (prismaError.code) {
      case "P2002":
        statusCode = 409;
        message = "Resource already exists";
        break;
      case "P2025":
        statusCode = 404;
        message = "Resource not found";
        break;
      case "P2003":
        statusCode = 400;
        message = "Invalid reference";
        break;
      case "P1001":
        statusCode = 500;
        message = "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau.";
        break;
      case "P1008":
        statusCode = 500;
        message = "Thao tác quá thời gian chờ. Vui lòng thử lại.";
        break;
      case "P2011":
        statusCode = 400;
        message = "Thiếu thông tin bắt buộc";
        break;
      case "P2012":
        statusCode = 400;
        message = "Thiếu giá trị bắt buộc";
        break;
      case "P2014":
        statusCode = 400;
        message = "Thiếu quan hệ dữ liệu bắt buộc";
        break;
      case "P2015":
        statusCode = 404;
        message = "Không tìm thấy bản ghi";
        break;
      case "P2016":
        statusCode = 400;
        message = "Lỗi truy vấn dữ liệu";
        break;
      case "P2017":
        statusCode = 400;
        message = "Dữ liệu quan hệ không được kết nối";
        break;
      case "P2018":
        statusCode = 400;
        message = "Thiếu dữ liệu quan hệ bắt buộc";
        break;
      case "P2019":
        statusCode = 400;
        message = "Lỗi dữ liệu đầu vào";
        break;
      case "P2020":
        statusCode = 400;
        message = "Giá trị nằm ngoài phạm vi cho phép";
        break;
      case "P2021":
        statusCode = 500;
        message = "Bảng dữ liệu không tồn tại";
        break;
      case "P2022":
        statusCode = 500;
        message = "Cột dữ liệu không tồn tại";
        break;
      case "P2023":
        statusCode = 400;
        message = "Dữ liệu không nhất quán";
        break;
      case "P2024":
        statusCode = 500;
        message = "Hết kết nối cơ sở dữ liệu. Vui lòng thử lại sau.";
        break;
      case "P2026":
        statusCode = 400;
        message = "Tính năng không được hỗ trợ";
        break;
      case "P2027":
        statusCode = 400;
        message = "Nhiều lỗi xảy ra";
        break;
      case "P2030":
        statusCode = 500;
        message = "Lỗi chỉ mục tìm kiếm";
        break;
      case "P2033":
        statusCode = 400;
        message = "Giá trị số quá lớn";
        break;
      case "P2034":
        statusCode = 409;
        message = "Xung đột dữ liệu. Vui lòng thử lại.";
        break;
      default:
        statusCode = 500;
        // Hiển thị message gốc từ Prisma nếu có, hoặc message mặc định
        message =
          prismaError.meta?.cause ||
          prismaError.message ||
          "Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.";
        // Log chi tiết lỗi để debug
        console.error("Unhandled Prisma error:", {
          code: prismaError.code,
          message: prismaError.message,
          meta: prismaError.meta,
        });
    }
  }

  // Prisma Client Validation Error
  if (error.name === "PrismaClientValidationError") {
    statusCode = 400;
    message = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.";
  }

  // Prisma Client Initialization Error (connection issues)
  if (error.name === "PrismaClientInitializationError") {
    statusCode = 500;
    message =
      "Không thể kết nối đến cơ sở dữ liệu. Vui lòng liên hệ quản trị viên.";
  }

  // Log error (always log in production too, but without sensitive data)
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", {
      message: error.message,
      stack: error.stack,
      statusCode,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    // Production logging - log error details but be careful with sensitive data
    console.error("Error:", {
      message: error.message,
      name: error.name,
      statusCode,
      url: req.url,
      method: req.method,
      // Don't log body in production to avoid logging passwords
      ...(error.stack && { stack: error.stack }),
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

/**
 * Async error wrapper
 */
type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown> | void;

export const asyncHandler = (fn: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found middleware
 */
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
