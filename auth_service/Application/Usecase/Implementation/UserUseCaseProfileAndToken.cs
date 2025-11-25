using auth_service.Application.Usecase.DTO;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text;

namespace auth_service.Application.Usecase.Implementation
{
    public partial class UserUseCase
    {
        // ========== UPDATE USER INFO ==========

        public async Task<AuthResult> UpdateUserInfoAsync(UpdateUserInfoRequest req)
        {
            // 1. Validate and parse UserId
            if (!Guid.TryParse(req.UserId, out var userId))
            {
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Invalid user ID format."
                };
            }

            // 2. Load user
            var user = await _userRepository.GetUserByIdAsync(userId);
            Console.WriteLine("Debug: Loaded user for update: " + (user != null ? user.Email : "null"));
            if (user == null)
            {
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "User not found."
                };
            }

            // 3. Update user info
            user.updateUserInfo(req.FullName, req.DateOfBirth, req.AvatarUrl);
            await _userRepository.UpdateUserAsync(user);

            return new AuthResult { IsSuccess = true, User = user };
        }

        // ========== REFRESH TOKEN ==========

        public async Task<AuthResult> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Refresh token is required."
                };
            }

            // 1. Find user by refresh token
            var user = await _userRepository.GetUserByRefreshTokenAsync(refreshToken);
            if (user == null)
            {
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Invalid refresh token."
                };
            }

            // 2. Generate new tokens
            var newAccessToken = _jwtTokenProvider.GenerateJWTAccessToken(user);
            var newRefreshToken = _jwtTokenProvider.GenerateRefreshToken();

            // 3. Persist the new refresh token
            user.setHashedPassword(newRefreshToken);
            await _userRepository.UpdateUserAsync(user);

            // 4. Return result
            return new AuthResult
            {
                IsSuccess = true,
                User = user
            };
        }
    }
}
