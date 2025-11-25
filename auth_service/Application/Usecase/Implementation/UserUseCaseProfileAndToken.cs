using auth_service.Application.Usecase.DTO;
using auth_service.Domain.Common;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text;

namespace auth_service.Application.Usecase.Implementation
{
    public partial class UserUseCase
    {
        // ========== UPDATE USER INFO ==========

    public async Task<OperationResult<UserInfoResponse>> UpdateUserInfoAsync(Guid userId, UpdateUserInfoRequest req)
    {
        var result = new OperationResult<UserInfoResponse>();

        // 1. Kiểm tra userId hợp lệ (dù Guid luôn valid nếu truyền đúng, nhưng phòng trường hợp)
        if (userId == Guid.Empty)
        {
            result.AddError("InvalidUserId", "User ID cannot be empty.");
            return result;
        }

        // 2. Load user từ DB
        var user = await _userRepository.GetUserByIdAsync(userId);
        
        // Debug log (nên dùng ILogger trong thực tế)
        Console.WriteLine("Debug: Loaded user for update: " + (user != null ? user.Email : "null"));

        if (user == null)
        {
            result.AddError("NotFound", "User not found.");
            return result;
        }

        try
        {
            // 3. Cập nhật thông tin (giữ nguyên method của bạn trên entity)
            user.updateUserInfo(
                fullName: req.FullName,
                dob: req.DateOfBirth,
                avatarUrl_: req.AvatarUrl
            );

            // 4. Lưu vào DB
            await _userRepository.UpdateUserAsync(user);
            // Nếu bạn dùng UnitOfWork:
            // await _unitOfWork.SaveChangesAsync();

            // 5. Map sang Response DTO
            var response = new UserInfoResponse
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                DateOfBirth = user.DateOfBirth,
                AvatarUrl = user.AvatarUrl,
                UpdatedAt = user.UpdatedAt
            };

            result.Succeed(response);
        }
        catch (Exception ex)
        {
            // Nên inject ILogger thay vì Console
            Console.WriteLine($"Error updating user {userId}: {ex.Message}");

            result.AddError("UpdateFailed", "An error occurred while updating user information.");
            // Có thể thêm: result.AddErrorDetail(ex.ToString()); nếu cần debug
        }

        return result;
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
                User = new UserPublicInfo
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName ?? string.Empty,
                    AvatarUrl = user.AvatarUrl,
                    Role = user.UserRole.ToString(),
                    DateOfBirth = user.DateOfBirth,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                },
            };
        }

    public async Task<OperationResult<UserInfoResponse>> GetCurrentUserInfoAsync(Guid userId)
    {
        // 1. Validate input
        if (userId == Guid.Empty)
            return OperationResult<UserInfoResponse>.Failure("InvalidUserId", "User ID cannot be empty.");

        // 2. Lấy user từ Repository
        var user = await _userRepository.GetUserByIdAsync(userId);

        // 3. Kiểm tra tồn tại
        if (user == null)
            return OperationResult<UserInfoResponse>.Failure("NotFound", "User not found.");

        // 4. Map sang Response DTO
        var response = new UserInfoResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName ?? string.Empty,
            DateOfBirth = user.DateOfBirth,
            AvatarUrl = user.AvatarUrl,
            UpdatedAt = user.UpdatedAt
        };

        // 5. Trả về thành công
        return OperationResult<UserInfoResponse>.Success(response);
    }
    }
}
