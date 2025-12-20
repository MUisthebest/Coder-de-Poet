using System;
using System.Linq;
using System.Collections.Generic;
using auth_service.Application.Usecase.DTO;
using auth_service.Domain.Common;

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
                    UpdatedAt = u.UpdatedAt
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
    }
}
