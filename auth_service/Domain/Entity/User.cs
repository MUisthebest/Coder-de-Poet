/*
    Model defines the User entity for the Learnix application.

*/


namespace auth_service.Domain.Entity
{
    

    public class User
    {
        public Guid Id { get; private set; }
        public string Email { get; private set; } = string.Empty;
        public string HashedPassword { get; private set; } = string.Empty;
        public string FullName { get; private set; } = string.Empty;
        public string AvatarUrl { get; private set; } = string.Empty;
        public string UserRole { get; private set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public DateTime UpdatedAt {get; private set; } = DateTime.UtcNow;
        public string RefreshToken { get; private set; } = string.Empty;
        public DateTime RefreshTokenExpiry { get; private set; } = DateTime.UtcNow;


        //ORM Constructor
        protected User() {}

        //Constructors
        public User (string email, string hashedPassword, string fullName, string refreshToken, DateTime refreshTokenExpiry, DateTime dob, string avatarUrl_)
        {
            //Id = Guid.NewGuid();
            Email = email;
            HashedPassword = hashedPassword;
            FullName = fullName;
            UserRole = User_Role.Normal_Student; 
            RefreshToken = refreshToken;
            RefreshTokenExpiry = refreshTokenExpiry;
            DateOfBirth = dob != DateTime.MinValue ? dob : DateTime.MinValue;
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
        public void updateUserRole (string newRole)
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
        public string GetEmail() => Email;
        public string GetHashedPassword() => HashedPassword;
        public string GetFullName() => FullName;
        public string GetUserRole() => UserRole;
        public string GetRefreshToken() => RefreshToken;
        public DateTime GetDateOfBirth() => DateOfBirth; 
        public DateTime GetCreatedAt() => CreatedAt;
        public DateTime GetUpdatedAt() => UpdatedAt;
        public DateTime GetRefreshTokenExpiry() => RefreshTokenExpiry;
        
     }
}
