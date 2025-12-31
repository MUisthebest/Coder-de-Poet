using System.Net;
using System.Net.Mail;

namespace auth_service.Application.Service
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string resetUrl)
        {
            try
            {
                var smtpServer = _configuration["Email:SmtpServer"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var senderEmail = _configuration["Email:SenderEmail"] ?? "";
                var senderPassword = _configuration["Email:SenderPassword"] ?? "";
                var senderName = _configuration["Email:SenderName"] ?? "Learnix";

                if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
                {
                    _logger.LogWarning("Email configuration is missing");
                    return false;
                }

                var subject = "Reset Your Password - Learnix";
                var body = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                            <div style='max-width: 600px; margin: 0 auto;'>
                                <h2 style='color: #2c3e50;'>Password Reset Request</h2>
                                <p>We received a request to reset your password. Click the link below to proceed:</p>
                                
                                <p style='text-align: center; margin: 30px 0;'>
                                    <a href='{resetUrl}' style='background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>
                                        Reset Password
                                    </a>
                                </p>
                                
                                <p>Or copy and paste this link in your browser:</p>
                                <p style='word-break: break-all;'>{resetUrl}</p>
                                
                                <p style='color: #e74c3c;'><strong>⚠️ This link will expire in 1 hour.</strong></p>
                                
                                <p>If you didn't request a password reset, please ignore this email or contact our support team.</p>
                                
                                <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
                                <p style='font-size: 12px; color: #7f8c8d;'>
                                    Learnix © {DateTime.Now.Year}. All rights reserved.
                                </p>
                            </div>
                        </body>
                    </html>
                ";

                using (var smtpClient = new SmtpClient(smtpServer, smtpPort))
                {
                    smtpClient.EnableSsl = true;
                    smtpClient.Credentials = new NetworkCredential(senderEmail, senderPassword);

                    using (var mailMessage = new MailMessage())
                    {
                        mailMessage.From = new MailAddress(senderEmail, senderName);
                        mailMessage.To.Add(email);
                        mailMessage.Subject = subject;
                        mailMessage.Body = body;
                        mailMessage.IsBodyHtml = true;

                        await smtpClient.SendMailAsync(mailMessage);
                    }
                }

                _logger.LogInformation($"Password reset email sent to {email}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending password reset email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string email, string fullName)
        {
            try
            {
                var smtpServer = _configuration["Email:SmtpServer"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
                var senderEmail = _configuration["Email:SenderEmail"] ?? "";
                var senderPassword = _configuration["Email:SenderPassword"] ?? "";
                var senderName = _configuration["Email:SenderName"] ?? "Learnix";

                if (string.IsNullOrEmpty(senderEmail) || string.IsNullOrEmpty(senderPassword))
                {
                    _logger.LogWarning("Email configuration is missing");
                    return false;
                }

                var subject = "Welcome to Learnix!";
                var body = $@"
                    <html>
                        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                            <div style='max-width: 600px; margin: 0 auto;'>
                                <h2 style='color: #2c3e50;'>Welcome to Learnix, {fullName}!</h2>
                                <p>Thank you for creating an account with us. We're excited to have you on board!</p>
                                
                                <p>You can now:</p>
                                <ul>
                                    <li>Browse and enroll in courses</li>
                                    <li>Track your learning progress</li>
                                    <li>Interact with instructors and students</li>
                                </ul>
                                
                                <p>If you have any questions, feel free to contact our support team.</p>
                                
                                <hr style='border: none; border-top: 1px solid #ddd; margin: 30px 0;'>
                                <p style='font-size: 12px; color: #7f8c8d;'>
                                    Learnix © {DateTime.Now.Year}. All rights reserved.
                                </p>
                            </div>
                        </body>
                    </html>
                ";

                using (var smtpClient = new SmtpClient(smtpServer, smtpPort))
                {
                    smtpClient.EnableSsl = true;
                    smtpClient.Credentials = new NetworkCredential(senderEmail, senderPassword);

                    using (var mailMessage = new MailMessage())
                    {
                        mailMessage.From = new MailAddress(senderEmail, senderName);
                        mailMessage.To.Add(email);
                        mailMessage.Subject = subject;
                        mailMessage.Body = body;
                        mailMessage.IsBodyHtml = true;

                        await smtpClient.SendMailAsync(mailMessage);
                    }
                }

                _logger.LogInformation($"Welcome email sent to {email}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending welcome email: {ex.Message}");
                return false;
            }
        }
    }
}
