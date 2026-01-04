using auth_service.Application.Usecase.Interface;
using auth_service.Application.Usecase.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

/*
    This file contains Controller for authentication-related endpoints.
    It uses IUserUseCase to handle the business logic.
*/

namespace auth_service.Presentation.Controllers
{
    /// <summary>
    /// Authentication and User Management Controller
    /// </summary>
    [ApiController]
    [Route("/")]
    [Tags("Authentication")]
    public class authController : ControllerBase
    {
        private readonly IUserUseCase _userUseCase;

        public authController(IUserUseCase userUseCase)
        {
            _userUseCase = userUseCase;
        }

        /// <summary>
        /// User sign up / registration
        /// </summary>
        /// <param name="signUpRequest">Sign up request containing email, password, etc.</param>
        /// <returns>User registration result</returns>
        [HttpPost("signup")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequest signUpRequest)
        {
            var result = await _userUseCase.SignUpAsync(signUpRequest);

            if (result.IsSuccess)
            {
                return Ok(result);
            }
            else
            {
                return BadRequest(result.ErrorMessage);
            }
        }

        /// <summary>
        /// User sign in / login
        /// </summary>
        /// <param name="request">Sign in request containing email and password</param>
        /// <returns>Access token and user information</returns>
        [HttpPost("signin")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> SignIn([FromBody] SignInRequest request)
        {
            var result = await _userUseCase.SignInAsync(request);

            if (!result.IsSuccess)
                return BadRequest(result);

            if (!string.IsNullOrEmpty(result.RefreshToken))
            {
                Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = false,           // DEV: false
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddDays(7),
                    Path = "/"
                });
            }

        return Ok(new
            {
                accessToken = result.AccessToken,
                user = result.User
            });        
    }

    /// <summary>
    /// User logout
    /// </summary>
    /// <returns>Logout confirmation message</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        
        if (!string.IsNullOrEmpty(refreshToken))
        {
            // Nên có cơ chế revoke token ở phía server
            await _userUseCase.RevokeRefreshTokenAsync(refreshToken);
        }
        
        // Xóa cookie
        Response.Cookies.Delete("refreshToken");
        
