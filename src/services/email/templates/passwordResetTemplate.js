const passwordResetTemplate = ({ resetLink, token }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 50px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2f2c57;
    }
    p {
      font-size: 16px;
      line-height: 1.5;
      color: #333333;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 25px;
      font-size: 16px;
      color: #ffffff;
      background-color: #2f2c57;
      text-decoration: none;
      border-radius: 5px;
    }
    .token-box {
      margin-top: 20px;
      padding: 12px;
      background: #f2f2f2;
      border-radius: 5px;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 2px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #999999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password</h1>
    <p>You requested to reset your password.</p>

    <p>Use the token below if prompted:</p>
    <div class="token-box">${token}</div>

    <p>Or click the button below to reset your password directly:</p>
    <a href="${resetLink}" class="button">Reset Password</a>

    <p>If the button doesn’t work, copy and paste this link into your browser:</p>
    <p><a href="${resetLink}">${resetLink}</a></p>

    <div class="footer">
      <p>If you didn’t request a password reset, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

export default passwordResetTemplate;
