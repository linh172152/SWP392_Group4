import { Request, Response } from "express";
import {
  uploadImageFromBuffer,
  deleteImage,
  getImageInfo,
} from "../services/cloudinary.service";
import { CustomError } from "../middlewares/error.middleware";

/**
 * Test Cloudinary connection
 */
export const testCloudinary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Test Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new CustomError("Cloudinary configuration missing", 500);
    }

    res.status(200).json({
      success: true,
      message: "Cloudinary configuration is valid",
      data: {
        cloudName,
        apiKey: apiKey.substring(0, 10) + "...", // Hide full key
        apiSecret: apiSecret.substring(0, 10) + "...", // Hide full secret
      },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to test Cloudinary configuration",
      });
    }
  }
};

/**
 * Upload test image
 */
export const uploadTestImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    );

    const result = await uploadImageFromBuffer(testImageBuffer, "test");

    res.status(200).json({
      success: true,
      message: "Test image uploaded successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to upload test image",
      });
    }
  }
};

/**
 * Delete test image
 */
export const deleteTestImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      throw new CustomError("Public ID is required", 400);
    }

    await deleteImage(publicId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: { publicId },
    });
  } catch (error) {
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to delete image",
      });
    }
  }
};
