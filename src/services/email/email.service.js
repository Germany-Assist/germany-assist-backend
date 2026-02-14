import nodemailer from "nodemailer";
import { errorLogger, infoLogger } from "../../utils/loggers.js";
import {
  EMAIL_HOST,
  EMAIL_PASS,
  EMAIL_SMTP_PORT,
  EMAIL_USER,
} from "../../configs/email.config.js";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_SMTP_PORT,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      await this.transporter.sendMail({
        from: `"Germany Assist" <${EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
      });
      infoLogger(`📧 Email sent to ${to} for ${subject}`);
    } catch (err) {
      errorLogger(
        `❌ Failed to send email for ${subject} to ${to}:`,
        err.message,
      );
      throw err;
    }
  }
}

export default new EmailService();
