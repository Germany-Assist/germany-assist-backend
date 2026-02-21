import baseLayout from "./baseEmailLayout.js";

function serviceStatusEmail({
  title,
  recipientName,
  mainMessage,
  serviceId,
  serviceTitle,
  status, // e.g., "Created", "Approved", "Rejected", "Published"
  includeSystemLog = false,
}) {
  const systemMessage = `Service ${serviceId} (${serviceTitle}) is now ${status}`;

  const content = `
    <p>Hello ${recipientName},</p>

    <p>${mainMessage}</p>

    <table style="margin-top:15px; font-size:14px;">
      <tr>
        <td><strong>Service ID:</strong></td>
        <td>${serviceId}</td>
      </tr>
      <tr>
        <td><strong>Title:</strong></td>
        <td>${serviceTitle}</td>
      </tr>
      <tr>
        <td><strong>Status:</strong></td>
        <td>${status}</td>
      </tr>

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

export default serviceStatusEmail;
