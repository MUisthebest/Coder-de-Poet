/*
    This implementation of the JWT token provider interface generates and validates JWT access and refresh tokens
*/

using auth_service.Application.Security;
using auth_service.Domain.Entity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
namespace auth_service.Infrastructure.Security
{
    public class JWTTokenProvidder : IJWTTokenProvidder
    {
        private readonly IConfiguration _configuration;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly byte[] _secretKey;

        private readonly int _accessTokenExpiryMinutes;
        private readonly int _refreshTokenExpiryDays;

        public JWTTokenProvidder(IConfiguration configuration)
        {
            _configuration = configuration;
            _issuer = _configuration["JWT:Issuer"] ?? string.Empty;
            _audience = _configuration["JWT:Audience"] ?? string.Empty;
            _secretKey = Encoding.UTF8.GetBytes(_configuration["JWT:SecretKey"] ?? string.Empty);
            _accessTokenExpiryMinutes = int.Parse(_configuration["JWT:AccessTokenExpiryMinutes"] ?? "3");
            _refreshTokenExpiryDays = int.Parse(_configuration["JWT:RefreshTokenExpiryDays"] ?? "7");
        }

        public string GenerateJWTAccessToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = _secretKey;
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.GetEmail()),
                    new Claim(ClaimTypes.Role, user.GetFormattedRole())
                }),
                Expires = DateTime.UtcNow.AddMinutes(_accessTokenExpiryMinutes),
                Issuer = _issuer,
                Audience = _audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public bool ValidateJWTAccessToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = _secretKey;
            try
            {
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _issuer,
                    ValidateAudience = true,
                    ValidAudience = _audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                var userId = jwtToken.Claims.First(x => x.Type == ClaimTypes.NameIdentifier).Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return false;
                }
                return true;
            }

            catch
            {
                return false;
            }
        }


        /*Generate refreshToken*/
        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }
    }
}