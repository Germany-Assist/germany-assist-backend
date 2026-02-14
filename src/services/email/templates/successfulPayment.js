import baseLayout from "./baseEmailLayout.js";

export function successfulPaymentEmail({
  providerName,
  userEmail,
  relatedType,
  relatedHashId,
  serviceTitle,
  amount,
}) {
  const systemMessage = `Successful payment from user ${userEmail} for ${relatedType} ${relatedHashId} of service ${serviceTitle}`;

  const content = `
    <p>${providerName}</p>

    <p>Great news! 🎉</p>

    <p>
      A payment has been successfully processed for the service.
    </p>

    <table style="margin-top:15px; font-size:14px;">
      <tr>
        <td><strong>Service:</strong></td>
        <td>${serviceTitle}</td>
      </tr>
      <tr>
        <td><strong>Paid By:</strong></td>
        <td>${userEmail}</td>
      </tr>
      <tr>
        <td><strong>Reference:</strong></td>
        <td>${relatedType} ${relatedHashId}</td>
      </tr>
      ${
        amount
          ? `
      <tr>
        <td><strong>Amount:</strong></td>
        <td>$${amount}</td>
      </tr>`
          : ""
      }
    </table>

    <p style="margin-top:20px;">
      You can now start working on the order.
    </p>

    <hr />
    <p style="font-size:12px; color:#888;">
      System Log: ${systemMessage}
    </p>
  `;

  return baseLayout({
    title: "Order Activated – Payment Successful",
    content,
  });
}
