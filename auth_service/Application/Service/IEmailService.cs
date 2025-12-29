namespace auth_service.Application.Service
{
    public interface IEmailService
    {
        Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string resetUrl);
        Task<bool> SendWelcomeEmailAsync(string email, string fullName);
    }
}
