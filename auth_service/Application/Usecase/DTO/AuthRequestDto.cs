/*
    DTOs for authentication use cases:
    - Sign up / Sign in with email + password
    - Refresh token
    - (Later) Sign in with Google OAuth2
    - (Later) Reset password
*/

using System.ComponentModel.DataAnnotations;

namespace auth_service.Application.Usecase.DTO
{
    public class SignUpRequest
    {
        public string Email {get; set;} = string.Empty;
        public string Password {get; set;} = string.Empty;
        public string AvatarUrl {get; set;} = string.Empty;
        public string FullName {get; set;} = string.Empty;
        public DateTime DateOfBirth {get; set;} = DateTime.MinValue;
    }

    public class SignInRequest
    {
        public string Email {get; set;} = string.Empty;
        public string Password {get; set;} = string.Empty;
    }
    

    public class UpdateUserInfoRequest
    {
        public string UserId {get; set;} = string.Empty;
        public string Email {get; set;} = string.Empty;
        public string Password {get; set;} = string.Empty;
        public string FullName {get; set;} = string.Empty;

        public DateTime DateOfBirth {get; set;} = DateTime.MinValue;
        public string AvatarUrl {get; set;} = string.Empty;
    }

    public class UpdateUserRoleRequest
    {
        [Required]
        public string Role { get; set; } = string.Empty;
    }

}