/*
    Model defines the User entity for the Learnix application.

*/

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
        private DateTime dateofBirth = DateTime.MinValue;
        private DateTime CreatedAt = DateTime.UtcNow;
        private DateTime UpdatedAt = DateTime.UtcNow;
        public string RefreshToken { get; private set; } = string.Empty;
        private DateTime RefreshTokenExpiry = DateTime.UtcNow;

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
            dateofBirth = dob;
            AvatarUrl = avatarUrl_;
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
            dateofBirth = dob;
            AvatarUrl = avatarUrl_;
            UpdatedAt = DateTime.UtcNow;
        }

        // Legacy getters 
        public string GetEmail() => Email;
        public string GetHashedPassword() => HashedPassword;
        public string GetFullName() => FullName;
        public UserRole GetUserRole() => UserRole;
        public string GetRefreshToken() => RefreshToken;
        
     }
}
