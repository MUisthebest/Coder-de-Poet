/*
    Model defines the User entity for the Learnix application.

*/
using System.ComponentModel.DataAnnotations.Schema;

using System.ComponentModel.DataAnnotations;

using System;

namespace auth_service.Domain.Entity
{
    public enum UserRole
    {
        Normal_Student,
        Premium_Student,
        Instructor,
        Admin

    }

    public class User
    {
        public Guid Id { get; private set; }
        public string Email { get; private set; } = string.Empty;
        public string HashedPassword { get; private set; } = string.Empty;
        public string FullName { get; private set; } = string.Empty;
        public string AvatarUrl { get; private set; } = string.Empty;
        public UserRole UserRole { get; private set; }
        [Column(TypeName = "date")] 
        [DataType(DataType.Date)]
        public DateTime DateOfBirth { get; set; }

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime UpdatedAt {get; private set; } = DateTime.UtcNow;
        public string RefreshToken { get; private set; } = string.Empty;
        public DateTime RefreshTokenExpiry { get; private set; } = DateTime.UtcNow;

        // Password Reset fields
        public string? PasswordResetToken { get; private set; }
        public DateTime? PasswordResetTokenExpiry { get; private set; }

        // Account status
        public bool IsActive { get; private set; } = true;


        //ORM Constructor
        protected User() {}

        //Constructors
        public User (string email, string hashedPassword, string fullName, string refreshToken, DateTime refreshTokenExpiry, DateTime dob, string avatarUrl_)
        {
            Id = Guid.NewGuid();
            Email = email;
            HashedPassword = hashedPassword;
            FullName = fullName;
            UserRole = UserRole.Normal_Student;
            RefreshToken = refreshToken;
            RefreshTokenExpiry = refreshTokenExpiry;
            DateOfBirth = dob;
            AvatarUrl = avatarUrl_;
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
          
        //Getters and Setters 

        public void setHashedPassword(string hashedPassword)
        {
            HashedPassword = hashedPassword;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateEmailPassword (string email, string hashedPassword)
        {
            Email = email;
            HashedPassword = hashedPassword;
            UpdatedAt = DateTime.UtcNow;
        }

        //Update RefreshToken 
        public void UpdateRefreshToken (string refreshToken, DateTime expiry)
        {
            RefreshToken = refreshToken;
            RefreshTokenExpiry = expiry;
            UpdatedAt = DateTime.UtcNow;
        }

        //Update User Role  
        public void updateUserRole (UserRole newRole)
        {
            UserRole = newRole;
            UpdatedAt = DateTime.UtcNow;
        }

        public void updateUserInfo (string fullName, DateTime dob, string avatarUrl_)
        {
            FullName = fullName;
            DateOfBirth = dob;
            AvatarUrl = avatarUrl_;
            UpdatedAt = DateTime.UtcNow;
        }

        public string GetFormattedRole()
        {
            return UserRole switch
            {
                UserRole.Normal_Student => "Normal_Student",
                UserRole.Premium_Student => "Premium_Student",
                UserRole.Instructor => "Instructor", 
                UserRole.Admin => "Admin",
                _ => UserRole.ToString()
            };
        }

        public void ClearRefreshToken()
        {
            RefreshToken = string.Empty;
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(-1); 
        }

        public void RemoveRefreshToken()
        {
            RefreshToken = null;
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(0);
        }

        // Password Reset methods
        public void SetPasswordResetToken(string token)
        {
            PasswordResetToken = token;
            PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1); // Token valid for 1 hour
            UpdatedAt = DateTime.UtcNow;
        }

        public bool IsPasswordResetTokenValid()
        {
            return !string.IsNullOrEmpty(PasswordResetToken) && 
                   PasswordResetTokenExpiry.HasValue && 
                   PasswordResetTokenExpiry > DateTime.UtcNow;
        }

        public void ClearPasswordResetToken()
        {
            PasswordResetToken = null;
            PasswordResetTokenExpiry = null;
            UpdatedAt = DateTime.UtcNow;
        }

        // Account enable/disable methods
        public void DisableAccount()
        {
            IsActive = false;
            UpdatedAt = DateTime.UtcNow;
        }

        public void EnableAccount()
        {
            IsActive = true;
            UpdatedAt = DateTime.UtcNow;
        }

        public bool GetIsActive() => IsActive;

        public string GetEmail() => Email;
        public string GetHashedPassword() => HashedPassword;
        public string GetFullName() => FullName;
        public UserRole GetUserRole() => UserRole;
        public string GetRefreshToken() => RefreshToken;
        public DateTime GetDateOfBirth() => DateOfBirth; // Thêm getter cho DateOfBirth
        public DateTime GetCreatedAt() => CreatedAt;
        public DateTime GetUpdatedAt() => UpdatedAt;
        public DateTime GetRefreshTokenExpiry() => RefreshTokenExpiry;
        public string? GetPasswordResetToken() => PasswordResetToken;
        
     }
}
