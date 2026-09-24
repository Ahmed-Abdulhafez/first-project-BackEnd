const nodemailer = require("nodemailer");

// Create transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: {
    rejectUnauthorized: false,
  },
});
/**
 * Send Email 
 * @param {Object} options  
 * @param {string} options.to - Recipient email *
 * @param {string} options.subject - Email subject *
 * @param {string} options.html - Email HTML content
 *
 **/

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"Evo Store" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer Error:", error);
    throw error;
  }
};
module.exports = sendEmail;
