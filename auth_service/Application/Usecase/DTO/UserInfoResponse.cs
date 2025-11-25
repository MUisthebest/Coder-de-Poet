public class UserInfoResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime UpdatedAt { get; set; }
}