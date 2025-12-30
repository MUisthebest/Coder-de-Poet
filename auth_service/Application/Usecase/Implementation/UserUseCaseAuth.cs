using auth_service.Application.Usecase.DTO;
using auth_service.Domain.Entity;
using System.Text.Json;
using auth_service.Domain.Common;

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
                refreshToken: "", // Empty initially
                refreshTokenExpiry: DateTime.UtcNow, // Will be updated later
                dob: signUpRequest.DateOfBirth,
                avatarUrl_: signUpRequest.AvatarUrl ?? ""
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
                User = new UserPublicInfo
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FullName = user.FullName ?? string.Empty,
                        AvatarUrl = user.AvatarUrl,
                        Role = user.UserRole.ToString(), // hoặc map từ enum
                        DateOfBirth = user.DateOfBirth,
                        CreatedAt = user.CreatedAt,
                        UpdatedAt = DateTime.UtcNow
                    }
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

                        // 5. Return result
            return new AuthResult
            {
                IsSuccess = true,
                AccessToken = accessToken,
                User = new UserPublicInfo
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FullName = user.FullName ?? string.Empty,
                        AvatarUrl = user.AvatarUrl,
                        DateOfBirth = user.DateOfBirth,
                        Role = user.GetFormattedRole(),
                        IsAdmin = user.UserRole == UserRole.Admin,
                        CreatedAt = user.CreatedAt,
                        UpdatedAt = user.UpdatedAt
                    }
            };
        }
        
        public async Task<AuthResult> SocialLoginAsync(SocialLoginRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Provider) || string.IsNullOrEmpty(request.AccessToken))
                {
                    return new AuthResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Provider and access token are required."
                    };
                }

                if (request.Provider.ToLower() == "google")
                {
                    return await HandleGoogleLoginAsync(request.AccessToken);
                }

                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"Unsupported provider: {request.Provider}"
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Social login error: {ex.Message}");
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Social login failed. Please try again."
                };
            }
        }

        private async Task<AuthResult> HandleGoogleLoginAsync(string accessToken)
        {
            try
            {
                // Get user info from Google API
                var googleUser = await GetGoogleUserInfoAsync(accessToken);
                
                if (googleUser == null || string.IsNullOrEmpty(googleUser.Email))
                {
                    return new AuthResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Invalid Google token or email not provided."
                    };
                }

                // Check if user exists
                var existingUser = await _userRepository.GetUserByEmailAsync(googleUser.Email);
                
                if (existingUser != null)
                {
                    // User exists - login
                    return await GenerateAuthResultAsync(existingUser);
                }
                else
                {
                    // Create new user
                    var newUser = new User(
                        email: googleUser.Email,
                        hashedPassword: "SOCIAL_AUTH_NO_PASSWORD",
                        fullName: googleUser.Name ?? $"{googleUser.GivenName} {googleUser.FamilyName}".Trim(),
                        refreshToken: _jwtTokenProvider.GenerateRefreshToken(),
                        refreshTokenExpiry: DateTime.UtcNow.AddDays(7),
                        dob: DateTime.UtcNow.AddYears(-18),
                        avatarUrl_: googleUser.Picture ?? string.Empty
                    );

                    await _userRepository.CreateUserAsync(newUser);
                    return await GenerateAuthResultAsync(newUser);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Google login error: {ex.Message}");
                return new AuthResult
                {
                    IsSuccess = false,
                    ErrorMessage = "Google login failed."
                };
            }
        }

        private async Task<GoogleUserInfo?> GetGoogleUserInfoAsync(string accessToken)
        {
            try
            {
                using var httpClient = new HttpClient();
                
                // Verify token với Google API
                var verificationResponse = await httpClient.GetAsync($"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={accessToken}");
                
                if (!verificationResponse.IsSuccessStatusCode)
                {
                    Console.WriteLine("Google token verification failed");
                    return null;
                }

                // Lấy user info từ Google API
                httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
                
                var userInfoResponse = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
                
                if (userInfoResponse.IsSuccessStatusCode)
                {
                    var content = await userInfoResponse.Content.ReadAsStringAsync();
                    Console.WriteLine($"Google user info: {content}");
                    
                    var userInfo = JsonSerializer.Deserialize<GoogleUserInfo>(content, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    return userInfo;
                }
                else
                {
                    Console.WriteLine($"Google user info failed: {userInfoResponse.StatusCode}");
                    return null;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Google user info error: {ex.Message}");
                return null;
            }
        }

        private async Task<AuthResult> GenerateAuthResultAsync(User user)
        {
            // Sửa _tokenProvider thành _jwtTokenProvider
            var accessToken = _jwtTokenProvider.GenerateJWTAccessToken(user);
            var refreshToken = _jwtTokenProvider.GenerateRefreshToken();
            
            // Update refresh token in database
            user.UpdateRefreshToken(refreshToken, DateTime.UtcNow.AddDays(7));
            await _userRepository.UpdateUserAsync(user);

            var userInfo = new UserPublicInfo
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                Role = user.GetFormattedRole(),
                IsAdmin = user.UserRole == UserRole.Admin,
                DateOfBirth = user.DateOfBirth,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };

            return new AuthResult
            {
                IsSuccess = true,
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userInfo
            };
        }
        public async Task<OperationResult> RevokeRefreshTokenAsync(string refreshToken)
        {
            try
            {
                if (string.IsNullOrEmpty(refreshToken))
                {
                    return OperationResult.Failure(
                        "BadRequest", 
                        "Refresh token is required."
                    );
                }

                // 1. Tìm user bằng refresh token
                var user = await _userRepository.GetUserByRefreshTokenAsync(refreshToken);
                if (user == null)
                {
                    return OperationResult.Failure(
                        "InvalidToken", 
                        "Invalid refresh token."
                    );
                }

                // 2. Kiểm tra token đã bị revoke chưa
                if (string.IsNullOrEmpty(user.RefreshToken) || 
                    user.RefreshToken != refreshToken)
                {
                    return OperationResult.Failure(
                        "AlreadyRevoked", 
                        "Refresh token is already revoked or invalid."
                    );
                }

                // 3. Kiểm tra token còn hạn không
                if (user.RefreshTokenExpiry <= DateTime.UtcNow)
                {
                    return OperationResult.Failure(
                        "TokenExpired", 
                        "Refresh token has expired."
                    );
                }

                // 4. Revoke token
                user.ClearRefreshToken();
                await _userRepository.UpdateUserAsync(user);

                return OperationResult.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking refresh token");
                return OperationResult.Failure(
                    "ServerError", 
                    "Failed to revoke refresh token."
                );
            }
        }

        public async Task<OperationResult> RevokeAllRefreshTokensAsync(Guid userId)
        {
            try
            {
                // 1. Lấy user
                var user = await _userRepository.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return OperationResult.Failure(
                        "NotFound", 
                        "User not found."
                    );
                }

                user.ClearRefreshToken();
                await _userRepository.UpdateUserAsync(user);

                return OperationResult.Success();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking all refresh tokens for user {UserId}", userId);
                return OperationResult.Failure(
                    "ServerError", 
                    "Failed to revoke all refresh tokens."
                );
            }
        }
    }
}
