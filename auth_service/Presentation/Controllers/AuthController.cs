using auth_service.Application.Usecase.Interface;
using auth_service.Application.Usecase.DTO;
using Microsoft.AspNetCore.Mvc;

/*
    This file contains Controller for authentication-related endpoints.
    It uses IUserUseCase to handle the business logic.
*/

namespace auth_service.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserUseCase _userUseCase;

        public AuthController(IUserUseCase userUseCase)
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

        // PUT /api/auth/users/{id}
        [HttpPut("users")]
        public async Task<IActionResult> UpdateUser(
            Guid id,
            [FromBody] UpdateUserInfoRequest request)
        {
            var result = await _userUseCase.UpdateUserInfoAsync(request);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }
    }
}
