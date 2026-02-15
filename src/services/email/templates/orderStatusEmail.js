import baseLayout from "./baseEmailLayout.js";

export function orderStatusEmail({
  title,
  recipientName,
  mainMessage,
  orderId,
  serviceTitle,
  relatedUserEmail,
  relatedProviderName,
  includeSystemLog = false,
}) {
  const systemMessage = `Order ${orderId} for service ${serviceTitle}`;

  const content = `
    <p>Hello ${recipientName},</p>

    <p>${mainMessage}</p>

    <table style="margin-top:15px; font-size:14px;">
      <tr>
        <td><strong>Order ID:</strong></td>
        <td>${orderId}</td>
      </tr>
      <tr>
        <td><strong>Service:</strong></td>
        <td>${serviceTitle}</td>
      </tr>
      ${
        relatedUserEmail
          ? `
        <tr>
          <td><strong>User:</strong></td>
          <td>${relatedUserEmail}</td>
        </tr>
      `
          : ""
      }
      ${
        relatedProviderName
          ? `
        <tr>
          <td><strong>Service Provider:</strong></td>
          <td>${relatedProviderName}</td>
        </tr>
      `
          : ""
      }
    </table>

    ${
      includeSystemLog
        ? `
      <hr />
      <p style="font-size:12px; color:#888;">
        System Log: ${systemMessage}
      </p>
    `
        : ""
    }
  `;

  return baseLayout({
    title,
    content,
  });
}
