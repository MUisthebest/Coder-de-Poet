/*
    This interface lists the user-related use case interfaces for the authentication service.
    Including:
        + sign in/ sign up
        + Sign in via Google OAuth2 (later)
        + Reset password (later)
*/

using auth_service.Application.Usecase.DTO;
using auth_service.Domain.Common;

namespace auth_service.Application.Usecase.Interface

{
    public interface  IUserUseCase
    {
        public Task <AuthResult> SignUpAsync (SignUpRequest signUpRequest);
        public Task <AuthResult> SignInAsync (SignInRequest signInRequest);

        public Task <OperationResult<UserInfoResponse>> UpdateUserInfoAsync (Guid userId, UpdateUserInfoRequest updateUserInfoRequest);
        public Task <AuthResult> RefreshTokenAsync (string refreshToken);

        public Task <OperationResult<UserInfoResponse>> GetCurrentUserInfoAsync (Guid userId);

        // //Social login (Google Oauth2) - later release
        public Task<AuthResult> SocialLoginAsync (SocialLoginRequest request);

        // IUserUseCase.cs
        Task<OperationResult> RevokeRefreshTokenAsync(string refreshToken);
        Task<OperationResult> RevokeAllRefreshTokensAsync(Guid userId);

        // //Reset Password 
        // public Task<bool> SendResetPasswordEmailAsync (string email);
        // public Task<bool> ResetPasswordAsync (string resetToken, string newPassword);

    }
    
}