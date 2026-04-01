import nodemailer from "nodemailer";
import { errorLogger, infoLogger } from "../../utils/loggers.js";
import {
  EMAIL_HOST,
  EMAIL_PASS,
  EMAIL_SMTP_PORT,
  EMAIL_USER,
  SEND_EMAILS,
} from "../../configs/email.config.js";
import { NODE_ENV } from "../../configs/serverConfig.js";

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
    if (!SEND_EMAILS) return;
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
      errorLogger(err);
      if (NODE_ENV !== "production") throw err;
      return;
    }
  }
}

export default new EmailService();
