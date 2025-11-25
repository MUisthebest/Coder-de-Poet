/*
    This interface defines the contract for token providers using JWT.
    It includes methods for generating and validating tokens.
*/
using auth_service.Domain.Entity;
namespace auth_service.Application.Security
{
    public interface IJWTTokenProvidder
    {
        string GenerateJWTAccessToken (User user);
        bool ValidateJWTAccessToken (string token);
        string GenerateRefreshToken ();

    }
}