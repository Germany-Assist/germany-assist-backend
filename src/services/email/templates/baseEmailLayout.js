export default function baseLayout({ title, content }) {
  const year = new Date().getFullYear();

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background:#f9f9f9;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9; padding:20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; padding:20px;">
              <tr>
                <td>
                  <h2 style="color:#333; margin-top:0;">${title}</h2>
                  <div style="color:#555; font-size:14px; line-height:1.6;">
                    ${content}
                  </div>
                  <hr />
                  <p style="font-size:12px; color:#999; margin-bottom:0;">
                    © ${year} Germany-Assist
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
