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
    [ApiController]
    [Route("api/[controller]")]
    public class authController : ControllerBase
    {
        private readonly IUserUseCase _userUseCase;

        public authController(IUserUseCase userUseCase)
        {
            _userUseCase = userUseCase;
        }

        // Endpoints will be defined here later

        //Post: /api/auth/signup
        [HttpPost("signup")]
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

        // POST /api/auth/signin
        [HttpPost("signin")]
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


        [HttpPost("refresh-token")]
        [AllowAnonymous]
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
    }
}