        return Ok(new { message = "Logged out successfully" });
    }

    /// <summary>
    /// Refresh access token using refresh token from cookies
    /// </summary>
    /// <returns>New access token and user information</returns>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken()
    {
        // 1. Đọc refresh token từ httpOnly cookie (frontend KHÔNG gửi gì cả)
        var refreshToken = Request.Cookies["refreshToken"];

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "No refresh token provided" });
        }

        // 2. Gọi UseCase để xử lý
        var result = await _userUseCase.RefreshTokenAsync(refreshToken);

        if (!result.IsSuccess)
        {
            // Nếu token sai hoặc hết hạn → xóa cookie luôn cho sạch
            Response.Cookies.Delete("refreshToken");
            return Unauthorized(result);
        }

        // 4. Trả về access token mới + user info
        return Ok(new
        {
            accessToken = result.AccessToken,
            user = result.User
        });
    }

    /// <summary>
    /// Social login (Google, Facebook, etc.)
    /// </summary>
    /// <param name="request">Social login request containing provider and token</param>
    /// <returns>Access token and user information</returns>
    [HttpPost("social-login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SocialLogin([FromBody] SocialLoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _userUseCase.SocialLoginAsync(request);

        if (!result.IsSuccess)
        {
            return BadRequest(new
            {
                errorMessage = result.ErrorMessage
                // XÓA: errors = result.Errors (vì không tồn tại)
            });
        }

        // Set refresh token as httpOnly cookie
        if (!string.IsNullOrEmpty(result.RefreshToken))
        {
            Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false,
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(7),
                    Path = "/"
                });
            }

            return Ok(new
            {
                accessToken = result.AccessToken,
                user = result.User
            });
        }

    [HttpPut("users/{id:guid}")]  // Fixed route to include {id}
            [ProducesResponseType(StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            public async Task<IActionResult> UpdateUser(
                [FromRoute] Guid id,
                [FromBody] UpdateUserInfoRequest request)
            {
                if (request == null)
                    return BadRequest("Update request cannot be null.");

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Optionally: ensure the authenticated user matches the {id} (security!)
                // e.g., var userId = User.GetUserId(); if (userId != id) return Forbid();

                var result = await _userUseCase.UpdateUserInfoAsync(id, request);

                if (!result.IsSuccess)
                {
                    var firstError = result.Errors.FirstOrDefault();
                    return firstError?.Code switch
                    {
                        "NotFound" => NotFound(result),
                        _ => BadRequest(result)
                    };
                }
                return Ok(result);
            }

        [HttpGet("me")]
        [Authorize] 
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<UserInfoResponse>> GetCurrentUser()
        {
            // Lấy userId từ JWT claim (sub hoặc nameidentifier)
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) 
                        ?? User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return Unauthorized("Token không chứa thông tin người dùng.");
            }

            var result = await _userUseCase.GetCurrentUserInfoAsync(userId);

            if (!result.IsSuccess)
            {
                var errorCode = result.Errors.FirstOrDefault()?.Code;
                return errorCode == "NotFound" 
                    ? NotFound("Người dùng không tồn tại.") 
                    : BadRequest(result);
            }

            return Ok(result.Data);
        }
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public IActionResult GetAdminDashboard()
        {
            // Lấy thông tin user từ token
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            return Ok(new
            {
                message = "Welcome to Admin Dashboard!",
                user = userEmail,
                role = userRole,
                dashboardData = new
                {
                    totalUsers = 1250,
                    activeCourses = 45,
                    revenue = 125000,
                    recentActivities = new[]
                    {
                        new { action = "User registered", time = "2 hours ago" },
                        new { action = "Course created", time = "5 hours ago" }
                    }
                },
                timestamp = DateTime.UtcNow
            });
        }
        [HttpGet("admin/courses")]
        [Authorize(Roles = "Admin,Instructor")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public IActionResult GetAdminCourses()
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

            var courses = new[]
            {
                new
                {
                    id = 1,
                    title = "Advanced C# Programming",
                    instructor = "John Doe",
                    students = 125,
                    price = 49.99,
                    status = "Active",
                    createdDate = "2024-01-15"
                },
                new
                {
                    id = 2,
                    title = "ASP.NET Core Web API",
                    instructor = "Jane Smith",
                    students = 89,
                    price = 39.99,
                    status = "Active",
                    createdDate = "2024-02-01"
                },
                new
                {
                    id = 3,
                    title = "Microservices Architecture",
                    instructor = "Mike Johnson",
                    students = 67,
                    price = 59.99,
                    status = "Draft",
                    createdDate = "2024-02-10"
                }
            };

            return Ok(new
            {
                message = $"Course management accessed by {userName} ({userRole})",
                totalCourses = courses.Length,
                courses = courses,
                userRole = userRole,
                accessTime = DateTime.UtcNow
            });
        }

        [HttpGet("admin/users")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userUseCase.GetAllUsersAsync();

            if (!result.IsSuccess || result.Data == null)
            {
                return BadRequest(result);
            }

            return Ok(new
            {
                message = "All users retrieved successfully",
                totalUsers = result.Data.Count,
                users = result.Data,
                timestamp = DateTime.UtcNow
            });
        }

        [HttpDelete("admin/users/{id:guid}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteUser([FromRoute] Guid id)
        {
            var result = await _userUseCase.DeleteUserAsync(id);

            if (!result.IsSuccess)
            {
                var firstError = result.Errors.FirstOrDefault();
                var errorMessage = firstError?.Message ?? "Delete failed";

                return firstError?.Code switch
                {
                    "NotFound" => NotFound(new { success = false, errorMessage }),
                    _ => BadRequest(new { success = false, errorMessage })
                };
            }

            return Ok(new { success = true, message = "User deleted successfully" });
        }

        [HttpPatch("admin/users/{id:guid}/role")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserRole(
            [FromRoute] Guid id,
            [FromBody] UpdateUserRoleRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, errorMessage = "Request body is required." });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, errorMessage = "Invalid request." });
            }

            var result = await _userUseCase.UpdateUserRoleAsync(id, request.Role);

            if (!result.IsSuccess)
            {
                var firstError = result.Errors.FirstOrDefault();
                var errorMessage = firstError?.Message ?? "Update failed";
                
                return firstError?.Code switch
                {
                    "NotFound" => NotFound(new { success = false, errorMessage }),
                    "InvalidUserId" => BadRequest(new { success = false, errorMessage }),
                    "InvalidRole" => BadRequest(new { success = false, errorMessage }),
                    "ForbiddenRole" => BadRequest(new { success = false, errorMessage }),
                    _ => BadRequest(new { success = false, errorMessage })
                };
            }

            return Ok(new
            {
                success = true,
                data = result.Data
            });
        }

        //admin get one instructor by id
        [HttpGet("admin/instructors/{id:guid}")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetInstructorById([FromRoute] Guid id)
        {
            var result = await _userUseCase.GetInstructorByIdAsync(id);

            if (!result.IsSuccess)
            {
                var firstError = result.Errors.FirstOrDefault();
                return firstError?.Code switch
                {
                    "NotFound" => NotFound(result),
                    _ => BadRequest(result)
                };
            }

            return Ok(result);
        }

        [HttpPatch("admin/users/{id:guid}/disable")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DisableAccount([FromRoute] Guid id)
        {
            var result = await _userUseCase.DisableAccountAsync(id);

            if (!result.IsSuccess)
            {
                var firstError = result.Errors.FirstOrDefault();
                var errorMessage = firstError?.Message ?? "Failed to disable account";

                return firstError?.Code switch
                {
                    "NotFound" => NotFound(new { success = false, errorMessage }),
                    "AlreadyDisabled" => BadRequest(new { success = false, errorMessage }),
                    _ => BadRequest(new { success = false, errorMessage })
                };
            }

            return Ok(new { success = true, message = "Account disabled successfully" });
        }

        [HttpPatch("admin/users/{id:guid}/enable")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> EnableAccount([FromRoute] Guid id)
        {
            var result = await _userUseCase.EnableAccountAsync(id);

            if (!result.IsSuccess)
            {
                var firstError = result.Errors.FirstOrDefault();
                var errorMessage = firstError?.Message ?? "Failed to enable account";

                return firstError?.Code switch
                {
                    "NotFound" => NotFound(new { success = false, errorMessage }),
                    "AlreadyEnabled" => BadRequest(new { success = false, errorMessage }),
                    _ => BadRequest(new { success = false, errorMessage })
                };
            }

            return Ok(new { success = true, message = "Account enabled successfully" });
        }

        // POST /api/auth/forgot-password
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Email is required." });
            }

            var result = await _userUseCase.ForgotPasswordAsync(request.Email);

            return Ok(new
            {
                success = result.IsSuccess,
                message = result.Message
            });
        }

        // POST /api/auth/reset-password
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Token and password are required." });
            }

            var result = await _userUseCase.ResetPasswordAsync(request.Token, request.Password);

            if (!result.IsSuccess)
            {
                return BadRequest(new { success = false, message = result.Message });
            }

            return Ok(new
            {
                success = true,
                message = result.Message
            });
        }

        
    }
}
