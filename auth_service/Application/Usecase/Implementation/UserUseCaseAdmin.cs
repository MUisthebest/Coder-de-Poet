using System;
using System.Linq;
using System.Collections.Generic;
using auth_service.Application.Usecase.DTO;
using auth_service.Domain.Common;
using auth_service.Domain.Entity;

namespace auth_service.Application.Usecase.Implementation
{
    public partial class UserUseCase
    {
        public async Task<OperationResult<List<UserInfoResponse>>> GetAllUsersAsync()
        {
            try
            {
                var users = await _userRepository.GetAllUsersAsync();

                var userList = users.Select(u => new UserInfoResponse
                {
                    Id = u.Id,
                    Email = u.Email,
                    FullName = u.FullName,
                    AvatarUrl = u.AvatarUrl,
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt,
                    DateOfBirth = u.DateOfBirth,
                    Role = u.GetFormattedRole()
                }).ToList();

                return OperationResult<List<UserInfoResponse>>.Success(userList);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                return OperationResult<List<UserInfoResponse>>.Failure(
                    "GetAllUsersFailed", "Failed to retrieve users");
            }
        }

        public async Task<OperationResult> DeleteUserAsync(Guid userId)
        {
            try
            {
                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return OperationResult.Failure(
                        "NotFound", $"User with ID {userId} not found");
                }

                var deleted = await _userRepository.DeleteUserAsync(userId);
                if (!deleted)
                {
                    return OperationResult.Failure(
                        "DeleteFailed", "Failed to delete user");
                }

                _logger.LogInformation($"User {userId} deleted successfully");
                return OperationResult.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user {userId}");
                return OperationResult.Failure(
                    "DeleteUserFailed", "An error occurred while deleting the user");
            }
        }

        public async Task<OperationResult<UserInfoResponse>> UpdateUserRoleAsync(Guid userId, string role)
        {
            if (userId == Guid.Empty)
            {
                return OperationResult<UserInfoResponse>.Failure(
                    "InvalidUserId", "User ID cannot be empty.");
            }

            if (string.IsNullOrWhiteSpace(role))
            {
                return OperationResult<UserInfoResponse>.Failure(
                    "InvalidRole", "Role is required.");
            }

            var normalizedRole = role.Trim().Replace(" ", "_");
            var parsed = Enum.TryParse<UserRole>(normalizedRole, true, out var parsedRole);
            if (!parsed)
            {
                return OperationResult<UserInfoResponse>.Failure(
                    "InvalidRole", $"Role '{role}' is not supported.");
            }

            try
            {
                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return OperationResult<UserInfoResponse>.Failure(
                        "NotFound", $"User with ID {userId} not found");
                }

                user.updateUserRole(parsedRole);
                await _userRepository.UpdateUserAsync(user);

                var response = new UserInfoResponse
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName ?? string.Empty,
                    DateOfBirth = user.DateOfBirth,
                    AvatarUrl = user.AvatarUrl,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt,
                    Role = user.GetFormattedRole()
                };

                _logger.LogInformation("User {UserId} role updated to {Role}", userId, response.Role);

                return OperationResult<UserInfoResponse>.Success(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating role for user {UserId}", userId);
                return OperationResult<UserInfoResponse>.Failure(
                    "UpdateRoleFailed", "An error occurred while updating the user role.");
            }
        }
    }
}
