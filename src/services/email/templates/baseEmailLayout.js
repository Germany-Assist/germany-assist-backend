export default function baseLayout({ title, content }) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
    </head>
    <body style="font-family: Arial; background:#f9f9f9; padding:20px;">
      <table width="600" align="center" style="background:white; padding:20px; border-radius:8px;">
        <tr>
          <td>
            <h2 style="color:#333;">${title}</h2>
            <div style="color:#555; font-size:14px;">
              ${content}
            </div>
            <hr />
            <p style="font-size:12px; color:#999;">
              © ${new Date().getFullYear()} Germany-Assist
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
