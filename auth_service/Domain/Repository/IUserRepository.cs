using auth_service.Domain.Entity;
 /*
    This repository interface defines the contract for user-related data operations,
    including methods for adding, retrieving, updating, and deleting user entities.
 */

 namespace auth_service.Domain.Repository
{
    public interface IUserRepository
    {
        Task CreateUserAsync (User user);
        Task<User?> GetUserByEmailAsync (string email);
        Task<User?> GetUserByIdAsync (Guid id);
        Task UpdateUserAsync (User user);
        Task<User?> GetUserByRefreshTokenAsync (string refreshToken);
        Task<List<User>> GetAllUsersAsync();
        Task<bool> DeleteUserAsync(Guid id);
    }
}