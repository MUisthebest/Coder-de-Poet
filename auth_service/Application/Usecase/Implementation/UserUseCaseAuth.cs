using auth_service.Application.Usecase.DTO;
using auth_service.Domain.Entity;

namespace auth_service.Application.Usecase.Implementation
{
    public partial class UserUseCase
    {
        // ========== SIGN UP ==========

        public async Task<AuthResult> SignUpAsync(SignUpRequest signUpRequest)
        {
            // 1. Check if email already exists
            var existingUser = await _userRepository.GetUserByEmailAsync(signUpRequest.Email);
            if (existingUser != null)
            {
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Email already exists."
                };
            }

            // 2. Hash password
            var hashedPassword = _passwordHasher.HashBcryptPassword(signUpRequest.Password);

            // 3. Generate refresh token
            var refreshToken = _jwtTokenProvider.GenerateRefreshToken();
            var refreshTokenExpiry = DateTime.UtcNow.AddDays(7); // adjust as needed

            // 4. Create new user entity using constructor
            var user = new User(
                email: signUpRequest.Email,
                hashedPassword: hashedPassword,
                fullName: signUpRequest.FullName,
                refreshToken: refreshToken,
                refreshTokenExpiry: refreshTokenExpiry,
                dob: signUpRequest.DateOfBirth,
                avatarUrl_: string.Empty 
            );

            // 5. Persist to DB
            await _userRepository.CreateUserAsync(user);

            // 6. Generate access token
            var accessToken = _jwtTokenProvider.GenerateJWTAccessToken(user);

            // 7. Return auth result
            return new AuthResult
            {
                IsSuccess = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = user
            };
        }

        // ========== SIGN IN ==========

        public async Task<AuthResult> SignInAsync(SignInRequest signInRequest)
        {
            // 1. Find user by email
            var user = await _userRepository.GetUserByEmailAsync(signInRequest.Email);
            if (user == null)
            {
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Invalid email or password."
                };
            }

            // 2. Verify password
            var isPasswordValid = _passwordHasher.VerifyBcryptHashedPassword(
                user.GetHashedPassword(),
                signInRequest.Password
                
            );

            if (!isPasswordValid)
            {
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Invalid email or password."
                };
            }

            // 3. Generate new tokens
            var accessToken = _jwtTokenProvider.GenerateJWTAccessToken(user);
            var refreshToken = _jwtTokenProvider.GenerateRefreshToken();
            var refreshTokenExpiry = DateTime.UtcNow.AddDays(7); // adjust as needed

            // 4. Update refresh token using domain method
            user.UpdateRefreshToken(refreshToken, refreshTokenExpiry);
            await _userRepository.UpdateUserAsync(user);

            // 5. Return result
            return new AuthResult
            {
                IsSuccess = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = user
            };
        }


    }
}
