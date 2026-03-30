import baseLayout from "./baseEmailLayout.js";

export function disputeEmail({
  title,
  recipientName,
  message,
  disputeId,
  orderId,
}) {
  const content = `
    <p>Hello ${recipientName},</p>

    <p>${message}</p>

    <p style="margin-top:15px; font-size:14px;">
      <strong>Dispute ID:</strong> ${disputeId}<br/>
      <strong>Order ID:</strong> ${orderId}
    </p>
  `;

  return baseLayout({
    title,
    content,
  });
}
