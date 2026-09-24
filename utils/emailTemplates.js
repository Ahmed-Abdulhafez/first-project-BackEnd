exports.verifyEmailTemplate = (username, verificationUrl) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">Welcome to Evo Store, ${username} 👋</h2>
      <p style="color: #555; font-size: 16px;">Thank you for creating your account. We're excited to have you on board!</p>
      <p style="color: #555; font-size: 16px;">Please click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 25px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Verify Email
        </a>
      </div>
      <p style="color: #999; font-size: 14px;">This link will expire in 15 minutes.</p>
    </div>
  `;
};
