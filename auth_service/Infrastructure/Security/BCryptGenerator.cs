/*
    This implementation of the IPasswordHasher interface uses the Bcrypt algorithm
    to hash and verify passwords securely.
*/
using auth_service.Application.Security;
using BCrypt.Net;

namespace auth_service.Infrastructure.Security
{
    public class BcryptPasswordHasher : IBcryptPasswordHasher
    {
        const int SufferHashingRounds = 10;
        public string HashBcryptPassword (string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, SufferHashingRounds);
        }

        public bool VerifyBcryptHashedPassword (string storedHashPassword, string inputPassword)
        {
            return BCrypt.Net.BCrypt.Verify(inputPassword, storedHashPassword);
        }
    }
}