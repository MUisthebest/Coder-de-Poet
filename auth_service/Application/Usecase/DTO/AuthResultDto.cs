using auth_service.Domain.Entity;

namespace auth_service.Application.Usecase.DTO
{
    public class AuthResult
    {
        public bool IsSuccess { get; set; }
        public string? ErrorMessage { get; set; }
        public string? AccessToken { get; set; }

        public string? RefreshToken { get; set; }

        public UserPublicInfo? User { get; set; }
    }
    public class UserPublicInfo
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "Normal_Student";

    public bool IsAdmin {get; set;}
    public DateTime? DateOfBirth { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
}
