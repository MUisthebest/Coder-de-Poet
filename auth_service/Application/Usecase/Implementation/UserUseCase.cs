using auth_service.Application.Security;
using auth_service.Application.Usecase.Interface;
using auth_service.Domain.Repository;

namespace auth_service.Application.Usecase.Implementation
{
    public partial class UserUseCase : IUserUseCase
    {
        private readonly IUserRepository _userRepository;
        private readonly IJWTTokenProvidder _jwtTokenProvider;
        private readonly IBcryptPasswordHasher _passwordHasher;
        private readonly IGoogleTokenValidator _googleAuthService;

        public UserUseCase(
            IUserRepository userRepository,
            IJWTTokenProvidder jwtTokenProvider,
            IBcryptPasswordHasher passwordHasher,
            IGoogleTokenValidator googleAuthService)
        {
            _userRepository = userRepository;
            _jwtTokenProvider = jwtTokenProvider;
            _passwordHasher = passwordHasher;
            _googleAuthService = googleAuthService;
        }
    }
}
