/*
    DTOs for authentication use cases:
    - Sign up / Sign in with email + password
    - Refresh token
    - (Later) Sign in with Google OAuth2
    - (Later) Reset password
*/

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
        public string Email {get; set;} = string.Empty;
        public string Password {get; set;} = string.Empty;
        public string FullName {get; set;} = string.Empty;

        public DateTime DateOfBirth {get; set;} = DateTime.MinValue;
        public string AvatarUrl {get; set;} = string.Empty;
    }

    //Google OAuth2 Sign in request
    public class GoogleSigninRequest
    {
        public string IdToken {get; set;} = string.Empty;
    }

}