import baseLayout from "./baseEmailLayout.js";

export function closedOrderEmail({
  providerName,
  userEmail,
  serviceTitle,
  orderId,
}) {
  const systemMessage = `Order ${orderId} was closed for user ${userEmail}  of service ${serviceTitle}`;

  const content = `
    <p>${providerName}</p>

    <p>
      Order has been successfully closed now its pending completion with 14 days of dispute window.
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
    </table>
    <hr />
    <p style="font-size:12px; color:#888;">
      System Log: ${systemMessage}
    </p>
  `;

  return baseLayout({
    title: "Order Closed",
    content,
  });
}
