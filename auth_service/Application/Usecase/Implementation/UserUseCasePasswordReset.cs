using auth_service.Application.Usecase.DTO;
using auth_service.Domain.Common;

namespace auth_service.Application.Usecase.Implementation
{
    public partial class UserUseCase
    {
        public async Task<OperationResult> ForgotPasswordAsync(string email)
        {
            try
            {
                // 1. Kiểm tra email có tồn tại không
                var user = await _userRepository.GetUserByEmailAsync(email);
                if (user == null)
                {
                    // Return success để không lộ thông tin email
                    return OperationResult.Success();
                }

                // 2. Tạo reset token
                var resetToken = Guid.NewGuid().ToString("N");

                // 3. Lưu token vào user
                user.SetPasswordResetToken(resetToken);
                await _userRepository.UpdateUserAsync(user);

                // 4. Gửi email với reset link
                var resetUrl = $"{GetBaseUrl()}/reset-password?token={resetToken}";
                var emailSent = await _emailService.SendPasswordResetEmailAsync(email, resetToken, resetUrl);

                if (!emailSent)
                {
                    _logger.LogWarning($"Failed to send password reset email to {email}");
                }

                return OperationResult.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ForgotPasswordAsync: {ex.Message}");
                return OperationResult.Failure("FORGOT_PASSWORD_ERROR", "An error occurred while processing your request.");
            }
        }

        public async Task<OperationResult> ResetPasswordAsync(string token, string newPassword)
        {
            try
            {
                // 1. Tìm user với reset token
                var users = await _userRepository.GetAllUsersAsync();
                var user = users.FirstOrDefault(u => u.GetPasswordResetToken() == token);

                if (user == null || !user.IsPasswordResetTokenValid())
                {
                    return OperationResult.Failure("INVALID_TOKEN", "Invalid or expired reset token.");
                }

                // 2. Hash mật khẩu mới
                var hashedPassword = _passwordHasher.HashBcryptPassword(newPassword);

                // 3. Cập nhật mật khẩu
                user.setHashedPassword(hashedPassword);
                user.ClearPasswordResetToken();

                // 4. Lưu vào database
                await _userRepository.UpdateUserAsync(user);

                _logger.LogInformation($"Password reset successfully for user {user.GetEmail()}");

                return OperationResult.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ResetPasswordAsync: {ex.Message}");
                return OperationResult.Failure("RESET_PASSWORD_ERROR", "An error occurred while resetting your password.");
            }
        }

        private string GetBaseUrl()
        {
            // Lấy từ configuration hoặc môi trường
            var baseUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL") ?? "http://localhost:3000";
            return baseUrl;
        }

        // Helper method để lấy PasswordResetToken
    }
}
