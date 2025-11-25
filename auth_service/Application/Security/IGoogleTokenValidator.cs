/*
    This interface defines the contract for Google Sign-in functionality.
*/
using auth_service.Application.Usecase.DTO;

namespace auth_service.Application.Security
{
    public interface IGoogleTokenValidator
    {
        Task<GoogleUserInfo?> VerifyIdTokenAsync (string idToken);
    }
}