using auth_service.Application.Security;
using auth_service.Application.Usecase.DTO;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace auth_service.Infrastructure.Security
{
    public class GoogleTokenValidator : IGoogleTokenValidator
    {
        private readonly string _clientId;

        public GoogleTokenValidator(IConfiguration config)
        {
            _clientId = config["Google:ClientId"] ?? throw new InvalidOperationException("Google:ClientId is missing");
        }

        public async Task<GoogleUserInfo?> VerifyIdTokenAsync (string idToken)
        {
            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(
                    idToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { _clientId }
                    }
                );

                return new GoogleUserInfo
                {
                    GoogleId = payload.Subject,
                    Email = payload.Email,
                    FullName = payload.Name ?? payload.Email,
                    AvatarUrl = payload.Picture ?? "",
                    EmailVerified = payload.EmailVerified
                };
            }
            catch
            {
                return null;
            }
        }
    }
}
