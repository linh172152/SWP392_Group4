import { v2 as cloudinary } from "cloudinary";
import { CustomError } from "../middlewares/error.middleware";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload image to Cloudinary
 */
export const uploadImage = async (
  imagePath: string,
  folder?: string
): Promise<UploadResult> => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: folder || "ev-battery-swap",
      resource_type: "auto",
      quality: "auto",
      fetch_format: "auto",
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new CustomError("Failed to upload image to Cloudinary", 500);
  }
};

/**
 * Upload image from buffer
 */
export const uploadImageFromBuffer = async (
  buffer: Buffer,
  folder?: string
): Promise<UploadResult> => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: folder || "ev-battery-swap",
            resource_type: "auto",
            quality: "auto",
            fetch_format: "auto",
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }
            if (!result) {
              reject(new Error("No result from Cloudinary"));
              return;
            }
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
            });
          }
        )
        .end(buffer);
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new CustomError("Failed to upload image to Cloudinary", 500);
  }
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new CustomError("Failed to delete image from Cloudinary", 500);
  }
};

/**
 * Get image info
 */
export const getImageInfo = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary get info error:", error);
    throw new CustomError("Failed to get image info from Cloudinary", 500);
  }
};
