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

            return Ok(result);
        }


        // POST /api/auth/refresh-token
        // Body: { "refreshToken": "..." }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] string RefreshToken)
        {
            var result = await _userUseCase.RefreshTokenAsync(RefreshToken);

            if (!result.IsSuccess)
                return Unauthorized(result);

            return Ok(result);
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

        [AllowAnonymous]
        [HttpPost("google-oauth2-signin")]
        public async Task<IActionResult> GoogleOauthSignIn ([FromBody] GoogleSigninRequest request)
        {
            var result = await _userUseCase.GoogleOAuth2SignInAsync(request);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        // PUT /api/auth/users
        [Authorize]
        [HttpPut("users")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserInfoRequest request)
        {
            // Extract userId from JWT token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = "Invalid or missing user ID in token." });
            }

            var result = await _userUseCase.UpdateUserInfoAsync(userId, request);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
