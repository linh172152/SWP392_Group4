import { Request, Response } from "express";
import { sendEmail, sendWelcomeEmail } from "../services/email.service";
import { CustomError } from "../middlewares/error.middleware";

/**
 * Test email service
 */
export const testEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new CustomError("Email is required", 400);
    }

    await sendEmail({
      to: email,
      subject: "Test Email - EV Battery Swap",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from EV Battery Swap backend.</p>
        <p>If you receive this email, the email service is working correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Test email sent successfully",
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
        message: "Failed to send test email",
      });
    }
  }
};

/**
 * Test welcome email
 */
export const testWelcomeEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      throw new CustomError("Email and name are required", 400);
    }

    await sendWelcomeEmail(email, name);

    res.status(200).json({
      success: true,
      message: "Welcome email sent successfully",
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
        message: "Failed to send welcome email",
      });
    }
  }
};


