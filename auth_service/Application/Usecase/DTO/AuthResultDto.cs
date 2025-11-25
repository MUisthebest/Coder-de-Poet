using auth_service.Domain.Entity;

namespace auth_service.Application.Usecase.DTO
{
    public class AuthResult
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public User? User { get; set; }
    }
}
