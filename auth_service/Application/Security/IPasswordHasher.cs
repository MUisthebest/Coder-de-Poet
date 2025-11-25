/*
This interface defines the contract for Hashing password and verifying hashed passwords, using Bcrypt algorithm.
*/
namespace auth_service.Application.Security
{
    public interface IBcryptPasswordHasher
    {
        string HashBcryptPassword (string password);
        bool VerifyBcryptHashedPassword (string hashedPassword, string providedPassword);
    }
}