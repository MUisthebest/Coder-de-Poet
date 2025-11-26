using System.ComponentModel.DataAnnotations;

namespace auth_service.Application.Usecase.DTO
{
    public class SocialLoginRequest
    {
        [Required]
        public string Provider { get; set; } = string.Empty;
        
        [Required]
        public string AccessToken { get; set; } = string.Empty;
    }
}