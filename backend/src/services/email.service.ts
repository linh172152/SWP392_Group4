import nodemailer from "nodemailer";
import { CustomError } from "../middlewares/error.middleware";

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new CustomError("Failed to send email", 500);
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<void> => {
  const subject = "Welcome to EV Battery Swap!";
  const html = `
    <h1>Welcome to EV Battery Swap!</h1>
    <p>Hello ${name},</p>
    <p>Thank you for registering with EV Battery Swap. You can now start using our services!</p>
    <p>Best regards,<br>EV Battery Swap Team</p>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<void> => {
  const subject = "Password Reset - EV Battery Swap";
  const html = `
    <h1>Password Reset</h1>
    <p>You requested a password reset for your EV Battery Swap account.</p>
    <p>Click the link below to reset your password:</p>
    <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject,
    html,
  });
};
